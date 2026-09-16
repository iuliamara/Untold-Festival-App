package com.untold.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QrValidationResponse {
    private boolean success;
    private String message;
    private String attendeeName;
    private String ticketType;
}
