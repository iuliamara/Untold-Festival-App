package com.untold.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.untold.backend.enums.RequestType;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class BulkBuyTicketRequest implements BaseRequest {
    private Long userId;
    private List<TicketItemRequest> tickets;

    @Override
    public RequestType getRequestType() {
        return RequestType.BULK_BUY;
    }
}
