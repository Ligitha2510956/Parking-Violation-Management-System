package com.parking.parkingviolation.repository;

import com.parking.parkingviolation.entity.Appeal;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AppealRepository extends JpaRepository<Appeal, Integer> {
    List<Appeal> findByOwner_UserId(Integer ownerId);
    List<Appeal> findByStatus(String status);
}