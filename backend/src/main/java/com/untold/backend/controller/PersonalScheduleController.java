package com.untold.backend.controller;

import com.untold.backend.dto.PersonalScheduleDto;
import com.untold.backend.dto.request.PersonalScheduleRequest;
import com.untold.backend.dto.response.ApiResponse;
import com.untold.backend.exception.ResourceNotFoundException;
import com.untold.backend.model.User;
import com.untold.backend.repository.UserRepository;
import com.untold.backend.service.PersonalScheduleService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/my-schedule")
public class PersonalScheduleController {

    private final PersonalScheduleService scheduleService;
    private final UserRepository userRepository;

    public PersonalScheduleController(PersonalScheduleService scheduleService, UserRepository userRepository) {
        this.scheduleService = scheduleService;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<PersonalScheduleDto>>> getMySchedule(Authentication authentication) {
        User user = resolveUser(authentication);
        if (user == null) {
            return unauthorized();
        }
        return ResponseEntity.ok(ApiResponse.success(scheduleService.getScheduleForUser(user.getId())));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PersonalScheduleDto>> addSlot(
            Authentication authentication, @RequestBody PersonalScheduleRequest request) {
        User user = resolveUser(authentication);
        if (user == null) {
            return unauthorized();
        }
        return ResponseEntity.ok(ApiResponse.success("Slot added to schedule", scheduleService.addSlot(user, request)));
    }

    @PutMapping("/{id}/alarm")
    public ResponseEntity<ApiResponse<PersonalScheduleDto>> updateAlarm(
            Authentication authentication, @PathVariable Long id, @RequestParam int offset) {
        User user = resolveUser(authentication);
        if (user == null) {
            return unauthorized();
        }
        try {
            return ResponseEntity.ok(ApiResponse.success(scheduleService.updateAlarmOffset(user.getId(), id, offset)));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.notFound(e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSlot(Authentication authentication, @PathVariable Long id) {
        User user = resolveUser(authentication);
        if (user == null) {
            return unauthorized();
        }
        try {
            scheduleService.deleteSlot(user.getId(), id);
            return ResponseEntity.ok(ApiResponse.success("Slot removed", null));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.notFound(e.getMessage()));
        }
    }

    /**
     * Resolves the logged-in User from the JWT-authenticated principal (email), or null if the
     * request is anonymous. "/api/**" is permitAll at the URL level, so this endpoint enforces
     * the "must be logged in" rule itself rather than relying on Spring Security to reject it.
     */
    private User resolveUser(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getName())) {
            return null;
        }
        return userRepository.findByEmail(authentication.getName()).orElse(null);
    }

    private <T> ResponseEntity<ApiResponse<T>> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.unauthorized("Trebuie să fii autentificat pentru a accesa programul personal."));
    }
}
