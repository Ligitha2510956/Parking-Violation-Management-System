package com.parking.parkingviolation.repository;

import com.parking.parkingviolation.entity.OfficerWarning;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OfficerWarningRepository extends JpaRepository<OfficerWarning, Integer> {
    List<OfficerWarning> findByOfficer_UserIdOrderBySentAtDesc(Integer officerId);
}