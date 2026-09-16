package com.untold.backend.dto;

import com.untold.backend.model.TicketType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TicketDto {
    private Long id;
    private String ticketType;
    private String displayName;
    private Double price;
    private LocalDateTime purchaseDate;
    private boolean checkInCompleted;
    private String rfidTag;
    private PersonDto attendee;
    private BraceletDto bracelet;
    private String buyerUsername;
    private String buyerEmail;
}
