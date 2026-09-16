package com.untold.backend.dto;

import lombok.Data;
import java.time.LocalDate;
import com.untold.backend.model.DocumentType;

@Data
public class PersonDto {
    private Long id;
    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private String gender;
    private String country;
    private String city;
    private DocumentType documentType;
    private String documentId;
    private String phoneNumber;
    private String ownerEmail;
}
