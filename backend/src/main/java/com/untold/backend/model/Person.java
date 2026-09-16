package com.untold.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "persons")
@Data
public class Person {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private String gender;
    private String country;
    private String city;
    @Enumerated(EnumType.STRING)
    private DocumentType documentType;
    private String documentId;
    private String phoneNumber;
}
