package com.untold.backend.service;

import com.untold.backend.dto.ZoneDensityDto;
import com.untold.backend.model.CrowdDensityLevel;
import com.untold.backend.model.CrowdReport;
import com.untold.backend.model.MapPin;
import com.untold.backend.repository.CrowdReportRepository;
import com.untold.backend.repository.MapPinRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CrowdReportService {

    private final CrowdReportRepository crowdReportRepository;
    private final MapPinRepository mapPinRepository;

    public CrowdReportService(CrowdReportRepository crowdReportRepository, MapPinRepository mapPinRepository) {
        this.crowdReportRepository = crowdReportRepository;
        this.mapPinRepository = mapPinRepository;
    }

    public List<CrowdReport> getAllReports() {
        return crowdReportRepository.findAllByOrderByReportedAtDesc();
    }

    public Optional<CrowdReport> getReportById(Long id) {
        return crowdReportRepository.findById(id);
    }

    public CrowdReport createReport(Long mapPinId, CrowdDensityLevel densityLevel, String reportedBy, String notes) {
        MapPin mapPin = mapPinRepository.findById(mapPinId)
                .orElseThrow(() -> new RuntimeException("Map pin not found with id " + mapPinId));

        CrowdReport report = new CrowdReport();
        report.setMapPin(mapPin);
        report.setDensityLevel(densityLevel);
        report.setReportedBy(reportedBy);
        report.setNotes(notes);
        report.setReportedAt(LocalDateTime.now());
        return crowdReportRepository.save(report);
    }

    public CrowdReport updateReport(Long id, Long mapPinId, CrowdDensityLevel densityLevel, String reportedBy, String notes) {
        CrowdReport report = crowdReportRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Crowd report not found with id " + id));

        if (mapPinId != null && (report.getMapPin() == null || !mapPinId.equals(report.getMapPin().getId()))) {
            MapPin mapPin = mapPinRepository.findById(mapPinId)
                    .orElseThrow(() -> new RuntimeException("Map pin not found with id " + mapPinId));
            report.setMapPin(mapPin);
        }
        report.setDensityLevel(densityLevel);
        report.setReportedBy(reportedBy);
        report.setNotes(notes);
        return crowdReportRepository.save(report);
    }

    public void deleteReport(Long id) {
        if (!crowdReportRepository.existsById(id)) {
            throw new RuntimeException("Crowd report not found with id " + id);
        }
        crowdReportRepository.deleteById(id);
    }

    public List<ZoneDensityDto> getDensityAggregation(int windowMinutes) {
        LocalDateTime since = LocalDateTime.now().minusMinutes(windowMinutes);
        List<CrowdReport> recentReports = crowdReportRepository.findByReportedAtAfterOrderByReportedAtDesc(since);

        return recentReports.stream()
                .collect(Collectors.groupingBy(r -> r.getMapPin().getId()))
                .values().stream()
                .map(reports -> {
                    MapPin mapPin = reports.get(0).getMapPin();
                    CrowdReport latest = reports.stream()
                            .max(Comparator.comparing(CrowdReport::getReportedAt))
                            .orElseThrow();
                    double avgScore = reports.stream()
                            .mapToInt(r -> r.getDensityLevel().getScore())
                            .average()
                            .orElse(0);

                    return ZoneDensityDto.builder()
                            .mapPinId(mapPin.getId())
                            .mapPinName(mapPin.getName())
                            .mapPinType(mapPin.getType())
                            .currentLevel(CrowdDensityLevel.fromScore(avgScore))
                            .averageScore(Math.round(avgScore * 100.0) / 100.0)
                            .reportCount(reports.size())
                            .lastReportedAt(latest.getReportedAt())
                            .lastReportedBy(latest.getReportedBy())
                            .build();
                })
                .sorted(Comparator.comparingDouble(ZoneDensityDto::getAverageScore).reversed())
                .collect(Collectors.toList());
    }
}
