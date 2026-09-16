package com.untold.backend.repository;

import com.untold.backend.model.Bracelet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BraceletRepository extends JpaRepository<Bracelet, Long> {
    Optional<Bracelet> findByRfidTag(String rfidTag);
}
