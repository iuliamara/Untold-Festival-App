package com.untold.backend.configs;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Enables Spring's caching. The only cache today is {@code spotify-tracks}: Spotify's Client
 * Credentials API is rate limited, so top-track lookups (keyed by artist name) are memoized in
 * process instead of hitting Spotify on every Lineup card expand. An in-memory
 * {@link ConcurrentMapCacheManager} is enough here — no external cache dependency needed.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String SPOTIFY_TRACKS_CACHE = "spotify-tracks";

    @Bean
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager(SPOTIFY_TRACKS_CACHE);
    }
}
