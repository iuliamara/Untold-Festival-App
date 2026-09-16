package com.untold.backend.service;

import com.untold.backend.exception.ResourceNotFoundException;
import com.untold.backend.model.Artist;
import com.untold.backend.model.Song;
import com.untold.backend.repository.ArtistRepository;
import com.untold.backend.repository.SongRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class ArtistService {

    private final ArtistRepository artistRepository;
    private final SongRepository songRepository;
    private final AppleMusicSyncService appleMusicSyncService;

    public ArtistService(ArtistRepository artistRepository, 
                         SongRepository songRepository, 
                         AppleMusicSyncService appleMusicSyncService) {
        this.artistRepository = artistRepository;
        this.songRepository = songRepository;
        this.appleMusicSyncService = appleMusicSyncService;
    }

    @Transactional(readOnly = true)
    public List<Artist> getAllArtists(String name, String genre) {
        if (name != null && !name.trim().isEmpty()) {
            return artistRepository.findByNameContainingIgnoreCase(name);
        }
        if (genre != null && !genre.trim().isEmpty()) {
            return artistRepository.findByGenreIgnoreCase(genre);
        }
        return artistRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<Artist> getArtistById(Long id) {
        return artistRepository.findById(id);
    }

    public Artist createArtist(Artist artist) {
        return artistRepository.save(artist);
    }

    public Artist updateArtist(Long id, Artist artistDetails) {
        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Artist not found with id: " + id));
        
        artist.setName(artistDetails.getName());
        artist.setGenre(artistDetails.getGenre());
        artist.setBiography(artistDetails.getBiography());
        artist.setImageUrl(artistDetails.getImageUrl());
        artist.setSpotifyId(artistDetails.getSpotifyId());
        
        return artistRepository.save(artist);
    }

    public void deleteArtist(Long id) {
        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Artist not found with id: " + id));
        artistRepository.delete(artist);
    }

    public Song addSongToArtist(Long artistId, Song song) {
        Artist artist = artistRepository.findById(artistId)
                .orElseThrow(() -> new ResourceNotFoundException("Artist not found with id: " + artistId));
        
        song.setArtist(artist);
        Song savedSong = songRepository.save(song);
        
        artist.getSongs().add(savedSong);
        return savedSong;
    }

    public void removeSongFromArtist(Long artistId, Long songId) {
        Artist artist = artistRepository.findById(artistId)
                .orElseThrow(() -> new ResourceNotFoundException("Artist not found with id: " + artistId));
        
        Song song = songRepository.findById(songId)
                .orElseThrow(() -> new ResourceNotFoundException("Song not found with id: " + songId));
        
        if (!song.getArtist().getId().equals(artist.getId())) {
            throw new IllegalArgumentException("Song does not belong to the specified artist");
        }
        
        artist.getSongs().remove(song);
        songRepository.delete(song);
    }

    public Artist syncArtistFromSpotify(String spotifyId) {
        AppleMusicSyncService.SyncedArtistData appleData = appleMusicSyncService.fetchArtistAndTracks(spotifyId);

        // Check if artist already exists in our DB by Spotify ID (acting as generic external ID)
        Optional<Artist> existingArtistOpt = artistRepository.findBySpotifyId(spotifyId);
        Artist artist;

        if (existingArtistOpt.isPresent()) {
            artist = existingArtistOpt.get();
        } else {
            artist = new Artist();
            artist.setSpotifyId(spotifyId);
        }

        // Update profile fields
        artist.setName(appleData.getName());
        artist.setGenre(appleData.getGenre());
        artist.setBiography(appleData.getBiography());
        artist.setImageUrl(appleData.getImageUrl());

        // Save artist to generate ID if new, and initialize relations
        Artist savedArtist = artistRepository.save(artist);

        // Clear existing songs to replace with the fresh synced list
        savedArtist.getSongs().clear();
        artistRepository.flush(); // Flush so orphan songs are cleared in DB if orphanRemoval is active

        // Import the top tracks
        List<Song> newSongs = new ArrayList<>();
        for (AppleMusicSyncService.SyncedTrackData track : appleData.getTracks()) {
            Song song = new Song();
            song.setTitle(track.getTitle());
            song.setDurationSeconds(track.getDurationSeconds());
            song.setSpotifyId(track.getSpotifyId());
            song.setPreviewUrl(track.getPreviewUrl());
            song.setArtist(savedArtist);
            
            newSongs.add(song);
        }

        savedArtist.getSongs().addAll(newSongs);
        return artistRepository.save(savedArtist);
    }
}
