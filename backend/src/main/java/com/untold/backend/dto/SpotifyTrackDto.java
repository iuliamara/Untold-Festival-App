package com.untold.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A single Spotify track surfaced on the Lineup page. {@code previewUrl} may be {@code null} —
 * Spotify does not return a 30s preview for every track/market — so the frontend must handle a
 * missing preview by disabling the play button and falling back to the "Listen on Spotify" link.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpotifyTrackDto {
    private String id;
    private String title;
    private String previewUrl;   // 30s MP3 preview; nullable
    private String spotifyUrl;   // external Spotify page for the track
}
