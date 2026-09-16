package com.untold.backend.dto.request;

import com.untold.backend.enums.RequestType;

public interface BaseRequest {
    RequestType getRequestType();
}
