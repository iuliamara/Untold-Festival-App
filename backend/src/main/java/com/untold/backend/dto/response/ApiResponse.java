package com.untold.backend.dto.response;

import com.untold.backend.enums.ResponseType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.untold.backend.dto.response.BaseResponse;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ApiResponse<T> implements BaseResponse {

    private ResponseType type;
    private String message;
    private T data;

    @Override
    public ResponseType getResponseType() {
        return this.type;
    }

    public static <T> ApiResponse<T> success(T data) {
        return ApiResponse.<T>builder()
                .type(ResponseType.SUCCESS)
                .message("Operation completed successfully")
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return ApiResponse.<T>builder()
                .type(ResponseType.SUCCESS)
                .message(message)
                .data(data)
                .build();
    }

    public static <T> ApiResponse<T> error(String message) {
        return ApiResponse.<T>builder()
                .type(ResponseType.ERROR)
                .message(message)
                .data(null)
                .build();
    }

    public static <T> ApiResponse<T> notFound(String message) {
        return ApiResponse.<T>builder()
                .type(ResponseType.NOT_FOUND)
                .message(message)
                .data(null)
                .build();
    }

    public static <T> ApiResponse<T> unauthorized(String message) {
        return ApiResponse.<T>builder()
                .type(ResponseType.UNAUTHORIZED)
                .message(message)
                .data(null)
                .build();
    }
}
