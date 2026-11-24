package com.untold.backend.service;

import com.untold.backend.dto.PersonalScheduleDto;
import com.untold.backend.dto.request.PersonalScheduleRequest;
import com.untold.backend.exception.ResourceNotFoundException;
import com.untold.backend.model.PersonalSchedule;
import com.untold.backend.model.User;
import com.untold.backend.repository.PersonalScheduleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PersonalScheduleServiceTest {

    @Mock
    private PersonalScheduleRepository scheduleRepository;

    @InjectMocks
    private PersonalScheduleService scheduleService;

    @Test
    void updateSlotPreservesAlarmWhenRequestOmitsIt() {
        User owner = user(7L);
        PersonalSchedule slot = slot(12L, owner);
        when(scheduleRepository.findById(12L)).thenReturn(Optional.of(slot));
        when(scheduleRepository.save(slot)).thenReturn(slot);

        PersonalScheduleDto updated = scheduleService.updateSlot(7L, 12L, request("Artist B", "Stage B", 2, null));

        assertEquals("Artist B", updated.getArtistName());
        assertEquals("Stage B", updated.getStageName());
        assertEquals(2, updated.getFestivalDay());
        assertEquals(15, updated.getAlarmOffset());
        verify(scheduleRepository).save(slot);
    }

    @Test
    void updateSlotRejectsEntryOwnedByAnotherUser() {
        PersonalSchedule slot = slot(12L, user(8L));
        when(scheduleRepository.findById(12L)).thenReturn(Optional.of(slot));

        assertThrows(ResourceNotFoundException.class,
                () -> scheduleService.updateSlot(7L, 12L, request("Artist B", "Stage B", 2, null)));
        verify(scheduleRepository, never()).save(any());
    }

    @Test
    void updateSlotRejectsInvalidTimeAndDay() {
        assertThrows(IllegalArgumentException.class,
                () -> scheduleService.updateSlot(7L, 12L, request("Artist B", "Stage B", 5, null)));
        verify(scheduleRepository, never()).save(any());
    }

    @Test
    void addSlotReturnsExistingEntryForRepeatedClientRequestId() {
        User owner = user(7L);
        PersonalSchedule existing = slot(12L, owner);
        PersonalScheduleRequest request = request("Artist A", "Stage A", 1, null);
        request.setClientRequestId("operation-123");
        when(scheduleRepository.findByUserIdAndClientRequestId(7L, "operation-123"))
                .thenReturn(Optional.of(existing));

        PersonalScheduleDto result = scheduleService.addSlot(owner, request);

        assertEquals(12L, result.getId());
        verify(scheduleRepository, never()).save(any());
    }

    private PersonalScheduleRequest request(String artist, String stage, int day, Integer alarmOffset) {
        PersonalScheduleRequest request = new PersonalScheduleRequest();
        request.setArtistName(artist);
        request.setStageName(stage);
        request.setStartTime("23:00");
        request.setEndTime("00:30");
        request.setFestivalDay(day);
        request.setAlarmOffset(alarmOffset);
        return request;
    }

    private User user(Long id) {
        User user = new User();
        user.setId(id);
        return user;
    }

    private PersonalSchedule slot(Long id, User owner) {
        PersonalSchedule slot = new PersonalSchedule();
        slot.setId(id);
        slot.setUser(owner);
        slot.setArtistName("Artist A");
        slot.setStageName("Stage A");
        slot.setStartTime("21:00");
        slot.setEndTime("22:00");
        slot.setFestivalDay(1);
        slot.setAlarmOffset(15);
        return slot;
    }
}
