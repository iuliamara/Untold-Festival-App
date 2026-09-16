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
public class CrowdReportDto {
    private Long id;
    private Long mapPinId;
    private String mapPinName;
    private String mapPinType;
    private CrowdDensityLevel densityLevel;
    private String reportedBy;
    private String notes;
    private LocalDateTime reportedAt;
}
