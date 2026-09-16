package com.untold.backend.controller;

import com.untold.backend.dto.PersonDto;
import com.untold.backend.dto.response.ApiResponse;
import com.untold.backend.model.Person;
import com.untold.backend.service.PersonService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/persons")
public class PersonController {

    private final PersonService personService;

    public PersonController(PersonService personService) {
        this.personService = personService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PersonDto>>> getAllPersons() {
        List<PersonDto> response = personService.getAllPersons().stream()
                .map(this::toPersonDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Persons retrieved successfully", response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PersonDto>> getPersonById(@PathVariable Long id) {
        return personService.getPersonById(id)
                .map(person -> ResponseEntity.ok(ApiResponse.success("Person found", toPersonDto(person))))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(ApiResponse.notFound("Person not found with id: " + id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PersonDto>> createPerson(@RequestBody Person person) {
        try {
            Person created = personService.createPerson(person);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success("Person created successfully", toPersonDto(created)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PersonDto>> updatePerson(@PathVariable Long id, @RequestBody Person person) {
        try {
            Person updated = personService.updatePerson(id, person);
            return ResponseEntity.ok(ApiResponse.success("Person updated successfully", toPersonDto(updated)));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.notFound(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePerson(@PathVariable Long id) {
        try {
            personService.deletePerson(id);
            return ResponseEntity.ok(ApiResponse.success("Person deleted successfully", null));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.notFound(e.getMessage()));
        }
    }

    private PersonDto toPersonDto(Person person) {
        PersonDto dto = new PersonDto();
        dto.setId(person.getId());
        dto.setFirstName(person.getFirstName());
        dto.setLastName(person.getLastName());
        dto.setDateOfBirth(person.getDateOfBirth());
        dto.setGender(person.getGender());
        dto.setCountry(person.getCountry());
        dto.setCity(person.getCity());
        dto.setDocumentType(person.getDocumentType());
        dto.setDocumentId(person.getDocumentId());
        dto.setPhoneNumber(person.getPhoneNumber());
        dto.setOwnerEmail(personService.findOwnerEmail(person.getId()).orElse(null));
        return dto;
    }
}
