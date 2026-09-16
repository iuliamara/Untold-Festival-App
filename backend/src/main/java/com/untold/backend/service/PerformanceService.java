package com.untold.backend.service;

import com.untold.backend.dto.PerformanceDto;
import com.untold.backend.dto.PerformanceRequestDto;
import com.untold.backend.exception.ResourceNotFoundException;
import com.untold.backend.model.Artist;
import com.untold.backend.model.MapPin;
import com.untold.backend.model.Performance;
import com.untold.backend.model.PerformanceStatus;
import com.untold.backend.repository.ArtistRepository;
import com.untold.backend.repository.MapPinRepository;
import com.untold.backend.repository.PerformanceRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PerformanceService {

    private final PerformanceRepository performanceRepository;
    private final ArtistRepository artistRepository;
    private final MapPinRepository mapPinRepository;

    public PerformanceService(PerformanceRepository performanceRepository,
                              ArtistRepository artistRepository,
                              MapPinRepository mapPinRepository) {
        this.performanceRepository = performanceRepository;
        this.artistRepository = artistRepository;
        this.mapPinRepository = mapPinRepository;
    }

    @Transactional(readOnly = true)
    public List<PerformanceDto> getAllPerformances(OffsetDateTime start, OffsetDateTime end, Long stageId, Long artistId) {
        List<Performance> performances;

        if (start != null && end != null) {
            performances = performanceRepository.findPerformancesInWindow(start, end);
        } else {
            performances = performanceRepository.findAll();
        }

        // Apply in-memory filters if other optional parameters are provided
        return performances.stream()
                .filter(p -> stageId == null || p.getStage().getId().equals(stageId))
                .filter(p -> artistId == null || p.getArtist().getId().equals(artistId))
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public PerformanceDto getPerformanceById(Long id) {
        Performance performance = performanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Performance not found with id: " + id));
        return convertToDto(performance);
    }

    public PerformanceDto createPerformance(PerformanceRequestDto request) {
        validateRequest(request, null);

        Artist artist = artistRepository.findById(request.getArtistId())
                .orElseThrow(() -> new ResourceNotFoundException("Artist not found with id: " + request.getArtistId()));

        MapPin stage = mapPinRepository.findById(request.getStageId())
                .orElseThrow(() -> new ResourceNotFoundException("Stage not found with id: " + request.getStageId()));

        Performance performance = Performance.builder()
                .artist(artist)
                .stage(stage)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(request.getStatus() != null ? request.getStatus() : PerformanceStatus.SCHEDULED)
                .build();

        Performance saved = performanceRepository.save(performance);
        return convertToDto(saved);
    }

    public PerformanceDto updatePerformance(Long id, PerformanceRequestDto request) {
        Performance performance = performanceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Performance not found with id: " + id));

        validateRequest(request, id);

        Artist artist = artistRepository.findById(request.getArtistId())
                .orElseThrow(() -> new ResourceNotFoundException("Artist not found with id: " + request.getArtistId()));

        MapPin stage = mapPinRepository.findById(request.getStageId())
                .orElseThrow(() -> new ResourceNotFoundException("Stage not found with id: " + request.getStageId()));

        performance.setArtist(artist);
        performance.setStage(stage);
        performance.setStartTime(request.getStartTime());
        performance.setEndTime(request.getEndTime());
        if (request.getStatus() != null) {
            performance.setStatus(request.getStatus());
        }

        Performance saved = performanceRepository.save(performance);
        return convertToDto(saved);
    }

    public void deletePerformance(Long id) {
        if (!performanceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Performance not found with id: " + id);
        }
        performanceRepository.deleteById(id);
    }

    private void validateRequest(PerformanceRequestDto request, Long excludeId) {
        if (request.getArtistId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Artist ID is required");
        }
        if (request.getStageId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Stage ID is required");
        }
        if (request.getStartTime() == null || request.getEndTime() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start and end times are required");
        }
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Start time must be before end time");
        }

        // Validate that the stage pin is actually of type 'STAGE'
        MapPin stage = mapPinRepository.findById(request.getStageId())
                .orElseThrow(() -> new ResourceNotFoundException("Stage pin not found with id: " + request.getStageId()));
        if (!"STAGE".equalsIgnoreCase(stage.getType())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Selected map pin is not of type STAGE");
        }

        // Hard Block: Overlapping sets on the SAME stage
        List<Performance> overlapsOnStage = performanceRepository.findOverlappingStageSets(
                request.getStageId(),
                request.getStartTime(),
                request.getEndTime(),
                excludeId
        );
        if (!overlapsOnStage.isEmpty()) {
            Performance clashing = overlapsOnStage.get(0);
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    String.format("Stage Clash: The stage '%s' already has a performance scheduled (%s) from %s to %s.",
                            stage.getName(),
                            clashing.getArtist().getName(),
                            clashing.getStartTime().toLocalTime(),
                            clashing.getEndTime().toLocalTime()));
        }
    }

    private PerformanceDto convertToDto(Performance p) {
        // Calculate soft conflicts (overlaps for the same artist on other stages)
        List<Performance> artistConflicts = performanceRepository.findOverlappingArtistSets(
                p.getArtist().getId(),
                p.getStartTime(),
                p.getEndTime(),
                p.getId()
        );

        return PerformanceDto.builder()
                .id(p.getId())
                .artistId(p.getArtist().getId())
                .artistName(p.getArtist().getName())
                .artistImageUrl(p.getArtist().getImageUrl())
                .stageId(p.getStage().getId())
                .stageName(p.getStage().getName())
                .startTime(p.getStartTime())
                .endTime(p.getEndTime())
                .status(p.getStatus())
                .hasConflict(!artistConflicts.isEmpty())
                .build();
    }
}
