package com.untold.backend.repository;

import com.untold.backend.model.PersonalSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PersonalScheduleRepository extends JpaRepository<PersonalSchedule, Long> {
    List<PersonalSchedule> findAllByUserId(Long userId);
    Optional<PersonalSchedule> findByUserIdAndClientRequestId(Long userId, String clientRequestId);
}
