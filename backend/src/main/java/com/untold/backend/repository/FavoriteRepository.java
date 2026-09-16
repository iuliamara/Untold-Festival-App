package com.untold.backend.repository;

import com.untold.backend.model.Favorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteRepository extends JpaRepository<Favorite, Long> {
    List<Favorite> findByUserId(Long userId);
    Optional<Favorite> findByUserIdAndArtistId(Long userId, Long artistId);
    boolean existsByUserIdAndArtistId(Long userId, Long artistId);
    void deleteByUserIdAndArtistId(Long userId, Long artistId);
}
