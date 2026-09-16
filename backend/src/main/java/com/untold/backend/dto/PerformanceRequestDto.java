package com.untold.backend.dto;

import com.untold.backend.model.PerformanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceRequestDto {
    private Long artistId;
    private Long stageId;
    private OffsetDateTime startTime;
    private OffsetDateTime endTime;
    private PerformanceStatus status;
}
