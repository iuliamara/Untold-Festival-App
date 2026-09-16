package com.untold.backend.repository;

import com.untold.backend.model.MapPin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface MapPinRepository extends JpaRepository<MapPin, Long> {
}
