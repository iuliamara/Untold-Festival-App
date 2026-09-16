package com.untold.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CategoryStatsDto {
    private Long sold;
    private Long capacity;
    private Double revenue;
    private Double avgPrice;
    private Double percentage;
}
