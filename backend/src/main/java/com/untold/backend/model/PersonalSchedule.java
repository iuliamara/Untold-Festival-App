package com.untold.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "personal_schedule")
@Data
public class PersonalSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "artist_name", nullable = false)
    private String artistName;

    @Column(name = "stage_name", nullable = false)
    private String stageName;

    // "HH:MM", 24h — stored as text since sets aren't tied to a calendar date, only a time-of-day.
    @Column(name = "start_time", nullable = false, length = 5)
    private String startTime;

    @Column(name = "end_time", nullable = false, length = 5)
    private String endTime;

    // Festival day (1-4) this performance belongs to.
    @Column(name = "festival_day", nullable = false)
    private Integer festivalDay = 1;

    @Column(name = "alarm_offset", nullable = false)
    private Integer alarmOffset = 10;
}
