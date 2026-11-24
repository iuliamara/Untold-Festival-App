package com.untold.backend.configs;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpMethod;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.untold.backend.security.JwtAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable) // Disable CSRF for stateless REST APIs
            .cors(org.springframework.security.config.Customizer.withDefaults()) // Uses the global CorsFilter bean
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // No sessions
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers(HttpMethod.GET,
                    "/api/artists", "/api/artists/**",
                    "/api/performances", "/api/performances/**",
                    "/api/festival/current-day", "/api/map/active",
                    "/api/tickets/tiers", "/api/flash-sale/status",
                    "/api/crowd-reports", "/api/crowd-reports/**").permitAll()
                .requestMatchers("/api/users/me/**").authenticated()
                .requestMatchers("/api/admin/**", "/api/users/**", "/api/persons/**",
                    "/api/map/**", "/api/crowd-reports/**", "/api/artists/**").hasRole("ADMIN")
                .requestMatchers("/api/favorites/**", "/api/my-schedule/**").authenticated()
                .requestMatchers("/api/tickets/validate-qr", "/api/tickets/stats/**").hasRole("ADMIN")
                .requestMatchers("/api/tickets/**", "/api/payment/**", "/api/flash-sale/**").authenticated()
                .requestMatchers("/uploads/**").permitAll() // Allow public access to uploaded map images
                .requestMatchers("/actuator/**").permitAll() // Prometheus scraping + health checks
                .requestMatchers("/ws/**").permitAll() // Allow all SockJS/WebSocket upgrade routes
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Allow both frontend addresses and loopback IPs (including port 5175, dynamically assigned by Vite)
        configuration.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:5176",
            "http://localhost:5177",
            "http://localhost:5178",
            "http://localhost:8100",
            "http://localhost:8101",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174",
            "http://127.0.0.1:5175",
            "http://127.0.0.1:5176",
            "http://127.0.0.1:5177",
            "http://127.0.0.1:5178",
            "http://127.0.0.1:8100",
            "http://127.0.0.1:8101",
            "http://localhost",
            "https://localhost",
            "capacitor://localhost",
            "ionic://localhost",
            "http://localhost:8080"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return new CorsFilter(source);
    }
}
