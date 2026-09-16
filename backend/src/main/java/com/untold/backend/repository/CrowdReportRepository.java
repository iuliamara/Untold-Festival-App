package com.untold.backend.repository;

import com.untold.backend.model.CrowdReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CrowdReportRepository extends JpaRepository<CrowdReport, Long> {
    List<CrowdReport> findAllByOrderByReportedAtDesc();
    List<CrowdReport> findByMapPinIdOrderByReportedAtDesc(Long mapPinId);
    List<CrowdReport> findByReportedAtAfterOrderByReportedAtDesc(LocalDateTime since);
}
