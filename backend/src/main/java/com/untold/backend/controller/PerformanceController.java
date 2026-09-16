package com.untold.backend.controller;

import com.untold.backend.dto.PerformanceDto;
import com.untold.backend.dto.PerformanceRequestDto;
import com.untold.backend.dto.response.ApiResponse;
import com.untold.backend.service.PerformanceService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.time.OffsetDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;

@RestController
@RequestMapping("/api/performances")
public class PerformanceController {

    private final PerformanceService performanceService;

    public PerformanceController(PerformanceService performanceService) {
        this.performanceService = performanceService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PerformanceDto>>> getAllPerformances(
            @RequestParam(required = false) String start,
            @RequestParam(required = false) String end,
            @RequestParam(required = false) Long stageId,
            @RequestParam(required = false) Long artistId) {
        
        OffsetDateTime startTime = null;
        OffsetDateTime endTime = null;

        try {
            if (start != null && !start.trim().isEmpty()) {
                startTime = OffsetDateTime.parse(start);
            }
            if (end != null && !end.trim().isEmpty()) {
                endTime = OffsetDateTime.parse(end);
            }
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, 
                    "Invalid date-time format. Please use ISO-8601 offset format (e.g. 2026-08-06T20:00:00+03:00)");
        }

        List<PerformanceDto> dtos = performanceService.getAllPerformances(startTime, endTime, stageId, artistId);
        return ResponseEntity.ok(ApiResponse.success("Performances retrieved successfully", dtos));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PerformanceDto>> getPerformanceById(@PathVariable Long id) {
        PerformanceDto dto = performanceService.getPerformanceById(id);
        return ResponseEntity.ok(ApiResponse.success("Performance found", dto));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PerformanceDto>> createPerformance(@RequestBody PerformanceRequestDto request) {
        PerformanceDto created = performanceService.createPerformance(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Performance scheduled successfully", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PerformanceDto>> updatePerformance(
            @PathVariable Long id, 
            @RequestBody PerformanceRequestDto request) {
        PerformanceDto updated = performanceService.updatePerformance(id, request);
        return ResponseEntity.ok(ApiResponse.success("Performance updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deletePerformance(@PathVariable Long id) {
        performanceService.deletePerformance(id);
        return ResponseEntity.ok(ApiResponse.success("Performance deleted successfully", null));
    }
}
