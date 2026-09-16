package com.untold.backend.dto;

import com.untold.backend.model.TicketCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TicketTierStatsDto {
    private TicketCategory category;
    private Long sold;
    private Long capacity;
    private Double avgPrice;
}
