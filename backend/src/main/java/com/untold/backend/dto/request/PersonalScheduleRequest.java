package com.untold.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.untold.backend.enums.RequestType;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PersonalScheduleRequest implements BaseRequest {
    private String artistName;
    private String stageName;
    private String startTime;
    private String endTime;
    private Integer festivalDay;

    @Override
    public RequestType getRequestType() {
        return RequestType.CREATE_SCHEDULE_SLOT;
    }
}
