package com.untold.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.untold.backend.enums.RequestType;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BuyTicketRequest implements BaseRequest {
    private Long userId;
    private String ticketType;
    private Double price;

    @Override
    public RequestType getRequestType() {
        return RequestType.BUY_TICKET;
    }
}
