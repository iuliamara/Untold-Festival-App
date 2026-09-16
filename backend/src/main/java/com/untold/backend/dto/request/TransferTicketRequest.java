package com.untold.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.untold.backend.enums.RequestType;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TransferTicketRequest implements BaseRequest {
    private String targetEmail;

    @Override
    public RequestType getRequestType() {
        return RequestType.TRANSFER_TICKET;
    }
}
