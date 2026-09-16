package com.untold.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.untold.backend.enums.RequestType;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RegisterRequest implements BaseRequest {
    private String username;
    private String email;
    private String password;
    private String userType;

    @Override
    public RequestType getRequestType() {
        return RequestType.REGISTER;
    }
}
