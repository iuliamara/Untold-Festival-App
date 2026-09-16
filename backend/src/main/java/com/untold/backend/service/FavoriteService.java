package com.untold.backend.service;

import com.untold.backend.model.Artist;
import com.untold.backend.model.Favorite;
import com.untold.backend.model.User;
import com.untold.backend.repository.ArtistRepository;
import com.untold.backend.repository.FavoriteRepository;
import com.untold.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final UserRepository userRepository;
    private final ArtistRepository artistRepository;

    public FavoriteService(FavoriteRepository favoriteRepository, UserRepository userRepository, ArtistRepository artistRepository) {
        this.favoriteRepository = favoriteRepository;
        this.userRepository = userRepository;
        this.artistRepository = artistRepository;
    }

    @Transactional(readOnly = true)
    public List<Artist> getUserFavoriteArtists(Long userId) {
        return favoriteRepository.findByUserId(userId).stream()
                .map(Favorite::getArtist)
                .collect(Collectors.toList());
    }

    public Favorite addFavorite(Long userId, Long artistId) {
        return favoriteRepository.findByUserIdAndArtistId(userId, artistId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new RuntimeException("User not found with id " + userId));
                    Artist artist = artistRepository.findById(artistId)
                            .orElseThrow(() -> new RuntimeException("Artist not found with id " + artistId));

                    Favorite favorite = new Favorite();
                    favorite.setUser(user);
                    favorite.setArtist(artist);
                    return favoriteRepository.save(favorite);
                });
    }

    public void removeFavorite(Long userId, Long artistId) {
        favoriteRepository.deleteByUserIdAndArtistId(userId, artistId);
    }

    public boolean toggleFavorite(Long userId, Long artistId) {
        if (favoriteRepository.existsByUserIdAndArtistId(userId, artistId)) {
            favoriteRepository.deleteByUserIdAndArtistId(userId, artistId);
            return false;
        }
        addFavorite(userId, artistId);
        return true;
    }
}
