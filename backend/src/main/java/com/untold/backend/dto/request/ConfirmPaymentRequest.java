package com.untold.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.untold.backend.enums.RequestType;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class ConfirmPaymentRequest implements BaseRequest {
    private String sessionId;

    @Override
    public RequestType getRequestType() {
        return RequestType.CONFIRM_PAYMENT;
    }
}
