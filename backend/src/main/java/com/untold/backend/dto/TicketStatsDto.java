package com.untold.backend.dto;

import com.untold.backend.model.TicketCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.Map;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TicketStatsDto {
    private Double totalRevenue;
    private Long totalSold;
    private Map<TicketCategory, CategoryStatsDto> categoryStats;
}
