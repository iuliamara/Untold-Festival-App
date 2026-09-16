package com.untold.backend.repository;

import com.untold.backend.model.VenueMap;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface VenueMapRepository extends JpaRepository<VenueMap, Long> {
    Optional<VenueMap> findFirstByIsActiveTrueOrderByCreatedAtDesc();
}
