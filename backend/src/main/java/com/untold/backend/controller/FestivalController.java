package com.untold.backend.controller;

import com.untold.backend.dto.response.ApiResponse;
import com.untold.backend.service.TicketService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/festival")
public class FestivalController {

    private final TicketService ticketService;

    public FestivalController(TicketService ticketService) {
        this.ticketService = ticketService;
    }

    /**
     * Public festival metadata: which festival day (1-4) is today, or null outside the festival window.
     */
    @GetMapping("/current-day")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> getCurrentDay() {
        Map<String, Integer> data = new HashMap<>();
        data.put("currentDay", ticketService.getCurrentFestivalDay());
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
