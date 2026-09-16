package com.untold.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "entrance_logs")
@Data
public class EntranceLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "bracelet_id", nullable = false)
    private Bracelet bracelet;

    private LocalDateTime entryTimestamp;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EntranceDirection direction;
}
