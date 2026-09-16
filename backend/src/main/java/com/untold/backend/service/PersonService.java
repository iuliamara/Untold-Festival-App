package com.untold.backend.service;

import com.untold.backend.model.Person;
import com.untold.backend.repository.PersonRepository;
import com.untold.backend.repository.TicketRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PersonService {

    private final PersonRepository personRepository;
    private final TicketRepository ticketRepository;

    public PersonService(PersonRepository personRepository, TicketRepository ticketRepository) {
        this.personRepository = personRepository;
        this.ticketRepository = ticketRepository;
    }

    public Optional<String> findOwnerEmail(Long personId) {
        return ticketRepository.findByAttendeeId(personId).stream()
                .flatMap(ticket -> {
                    try {
                        return java.util.stream.Stream.of(ticket.getUser());
                    } catch (IllegalStateException e) {
                        return java.util.stream.Stream.empty();
                    }
                })
                .findFirst()
                .map(com.untold.backend.model.User::getEmail);
    }

    public List<Person> getAllPersons() {
        return personRepository.findAll();
    }

    public Optional<Person> getPersonById(Long id) {
        return personRepository.findById(id);
    }

    public Person createPerson(Person person) {
        return personRepository.save(person);
    }

    public Person updatePerson(Long id, Person personDetails) {
        return personRepository.findById(id).map(person -> {
            person.setFirstName(personDetails.getFirstName());
            person.setLastName(personDetails.getLastName());
            person.setDateOfBirth(personDetails.getDateOfBirth());
            person.setGender(personDetails.getGender());
            person.setCountry(personDetails.getCountry());
            person.setCity(personDetails.getCity());
            person.setDocumentType(personDetails.getDocumentType());
            person.setDocumentId(personDetails.getDocumentId());
            person.setPhoneNumber(personDetails.getPhoneNumber());
            return personRepository.save(person);
        }).orElseThrow(() -> new RuntimeException("Person not found with id " + id));
    }

    public void deletePerson(Long id) {
        if (!personRepository.existsById(id)) {
            throw new RuntimeException("Person not found with id " + id);
        }
        personRepository.deleteById(id);
    }
}
