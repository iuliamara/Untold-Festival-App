package com.untold.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.untold.backend.model.Ticket;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "bracelets")
@Data
public class Bracelet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String rfidTag;
    private Double balance;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    @JsonIgnore
    private Ticket ticket;
}
