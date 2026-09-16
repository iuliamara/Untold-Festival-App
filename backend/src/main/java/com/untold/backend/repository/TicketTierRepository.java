package com.untold.backend.repository;

import com.untold.backend.model.TicketTier;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TicketTierRepository extends JpaRepository<TicketTier, String> {
}
