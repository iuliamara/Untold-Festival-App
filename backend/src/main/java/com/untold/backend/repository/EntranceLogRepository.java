package com.untold.backend.repository;

import com.untold.backend.model.EntranceDirection;
import com.untold.backend.model.EntranceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface EntranceLogRepository extends JpaRepository<EntranceLog, Long> {

    @Query("SELECT e FROM EntranceLog e WHERE e.bracelet.id = :braceletId AND e.entryTimestamp >= :since " +
            "ORDER BY e.entryTimestamp DESC LIMIT 1")
    Optional<EntranceLog> findLatestByBraceletIdAndEntryTimestampAfter(
            @Param("braceletId") Long braceletId,
            @Param("since") LocalDateTime since
    );

    long countByEntryTimestampAfterAndDirection(LocalDateTime since, EntranceDirection direction);
}
