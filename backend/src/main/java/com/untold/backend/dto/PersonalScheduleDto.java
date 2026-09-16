package com.untold.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PersonalScheduleDto {
    private Long id;
    private String artistName;
    private String stageName;
    private String startTime;
    private String endTime;
    private Integer festivalDay;
    private Integer alarmOffset;
}
