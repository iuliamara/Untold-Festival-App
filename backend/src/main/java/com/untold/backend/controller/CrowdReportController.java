package com.untold.backend.controller;

import com.untold.backend.dto.CrowdReportDto;
import com.untold.backend.dto.CrowdReportRequestDto;
import com.untold.backend.dto.ZoneDensityDto;
import com.untold.backend.dto.response.ApiResponse;
import com.untold.backend.model.CrowdReport;
import com.untold.backend.service.CrowdReportService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/crowd-reports")
public class CrowdReportController {

    private final CrowdReportService crowdReportService;

    public CrowdReportController(CrowdReportService crowdReportService) {
        this.crowdReportService = crowdReportService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<CrowdReportDto>>> getAllReports() {
        List<CrowdReportDto> response = crowdReportService.getAllReports().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Crowd reports retrieved successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CrowdReportDto>> getReportById(@PathVariable Long id) {
        return crowdReportService.getReportById(id)
                .map(report -> ResponseEntity.ok(ApiResponse.success("Crowd report found", toDto(report))))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.notFound("Crowd report not found with id: " + id)));
    }

    @GetMapping("/aggregation")
    public ResponseEntity<ApiResponse<List<ZoneDensityDto>>> getDensityAggregation(
            @RequestParam(name = "windowMinutes", defaultValue = "60") int windowMinutes) {
        return ResponseEntity.ok(ApiResponse.success("Density aggregation computed",
                crowdReportService.getDensityAggregation(windowMinutes)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CrowdReportDto>> createReport(@RequestBody CrowdReportRequestDto request) {
        try {
            CrowdReport created = crowdReportService.createReport(
                    request.getMapPinId(), request.getDensityLevel(), request.getReportedBy(), request.getNotes());
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Crowd report created successfully", toDto(created)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CrowdReportDto>> updateReport(@PathVariable Long id, @RequestBody CrowdReportRequestDto request) {
        try {
            CrowdReport updated = crowdReportService.updateReport(
                    id, request.getMapPinId(), request.getDensityLevel(), request.getReportedBy(), request.getNotes());
            return ResponseEntity.ok(ApiResponse.success("Crowd report updated successfully", toDto(updated)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.notFound(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteReport(@PathVariable Long id) {
        try {
            crowdReportService.deleteReport(id);
            return ResponseEntity.ok(ApiResponse.success("Crowd report deleted successfully", null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.notFound(e.getMessage()));
        }
    }

    private CrowdReportDto toDto(CrowdReport report) {
        return CrowdReportDto.builder()
                .id(report.getId())
                .mapPinId(report.getMapPin().getId())
                .mapPinName(report.getMapPin().getName())
                .mapPinType(report.getMapPin().getType())
                .densityLevel(report.getDensityLevel())
                .reportedBy(report.getReportedBy())
                .notes(report.getNotes())
                .reportedAt(report.getReportedAt())
                .build();
    }
}
