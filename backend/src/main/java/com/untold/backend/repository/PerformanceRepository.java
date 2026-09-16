package com.untold.backend.repository;

import com.untold.backend.model.Performance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface PerformanceRepository extends JpaRepository<Performance, Long> {

    List<Performance> findByStageId(Long stageId);

    List<Performance> findByArtistId(Long artistId);

    // Queries overlapping performances on a specific stage (excluding a given performance ID during update)
    @Query("SELECT p FROM Performance p WHERE p.stage.id = :stageId AND " +
           "p.startTime < :endTime AND p.endTime > :startTime AND " +
           "(:excludeId IS NULL OR p.id <> :excludeId)")
    List<Performance> findOverlappingStageSets(
            @Param("stageId") Long stageId,
            @Param("startTime") OffsetDateTime startTime,
            @Param("endTime") OffsetDateTime endTime,
            @Param("excludeId") Long excludeId
    );

    // Queries overlapping performances for a specific artist (excluding a given performance ID during update)
    @Query("SELECT p FROM Performance p WHERE p.artist.id = :artistId AND " +
           "p.startTime < :endTime AND p.endTime > :startTime AND " +
           "(:excludeId IS NULL OR p.id <> :excludeId)")
    List<Performance> findOverlappingArtistSets(
            @Param("artistId") Long artistId,
            @Param("startTime") OffsetDateTime startTime,
            @Param("endTime") OffsetDateTime endTime,
            @Param("excludeId") Long excludeId
    );

    // Dynamic filtering by time window (for logical days)
    @Query("SELECT p FROM Performance p WHERE p.startTime >= :start AND p.startTime < :end ORDER BY p.startTime ASC")
    List<Performance> findPerformancesInWindow(
            @Param("start") OffsetDateTime start,
            @Param("end") OffsetDateTime end
    );
}
