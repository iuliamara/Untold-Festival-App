package com.untold.backend.configs;

import com.untold.backend.security.RateLimitingFilter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;

@Configuration
public class RateLimitingConfig {

    @Bean
    public FilterRegistrationBean<RateLimitingFilter> rateLimitingFilterRegistration(MeterRegistry meterRegistry) {
        FilterRegistrationBean<RateLimitingFilter> registration = new FilterRegistrationBean<>(new RateLimitingFilter(meterRegistry));
        // Ticket purchase/lookup is the endpoint most worth protecting from bots/scalpers.
        registration.addUrlPatterns("/api/tickets/*");
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }
}
