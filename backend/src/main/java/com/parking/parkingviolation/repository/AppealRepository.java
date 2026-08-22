package com.parking.parkingviolation.repository;

import com.parking.parkingviolation.entity.Appeal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AppealRepository extends JpaRepository<Appeal, Integer> {
    List<Appeal> findByOwner_UserId(Integer ownerId);
    Optional<Appeal> findByViolation_ViolationId(Integer violationId);
}