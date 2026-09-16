package com.untold.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.untold.backend.model.Bracelet;
import com.untold.backend.model.User;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Data
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_type", nullable = false)
    private String ticketType;
    private Double price;
    private LocalDateTime purchaseDate;
    
    private boolean checkInCompleted = false;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "person_id", nullable = true)
    private Person attendee;

    @OneToMany(mappedBy = "ticket", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JsonIgnore
    private java.util.List<AppOrder> appOrders;

    @JsonIgnore
    public AppOrder getOrder() {
        if (appOrders != null && !appOrders.isEmpty()) {
            return appOrders.get(0);
        }
        return null;
    }

    @JsonIgnore
    public User getUser() {
        if (appOrders == null || appOrders.isEmpty()) {
            throw new IllegalStateException("Ticket cannot exist without an AppOrder");
        }
        return appOrders.get(0).getUser();
    }

    @OneToOne(mappedBy = "ticket", cascade = CascadeType.ALL, orphanRemoval = true)
    private Bracelet bracelet;
}
