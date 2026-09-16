package com.untold.backend.controller;

import com.untold.backend.dto.ArtistDto;
import com.untold.backend.dto.SongDto;
import com.untold.backend.dto.SpotifyTrackDto;
import com.untold.backend.dto.response.ApiResponse;
import com.untold.backend.model.Artist;
import com.untold.backend.model.Song;
import com.untold.backend.service.ArtistService;
import com.untold.backend.service.SpotifyService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/artists")
public class ArtistController {

    private final ArtistService artistService;
    private final SpotifyService spotifyService;

    public ArtistController(ArtistService artistService, SpotifyService spotifyService) {
        this.artistService = artistService;
        this.spotifyService = spotifyService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ArtistDto>>> getAllArtists(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String genre) {
        List<ArtistDto> response = artistService.getAllArtists(name, genre).stream()
                .map(this::toArtistDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Artists retrieved successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ArtistDto>> getArtistById(@PathVariable Long id) {
        return artistService.getArtistById(id)
                .map(artist -> ResponseEntity.ok(ApiResponse.success("Artist found", toArtistDto(artist))))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.notFound("Artist not found with id: " + id)));
    }

    /**
     * Live top-3 Spotify tracks for an artist, looked up by the artist's name. Cached in the service
     * layer ({@code spotify-tracks}) so repeated Lineup card expands don't hit Spotify's rate limit.
     */
    @GetMapping("/{id}/spotify-tracks")
    public ResponseEntity<ApiResponse<List<SpotifyTrackDto>>> getSpotifyTracks(@PathVariable Long id) {
        return artistService.getArtistById(id)
                .map(artist -> ResponseEntity.ok(ApiResponse.success(
                        "Spotify tracks retrieved", spotifyService.getTopTracks(artist.getName()))))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.notFound("Artist not found with id: " + id)));
    }

    @PostMapping("/sync/{spotifyId}")
    public ResponseEntity<ApiResponse<ArtistDto>> syncArtistFromSpotify(@PathVariable String spotifyId) {
        try {
            Artist syncedArtist = artistService.syncArtistFromSpotify(spotifyId);
            return ResponseEntity.ok(ApiResponse.success("Artist synced from Spotify successfully", toArtistDto(syncedArtist)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("Failed to sync from Spotify: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ArtistDto>> createArtist(@RequestBody Artist artist) {
        try {
            Artist created = artistService.createArtist(artist);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Artist created successfully", toArtistDto(created)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ArtistDto>> updateArtist(@PathVariable Long id, @RequestBody Artist artist) {
        try {
            Artist updated = artistService.updateArtist(id, artist);
            return ResponseEntity.ok(ApiResponse.success("Artist updated successfully", toArtistDto(updated)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.notFound(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteArtist(@PathVariable Long id) {
        try {
            artistService.deleteArtist(id);
            return ResponseEntity.ok(ApiResponse.success("Artist deleted successfully", null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.notFound(e.getMessage()));
        }
    }

    @PostMapping("/{artistId}/songs")
    public ResponseEntity<ApiResponse<SongDto>> addSongToArtist(@PathVariable Long artistId, @RequestBody Song song) {
        try {
            Song added = artistService.addSongToArtist(artistId, song);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Song added to playlist successfully", toSongDto(added)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    @DeleteMapping("/{artistId}/songs/{songId}")
    public ResponseEntity<ApiResponse<Void>> removeSongFromArtist(@PathVariable Long artistId, @PathVariable Long songId) {
        try {
            artistService.removeSongFromArtist(artistId, songId);
            return ResponseEntity.ok(ApiResponse.success("Song removed from playlist successfully", null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error(e.getMessage()));
        }
    }

    private ArtistDto toArtistDto(Artist artist) {
        List<SongDto> songDtos = null;
        if (artist.getSongs() != null) {
            songDtos = artist.getSongs().stream()
                    .map(this::toSongDto)
                    .collect(Collectors.toList());
        }
        return ArtistDto.builder()
                .id(artist.getId())
                .name(artist.getName())
                .genre(artist.getGenre())
                .biography(artist.getBiography())
                .imageUrl(artist.getImageUrl())
                .spotifyId(artist.getSpotifyId())
                .songs(songDtos)
                .build();
    }

    private SongDto toSongDto(Song song) {
        return SongDto.builder()
                .id(song.getId())
                .title(song.getTitle())
                .durationSeconds(song.getDurationSeconds())
                .spotifyId(song.getSpotifyId())
                .previewUrl(song.getPreviewUrl())
                .build();
    }
}
