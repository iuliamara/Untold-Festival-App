package com.untold.backend.dto.request;

import lombok.Data;

@Data
public class TopUpSessionRequest {
    private Long ticketId;
    private Double amount;
    private String currency;
}
