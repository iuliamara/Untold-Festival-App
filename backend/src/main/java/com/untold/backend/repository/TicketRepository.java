package com.untold.backend.repository;
import com.untold.backend.model.*;
import com.untold.backend.repository.*;
import com.untold.backend.service.*;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findDistinctByAppOrdersUserId(Long userId);
    List<Ticket> findByAttendeeId(Long personId);
    long countByTicketType(String ticketType);

    long countByCheckInCompleted(boolean checkInCompleted);

    @Query("SELECT CAST(t.purchaseDate as date), COUNT(t), SUM(COALESCE(t.price, 0.0)) FROM Ticket t WHERE t.purchaseDate IS NOT NULL GROUP BY CAST(t.purchaseDate as date) ORDER BY CAST(t.purchaseDate as date) ASC")
    List<Object[]> getDailySalesVelocity();

    @Query("SELECT COALESCE(p.country, 'Unknown'), COUNT(t) FROM Ticket t LEFT JOIN t.attendee p GROUP BY COALESCE(p.country, 'Unknown') ORDER BY COUNT(t) DESC")
    List<Object[]> getCountryDemographics();

    @Query("SELECT AVG(YEAR(CURRENT_DATE) - YEAR(p.dateOfBirth)) FROM Ticket t JOIN t.attendee p WHERE p.dateOfBirth IS NOT NULL")
    Double getAverageAttendeeAge();
}
