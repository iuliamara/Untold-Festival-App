package com.untold.backend.service;

import com.untold.backend.configs.CacheConfig;
import com.untold.backend.dto.SpotifyTrackDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Talks to the Spotify Web API with the Client Credentials flow (no user login — app-level access,
 * fine for public catalog data like an artist's top tracks). One access token is cached in memory
 * and refreshed only when it expires; top-track lookups are additionally cached by
 * {@link org.springframework.cache.annotation.Cacheable} so repeated Lineup expands don't burn
 * through Spotify's rate limit.
 */
@Service
public class SpotifyService {

    private static final Logger log = LoggerFactory.getLogger(SpotifyService.class);

    private static final String TOKEN_URL = "https://accounts.spotify.com/api/token";
    private static final String API_BASE = "https://api.spotify.com/v1";
    private static final int MAX_TRACKS = 6;

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${spotify.client.id:}")
    private String clientId;

    @Value("${spotify.client.secret:}")
    private String clientSecret;

    @Value("${spotify.market:RO}")
    private String market;

    // Cached app token + its absolute expiry. volatile so a refresh on one thread is visible to others.
    private volatile String cachedToken;
    private volatile Instant tokenExpiresAt = Instant.EPOCH;

    /**
     * Top {@value #MAX_TRACKS} tracks for the given artist name. Cached by name; transient failures
     * (empty result) are intentionally NOT cached so a later call can retry.
     */
    @Cacheable(value = CacheConfig.SPOTIFY_TRACKS_CACHE, key = "#artistName.toLowerCase()",
            unless = "#result == null || #result.isEmpty()")
    public List<SpotifyTrackDto> getTopTracks(String artistName) {
        if (!isConfigured()) {
            log.warn("Spotify credentials are not configured (spotify.client.id / spotify.client.secret); "
                    + "returning no tracks for '{}'.", artistName);
            return List.of();
        }
        try {
            return searchTracks(artistName);
        } catch (Exception e) {
            log.warn("Spotify top-tracks lookup failed for '{}': {}", artistName, e.getMessage());
            return List.of();
        }
    }

    private boolean isConfigured() {
        return StringUtils.hasText(clientId) && StringUtils.hasText(clientSecret);
    }

    // ---- Client Credentials token ---------------------------------------------------------------

    private synchronized String getAccessToken() {
        // 30s safety margin so we never present a token that expires mid-request.
        if (cachedToken != null && Instant.now().isBefore(tokenExpiresAt.minusSeconds(30))) {
            return cachedToken;
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth(clientId, clientSecret);
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");

        ResponseEntity<Map> response = restTemplate.postForEntity(
                TOKEN_URL, new HttpEntity<>(body, headers), Map.class);

        Map<String, Object> data = response.getBody();
        if (data == null || data.get("access_token") == null) {
            throw new IllegalStateException("Spotify token endpoint returned no access_token");
        }

        cachedToken = (String) data.get("access_token");
        int expiresIn = data.get("expires_in") instanceof Number n ? n.intValue() : 3600;
        tokenExpiresAt = Instant.now().plusSeconds(expiresIn);
        return cachedToken;
    }

    private HttpEntity<Void> authorizedGet() {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(getAccessToken());
        return new HttpEntity<>(headers);
    }

    // ---- Catalog lookups ------------------------------------------------------------------------

    /**
     * The dedicated {@code /artists/{id}/top-tracks} endpoint returns 403 for development-mode apps,
     * so we approximate "top tracks" with a track search. We first scope it to the exact artist
     * ({@code artist:"name"}, most precise), and if that returns nothing — some regional artists
     * aren't matched by the strict field filter — fall back to a plain-text search on the name.
     */
    private List<SpotifyTrackDto> searchTracks(String artistName) {
        List<SpotifyTrackDto> strict = querySearch("artist:\"" + artistName + "\"");
        if (!strict.isEmpty()) return strict;
        return querySearch(artistName);
    }

    @SuppressWarnings("unchecked")
    private List<SpotifyTrackDto> querySearch(String query) {
        // Build a URI (not a String): RestTemplate would otherwise percent-encode the already-encoded
        // string a second time, mangling the query into something that matches nothing.
        URI url = UriComponentsBuilder.fromHttpUrl(API_BASE + "/search")
                .queryParam("q", query)
                .queryParam("type", "track")
                .queryParam("limit", MAX_TRACKS)
                .queryParam("market", market)
                .encode()
                .build()
                .toUri();

        ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, authorizedGet(), Map.class);
        Map<String, Object> body = response.getBody();
        if (body == null) return List.of();

        Map<String, Object> tracksObj = (Map<String, Object>) body.get("tracks");
        if (tracksObj == null) return List.of();
        List<Map<String, Object>> items = (List<Map<String, Object>>) tracksObj.get("items");
        if (items == null || items.isEmpty()) return List.of();

        List<SpotifyTrackDto> result = new ArrayList<>();
        for (Map<String, Object> track : items) {
            if (result.size() >= MAX_TRACKS) break;
            String spotifyUrl = null;
            Object externalUrls = track.get("external_urls");
            if (externalUrls instanceof Map<?, ?> ext) {
                Object href = ext.get("spotify");
                spotifyUrl = href != null ? href.toString() : null;
            }
            result.add(SpotifyTrackDto.builder()
                    .id((String) track.get("id"))
                    .title((String) track.get("name"))
                    .previewUrl((String) track.get("preview_url")) // often null — Spotify deprecated previews
                    .spotifyUrl(spotifyUrl)
                    .build());
        }
        return result;
    }
}
