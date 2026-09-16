package com.untold.backend.repository;
import com.untold.backend.model.*;
import com.untold.backend.repository.*;
import com.untold.backend.service.*;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
}
