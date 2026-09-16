package com.untold.backend.service;
import com.untold.backend.model.*;
import com.untold.backend.repository.*;
import com.untold.backend.service.*;

import com.untold.backend.dto.AppOrderDto;
import com.untold.backend.dto.BraceletDto;
import com.untold.backend.dto.PersonDto;
import com.untold.backend.dto.TicketDto;
import com.untold.backend.dto.UserDataExportDto;
import com.untold.backend.dto.UserDto;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final TicketRepository ticketRepository;
    private final TicketTierRepository ticketTierRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, OrderRepository orderRepository,
                        TicketRepository ticketRepository, TicketTierRepository ticketTierRepository,
                        PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.orderRepository = orderRepository;
        this.ticketRepository = ticketRepository;
        this.ticketTierRepository = ticketTierRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserById(Long id) {
        return userRepository.findById(id);
    }

    public User createUser(User user) {
        // Hash the password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public User updateUser(Long id, User userDetails) {
        return userRepository.findById(id).map(user -> {
            user.setUsername(userDetails.getUsername());
            user.setEmail(userDetails.getEmail());
            // Hash the new password if it is being updated
            if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
                user.setPassword(passwordEncoder.encode(userDetails.getPassword()));
            }
            user.setUserType(userDetails.getUserType());
            return userRepository.save(user);
        }).orElseThrow(() -> new RuntimeException("User not found with id " + id));
    }

    public void deleteUser(Long id) {
        userRepository.deleteById(id);
    }

    public UserDataExportDto exportUserData(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email " + email));

        List<AppOrderDto> orders = orderRepository.findByUserId(user.getId())
                .stream().map(this::toAppOrderDto).collect(Collectors.toList());

        List<TicketDto> tickets = ticketRepository.findDistinctByAppOrdersUserId(user.getId())
                .stream().map(this::toTicketDto).collect(Collectors.toList());

        return UserDataExportDto.builder()
                .account(toUserDto(user))
                .orders(orders)
                .tickets(tickets)
                .exportedAt(LocalDateTime.now().toString())
                .build();
    }

    private UserDto toUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .userType(user.getUserType())
                .build();
    }

    private AppOrderDto toAppOrderDto(AppOrder order) {
        return AppOrderDto.builder()
                .id(order.getId())
                .orderType(order.getOrderType())
                .amountPaid(order.getAmountPaid())
                .purchaseDate(order.getPurchaseDate())
                .build();
    }

    private TicketDto toTicketDto(Ticket ticket) {
        String rfidTag = ticket.getBracelet() != null ? ticket.getBracelet().getRfidTag() : null;
        String displayName = resolveTicketTypeDisplayName(ticket.getTicketType());

        PersonDto personDto = null;
        if (ticket.getAttendee() != null) {
            personDto = new PersonDto();
            personDto.setId(ticket.getAttendee().getId());
            personDto.setFirstName(ticket.getAttendee().getFirstName());
            personDto.setLastName(ticket.getAttendee().getLastName());
            personDto.setDateOfBirth(ticket.getAttendee().getDateOfBirth());
            personDto.setGender(ticket.getAttendee().getGender());
            personDto.setCountry(ticket.getAttendee().getCountry());
            personDto.setCity(ticket.getAttendee().getCity());
            personDto.setDocumentType(ticket.getAttendee().getDocumentType());
            personDto.setDocumentId(ticket.getAttendee().getDocumentId());
            personDto.setPhoneNumber(ticket.getAttendee().getPhoneNumber());
        }

        BraceletDto braceletDto = null;
        if (ticket.getBracelet() != null) {
            braceletDto = new BraceletDto(
                    ticket.getBracelet().getId(),
                    ticket.getBracelet().getRfidTag(),
                    ticket.getBracelet().getBalance()
            );
        }

        return TicketDto.builder()
                .id(ticket.getId())
                .ticketType(ticket.getTicketType())
                .displayName(displayName)
                .price(ticket.getPrice())
                .purchaseDate(ticket.getPurchaseDate())
                .checkInCompleted(ticket.isCheckInCompleted())
                .rfidTag(rfidTag)
                .attendee(personDto)
                .bracelet(braceletDto)
                .build();
    }

    private String resolveTicketTypeDisplayName(String ticketType) {
        if (ticketType == null) {
            return null;
        }
        TicketTier tier = ticketTierRepository.findById(ticketType).orElse(null);
        if (tier != null) {
            return tier.getDisplayName();
        }
        try {
            return TicketType.valueOf(ticketType).getDisplayName();
        } catch (IllegalArgumentException e) {
            return ticketType.replace("_", " ");
        }
    }

}
