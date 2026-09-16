package com.untold.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.untold.backend.dto.UserDto;
import com.untold.backend.enums.ResponseType;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse implements BaseResponse {
    private String token;
    private UserDto user;

    @Override
    public ResponseType getResponseType() {
        return ResponseType.SUCCESS;
    }
}
