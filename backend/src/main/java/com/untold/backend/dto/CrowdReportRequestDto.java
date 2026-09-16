package com.untold.backend.dto;

import com.untold.backend.model.CrowdDensityLevel;
import lombok.Data;

@Data
public class CrowdReportRequestDto {
    private Long mapPinId;
    private CrowdDensityLevel densityLevel;
    private String reportedBy;
    private String notes;
}
