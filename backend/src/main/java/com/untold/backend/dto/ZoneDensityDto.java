package com.untold.backend.dto;

import com.untold.backend.model.CrowdDensityLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ZoneDensityDto {
    private Long mapPinId;
    private String mapPinName;
    private String mapPinType;
    private CrowdDensityLevel currentLevel;
    private double averageScore;
    private int reportCount;
    private LocalDateTime lastReportedAt;
    private String lastReportedBy;
}
