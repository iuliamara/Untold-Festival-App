package com.untold.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MapDto {
    private Long id;
    private String imageUrl;
    private boolean isActive;
    private List<PinDto> pins;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PinDto {
        private Long id;
        private String type;
        private String name;
        private String description;
        private Double xPos;
        private Double yPos;
    }
}
