package com.untold.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class BraceletDto {
    private Long id;
    private String rfidTag;
    private Double balance;
}
