package com.untold.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.untold.backend.enums.RequestType;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginRequest implements BaseRequest {
    private String email;
    private String password;

    @Override
    public RequestType getRequestType() {
        return RequestType.LOGIN;
    }
}
