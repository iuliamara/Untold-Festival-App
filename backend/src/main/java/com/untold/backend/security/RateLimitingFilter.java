package com.untold.backend.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.untold.backend.dto.response.ApiResponse;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Simple per-IP token-bucket rate limiter for the ticket endpoints, so a single client (or bot)
 * hammering /api/tickets can't starve the DB connection pool for everyone else.
 *
 * Deliberately NOT a Spring Security filter: it runs (via {@link RateLimitingConfig}) as a plain
 * servlet filter with the highest possible precedence, so abusive requests are rejected before
 * they reach authentication, JSON parsing, or Hibernate at all.
 */
public class RateLimitingFilter extends OncePerRequestFilter {

    // Burst capacity is higher than the sustained refill rate: a legitimate My Account page load
    // fires one dynamic-QR request per owned ticket in the same instant, which is a burst, not
    // abuse. Sustained hammering is still capped at REFILL_TOKENS per second.
    private static final int BURST_CAPACITY = 10;
    private static final int REFILL_TOKENS = 5;
    private static final Duration REFILL_PERIOD = Duration.ofSeconds(1);

    private final ConcurrentMap<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Counter rejectedCounter;

    /**
     * This filter runs at the raw servlet level, before Spring MVC's DispatcherServlet — so
     * rejected requests never reach Micrometer's built-in http.server.requests instrumentation.
     * Without this counter, "requests we blocked" would be invisible in Prometheus/Grafana even
     * though the rate limiter is working correctly.
     */
    public RateLimitingFilter(MeterRegistry meterRegistry) {
        this.rejectedCounter = Counter.builder("ratelimit.rejected")
                .description("Requests rejected by the rate limiter (HTTP 429)")
                .tag("endpoint", "tickets")
                .register(meterRegistry);
    }

    /**
     * CORS preflights (OPTIONS) are browser plumbing, not client traffic: every authenticated
     * fetch from the frontend sends one before the real request. Counting them would silently
     * double each client's cost per call, and a rate-limited preflight comes back without CORS
     * headers — the browser then reports an unreadable network error instead of a 429.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        Bucket bucket = buckets.computeIfAbsent(resolveClientKey(request), key -> newBucket());

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
            return;
        }

        rejectedCounter.increment();
        response.setStatus(429); // HttpStatus.TOO_MANY_REQUESTS
        response.setContentType("application/json;charset=UTF-8");
        // This filter runs before the CorsFilter, so the rejection must carry its own CORS
        // headers — otherwise browsers refuse to expose the 429 to frontend code and clients
        // can't distinguish "slow down and retry" from a dead network.
        String origin = request.getHeader("Origin");
        if (origin != null) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setHeader("Vary", "Origin");
        }
        response.getWriter().write(objectMapper.writeValueAsString(
                ApiResponse.error("Prea multe cereri. Încearcă din nou peste o secundă.")
        ));
    }

    private Bucket newBucket() {
        Bandwidth limit = Bandwidth.classic(BURST_CAPACITY, Refill.greedy(REFILL_TOKENS, REFILL_PERIOD));
        return Bucket.builder().addLimit(limit).build();
    }

    /** Client IP, honoring X-Forwarded-For for requests that arrive through a reverse proxy. */
    private String resolveClientKey(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
