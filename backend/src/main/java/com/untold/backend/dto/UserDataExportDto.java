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
public class UserDataExportDto {
    private UserDto account;
    private List<AppOrderDto> orders;
    private List<TicketDto> tickets;
    private String exportedAt;
}
