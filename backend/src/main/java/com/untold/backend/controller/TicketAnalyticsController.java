package com.untold.backend.controller;

import com.untold.backend.dto.TicketAnalyticsDto;
import com.untold.backend.dto.response.ApiResponse;
import com.untold.backend.repository.TicketRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/admin/analytics")
public class TicketAnalyticsController {

    @Autowired
    private TicketRepository ticketRepository;

    @GetMapping("/summary")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TicketAnalyticsDto>> getAnalyticsSummary() {
        try {
            // 1. Fetch sales timeline
            List<Object[]> velocityData = ticketRepository.getDailySalesVelocity();
            List<TicketAnalyticsDto.DailyVelocity> velocityList = new ArrayList<>();
            for (Object[] row : velocityData) {
                velocityList.add(TicketAnalyticsDto.DailyVelocity.builder()
                        .date(row[0] != null ? row[0].toString() : "Unknown")
                        .ticketsSold(((Number) row[1]).longValue())
                        .revenue(((Number) row[2]).doubleValue())
                        .build());
            }

            // 2. Fetch country demographics
            List<Object[]> countryData = ticketRepository.getCountryDemographics();
            long grandTotal = ticketRepository.count();
            List<TicketAnalyticsDto.CountryDemographics> countryList = new ArrayList<>();
            for (Object[] row : countryData) {
                long count = ((Number) row[1]).longValue();
                double pct = grandTotal > 0 ? ((double) count / grandTotal) * 100.0 : 0.0;
                countryList.add(TicketAnalyticsDto.CountryDemographics.builder()
                        .country(row[0] != null ? row[0].toString() : "Unknown")
                        .attendeeCount(count)
                        .percentage(pct)
                        .build());
            }

            // 3. Fetch check-in status and average age
            long checkedIn = ticketRepository.countByCheckInCompleted(true);
            Double avgAge = ticketRepository.getAverageAttendeeAge();
            double checkInPercentage = grandTotal > 0 ? ((double) checkedIn / grandTotal) * 100.0 : 0.0;

            TicketAnalyticsDto.GateCheckInStats checkInStats = TicketAnalyticsDto.GateCheckInStats.builder()
                    .totalTickets(grandTotal)
                    .totalCheckedIn(checkedIn)
                    .checkInPercentage(checkInPercentage)
                    .averageAge(avgAge != null ? avgAge : 0.0)
                    .build();

            // Assemble DTO
            TicketAnalyticsDto payload = TicketAnalyticsDto.builder()
                    .dailyVelocity(velocityList)
                    .countryDemographics(countryList)
                    .checkInStats(checkInStats)
                    .build();

            return ResponseEntity.ok(ApiResponse.success("Analytics summary retrieved successfully", payload));
        } catch (RuntimeException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
