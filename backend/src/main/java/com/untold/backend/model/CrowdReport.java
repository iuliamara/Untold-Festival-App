package com.untold.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import java.time.LocalDateTime;

@Entity
@Table(name = "crowd_reports")
@Data
public class CrowdReport {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "map_pin_id", nullable = false)
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private MapPin mapPin;

    @Enumerated(EnumType.STRING)
    @Column(name = "density_level", nullable = false, length = 20)
    private CrowdDensityLevel densityLevel;

    @Column(name = "reported_by", nullable = false, length = 255)
    private String reportedBy;

    @Column(length = 1000)
    private String notes;

    @Column(name = "reported_at", nullable = false)
    private LocalDateTime reportedAt = LocalDateTime.now();
}
