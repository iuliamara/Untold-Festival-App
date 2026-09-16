package com.untold.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TicketAnalyticsDto {
    private List<DailyVelocity> dailyVelocity;
    private List<CountryDemographics> countryDemographics;
    private GateCheckInStats checkInStats;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class DailyVelocity {
        private String date; // YYYY-MM-DD
        private Long ticketsSold;
        private Double revenue;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class CountryDemographics {
        private String country;
        private Long attendeeCount;
        private Double percentage;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    @Builder
    public static class GateCheckInStats {
        private Long totalTickets;
        private Long totalCheckedIn;
        private Double checkInPercentage;
        private Double averageAge;
    }
}
