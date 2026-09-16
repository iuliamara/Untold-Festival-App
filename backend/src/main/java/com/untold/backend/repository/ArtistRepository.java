package com.untold.backend.repository;

import com.untold.backend.model.Artist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ArtistRepository extends JpaRepository<Artist, Long> {
    List<Artist> findByGenreIgnoreCase(String genre);
    List<Artist> findByNameContainingIgnoreCase(String name);
    Optional<Artist> findBySpotifyId(String spotifyId);
}
