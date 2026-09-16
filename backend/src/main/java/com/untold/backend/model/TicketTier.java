package com.untold.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "ticket_tiers")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TicketTier {
    @Id
    private String id; // e.g., "GA_4_DAYS_PHASE_5" or custom name

    @Column(nullable = false)
    private String displayName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketCategory category;

    @Column(nullable = false)
    private Double price;

    @Column(nullable = false)
    private Long capacity;

    @Column(nullable = true)
    private Integer quantity;

    @Builder.Default
    @Column(nullable = false)
    private Long sold = 0L;

    @Builder.Default
    @Column(nullable = false)
    private Boolean active = true;
}
