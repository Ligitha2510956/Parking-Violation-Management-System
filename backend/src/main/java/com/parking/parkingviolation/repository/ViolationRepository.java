package com.parking.parkingviolation.repository;

import com.parking.parkingviolation.entity.Violation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ViolationRepository extends JpaRepository<Violation, Integer> {
    List<Violation> findByOfficer_UserId(Integer officerId);
    List<Violation> findByVehicle_VehicleId(Integer vehicleId);
}