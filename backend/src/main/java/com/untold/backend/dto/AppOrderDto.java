package com.untold.backend.dto;

import com.untold.backend.model.OrderType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AppOrderDto {
    private Long id;
    private OrderType orderType;
    private Double amountPaid;
    private LocalDateTime purchaseDate;
}
