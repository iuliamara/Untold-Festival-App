package com.untold.backend.service;

import com.untold.backend.dto.PersonalScheduleDto;
import com.untold.backend.dto.request.PersonalScheduleRequest;
import com.untold.backend.exception.ResourceNotFoundException;
import com.untold.backend.model.PersonalSchedule;
import com.untold.backend.model.User;
import com.untold.backend.repository.PersonalScheduleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PersonalScheduleService {

    private static final int DEFAULT_ALARM_OFFSET = 10;

    private final PersonalScheduleRepository scheduleRepository;

    public PersonalScheduleService(PersonalScheduleRepository scheduleRepository) {
        this.scheduleRepository = scheduleRepository;
    }

    public List<PersonalScheduleDto> getScheduleForUser(Long userId) {
        return scheduleRepository.findAllByUserId(userId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    @Transactional
    public PersonalScheduleDto addSlot(User user, PersonalScheduleRequest request) {
        validateSchedule(request);
        if (request.getClientRequestId() != null) {
            if (request.getClientRequestId().isBlank() || request.getClientRequestId().length() > 36) {
                throw new IllegalArgumentException("clientRequestId must contain 1 to 36 characters.");
            }
            var existing = scheduleRepository.findByUserIdAndClientRequestId(
                    user.getId(), request.getClientRequestId());
            if (existing.isPresent()) {
                return toDto(existing.get());
            }
        }
        PersonalSchedule slot = new PersonalSchedule();
        slot.setUser(user);
        slot.setArtistName(request.getArtistName());
        slot.setStageName(request.getStageName());
        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
        slot.setFestivalDay(request.getFestivalDay() != null ? request.getFestivalDay() : 1);
        slot.setAlarmOffset(request.getAlarmOffset() != null ? request.getAlarmOffset() : DEFAULT_ALARM_OFFSET);
        slot.setClientRequestId(request.getClientRequestId());
        return toDto(scheduleRepository.save(slot));
    }

    @Transactional
    public PersonalScheduleDto updateSlot(Long userId, Long slotId, PersonalScheduleRequest request) {
        validateSchedule(request);
        PersonalSchedule slot = getOwnedSlot(userId, slotId);
        slot.setArtistName(request.getArtistName().trim());
        slot.setStageName(request.getStageName().trim());
        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
        slot.setFestivalDay(request.getFestivalDay());
        if (request.getAlarmOffset() != null) {
            slot.setAlarmOffset(request.getAlarmOffset());
        }
        return toDto(scheduleRepository.save(slot));
    }

    @Transactional
    public PersonalScheduleDto updateAlarmOffset(Long userId, Long slotId, int offset) {
        validateAlarmOffset(offset);
        PersonalSchedule slot = getOwnedSlot(userId, slotId);
        slot.setAlarmOffset(offset);
        return toDto(scheduleRepository.save(slot));
    }

    @Transactional
    public void deleteSlot(Long userId, Long slotId) {
        PersonalSchedule slot = getOwnedSlot(userId, slotId);
        scheduleRepository.delete(slot);
    }

    private void validateSchedule(PersonalScheduleRequest request) {
        if (request == null || request.getArtistName() == null || request.getArtistName().isBlank()
                || request.getStageName() == null || request.getStageName().isBlank()) {
            throw new IllegalArgumentException("Artist and stage names are required.");
        }
        if (request.getArtistName().trim().length() > 255 || request.getStageName().trim().length() > 255) {
            throw new IllegalArgumentException("Artist and stage names must not exceed 255 characters.");
        }
        LocalTime start = parseTime(request.getStartTime(), "startTime");
        LocalTime end = parseTime(request.getEndTime(), "endTime");
        if (start.equals(end)) {
            throw new IllegalArgumentException("Start and end times must be different.");
        }
        if (request.getFestivalDay() != null && (request.getFestivalDay() < 1 || request.getFestivalDay() > 4)) {
            throw new IllegalArgumentException("Festival day must be between 1 and 4.");
        }
        if (request.getAlarmOffset() != null) {
            validateAlarmOffset(request.getAlarmOffset());
        }
    }

    private LocalTime parseTime(String value, String field) {
        if (value == null || !value.matches("\\d{2}:\\d{2}")) {
            throw new IllegalArgumentException(field + " must use HH:mm format.");
        }
        try {
            return LocalTime.parse(value);
        } catch (RuntimeException e) {
            throw new IllegalArgumentException(field + " must be a valid time.", e);
        }
    }

    private void validateAlarmOffset(int offset) {
        if (offset != 0 && offset != 5 && offset != 10 && offset != 15 && offset != 30) {
            throw new IllegalArgumentException("Alarm offset must be one of 0, 5, 10, 15, or 30 minutes.");
        }
    }

    /**
     * Loads a slot and verifies it belongs to the requesting user, so one attendee can't
     * modify or delete another attendee's saved schedule by guessing an id.
     */
    private PersonalSchedule getOwnedSlot(Long userId, Long slotId) {
        PersonalSchedule slot = scheduleRepository.findById(slotId)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule slot not found with id " + slotId));
        if (!slot.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Schedule slot not found with id " + slotId);
        }
        return slot;
    }

    private PersonalScheduleDto toDto(PersonalSchedule slot) {
        return PersonalScheduleDto.builder()
                .id(slot.getId())
                .artistName(slot.getArtistName())
                .stageName(slot.getStageName())
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .festivalDay(slot.getFestivalDay())
                .alarmOffset(slot.getAlarmOffset())
                .build();
    }
}
