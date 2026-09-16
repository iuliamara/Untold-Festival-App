package com.untold.backend.controller;

import com.untold.backend.dto.ArtistDto;
import com.untold.backend.dto.SongDto;
import com.untold.backend.dto.response.ApiResponse;
import com.untold.backend.model.Artist;
import com.untold.backend.model.Song;
import com.untold.backend.model.User;
import com.untold.backend.repository.UserRepository;
import com.untold.backend.service.FavoriteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/favorites")
public class FavoriteController {

    private final FavoriteService favoriteService;
    private final UserRepository userRepository;

    public FavoriteController(FavoriteService favoriteService, UserRepository userRepository) {
        this.favoriteService = favoriteService;
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<List<ArtistDto>>> getMyFavorites(Authentication authentication) {
        return withCurrentUser(authentication, user -> {
            List<ArtistDto> favorites = favoriteService.getUserFavoriteArtists(user.getId()).stream()
                    .map(this::toArtistDto)
                    .collect(Collectors.toList());
            return ResponseEntity.ok(ApiResponse.success("Favorites retrieved", favorites));
        });
    }

    @PostMapping("/{artistId}")
    public ResponseEntity<ApiResponse<Void>> addFavorite(Authentication authentication, @PathVariable Long artistId) {
        return withCurrentUser(authentication, user -> {
            try {
                favoriteService.addFavorite(user.getId(), artistId);
                return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Artist added to favorites", null));
            } catch (RuntimeException e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.notFound(e.getMessage()));
            }
        });
    }

    @DeleteMapping("/{artistId}")
    public ResponseEntity<ApiResponse<Void>> removeFavorite(Authentication authentication, @PathVariable Long artistId) {
        return withCurrentUser(authentication, user -> {
            favoriteService.removeFavorite(user.getId(), artistId);
            return ResponseEntity.ok(ApiResponse.success("Artist removed from favorites", null));
        });
    }

    @PostMapping("/{artistId}/toggle")
    public ResponseEntity<ApiResponse<Boolean>> toggleFavorite(Authentication authentication, @PathVariable Long artistId) {
        return withCurrentUser(authentication, user -> {
            try {
                boolean favorited = favoriteService.toggleFavorite(user.getId(), artistId);
                return ResponseEntity.ok(ApiResponse.success(favorited ? "Artist favorited" : "Artist unfavorited", favorited));
            } catch (RuntimeException e) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.notFound(e.getMessage()));
            }
        });
    }

    private <T> ResponseEntity<ApiResponse<T>> withCurrentUser(Authentication authentication, java.util.function.Function<User, ResponseEntity<ApiResponse<T>>> action) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.unauthorized("Authentication required"));
        }
        User user = userRepository.findByEmail(authentication.getName())
                .orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.unauthorized("User not found"));
        }
        return action.apply(user);
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
