package com.untold.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.untold.backend.enums.ResponseType;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CheckoutResponse implements BaseResponse {
    private String url;

    @Override
    public ResponseType getResponseType() {
        return ResponseType.SUCCESS;
    }
}
