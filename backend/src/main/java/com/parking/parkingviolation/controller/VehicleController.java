package com.parking.parkingviolation.controller;

import com.parking.parkingviolation.entity.Vehicle;
import com.parking.parkingviolation.entity.User;
import com.parking.parkingviolation.repository.VehicleRepository;
import com.parking.parkingviolation.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/vehicles")
public class VehicleController {

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Vehicle>> getAllVehicles() {
        return ResponseEntity.ok(vehicleRepository.findAll());
    }

    // Owner registers/claims a vehicle number.
    // The Owner is the authoritative source for vehicleType — their declared
    // type always overrides whatever an Officer may have guessed earlier
    // when first recording a violation on an unclaimed vehicle.
    @PostMapping("/claim")
    public ResponseEntity<?> claimVehicle(@RequestBody Map<String, String> data) {
        String vehicleNumber = data.get("vehicleNumber").trim().toUpperCase();
        Integer ownerId = Integer.parseInt(data.get("ownerId"));
        String vehicleType = data.getOrDefault("vehicleType", "Car");

        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new RuntimeException("Owner not found"));

        Vehicle vehicle = vehicleRepository.findByVehicleNumber(vehicleNumber)
                .orElseGet(Vehicle::new);

        vehicle.setVehicleNumber(vehicleNumber);
        vehicle.setOwner(owner);
        vehicle.setVehicleType(vehicleType); // always trust the Owner, no conditional check

        Vehicle saved = vehicleRepository.save(vehicle);
        return ResponseEntity.ok(saved);
    }

    // Get vehicles belonging to a specific owner
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<Vehicle>> getVehiclesByOwner(@PathVariable Integer ownerId) {
        List<Vehicle> vehicles = vehicleRepository.findAll().stream()
                .filter(v -> v.getOwner() != null && v.getOwner().getUserId().equals(ownerId))
                .toList();
        return ResponseEntity.ok(vehicles);
    }
}