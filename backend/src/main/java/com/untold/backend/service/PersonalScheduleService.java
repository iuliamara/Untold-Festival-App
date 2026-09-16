package com.untold.backend.service;

import com.untold.backend.dto.PersonalScheduleDto;
import com.untold.backend.dto.request.PersonalScheduleRequest;
import com.untold.backend.exception.ResourceNotFoundException;
import com.untold.backend.model.PersonalSchedule;
import com.untold.backend.model.User;
import com.untold.backend.repository.PersonalScheduleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        PersonalSchedule slot = new PersonalSchedule();
        slot.setUser(user);
        slot.setArtistName(request.getArtistName());
        slot.setStageName(request.getStageName());
        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
        slot.setFestivalDay(request.getFestivalDay() != null ? request.getFestivalDay() : 1);
        slot.setAlarmOffset(DEFAULT_ALARM_OFFSET);
        return toDto(scheduleRepository.save(slot));
    }

    @Transactional
    public PersonalScheduleDto updateAlarmOffset(Long userId, Long slotId, int offset) {
        PersonalSchedule slot = getOwnedSlot(userId, slotId);
        slot.setAlarmOffset(offset);
        return toDto(scheduleRepository.save(slot));
    }

    @Transactional
    public void deleteSlot(Long userId, Long slotId) {
        PersonalSchedule slot = getOwnedSlot(userId, slotId);
        scheduleRepository.delete(slot);
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
