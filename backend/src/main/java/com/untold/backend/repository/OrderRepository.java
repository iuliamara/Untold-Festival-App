package com.untold.backend.repository;

import com.untold.backend.model.AppOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<AppOrder, Long> {
    List<AppOrder> findByUserId(Long userId);
}
