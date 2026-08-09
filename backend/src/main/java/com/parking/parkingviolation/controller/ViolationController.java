package com.parking.parkingviolation.controller;

import com.parking.parkingviolation.entity.Violation;
import com.parking.parkingviolation.entity.Vehicle;
import com.parking.parkingviolation.entity.User;
import com.parking.parkingviolation.entity.ViolationCategory;
import com.parking.parkingviolation.service.ViolationService;
import com.parking.parkingviolation.repository.VehicleRepository;
import com.parking.parkingviolation.repository.UserRepository;
import com.parking.parkingviolation.repository.ViolationCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/violations")
public class ViolationController {

    @Autowired
    private ViolationService violationService;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ViolationCategoryRepository categoryRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @PostMapping
    public ResponseEntity<?> recordViolation(
            @RequestParam("vehicleNumber") String vehicleNumber,
            @RequestParam("officerId") Integer officerId,
            @RequestParam("categoryId") Integer categoryId,
            @RequestParam("location") String location,
            @RequestParam("photo") MultipartFile photo
    ) {
        try {
            if (photo.isEmpty()) {
                return ResponseEntity.badRequest().body("Photo is mandatory for every violation");
            }

            // Save the photo file to disk
            String fileName = UUID.randomUUID() + "_" + photo.getOriginalFilename();
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            Path filePath = uploadPath.resolve(fileName);
            Files.copy(photo.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Find vehicle by number, or create a new one (no owner yet) if it doesn't exist
            String normalizedNumber = vehicleNumber.trim().toUpperCase();
            Vehicle vehicle = vehicleRepository.findByVehicleNumber(normalizedNumber)
                    .orElseGet(() -> {
                        Vehicle newVehicle = new Vehicle();
                        newVehicle.setVehicleNumber(normalizedNumber);
                        newVehicle.setOwner(null); // unclaimed until an owner registers this vehicle
                        newVehicle.setVehicleType("UNKNOWN");
                        return vehicleRepository.save(newVehicle);
                    });

            User officer = userRepository.findById(officerId)
                    .orElseThrow(() -> new RuntimeException("Officer not found"));
            ViolationCategory category = categoryRepository.findById(categoryId)
                    .orElseThrow(() -> new RuntimeException("Category not found"));

            Violation violation = new Violation();
            violation.setVehicle(vehicle);
            violation.setOfficer(officer);
            violation.setCategory(category);
            violation.setLocation(location);
            violation.setPhotoUrl("/uploads/violations/" + fileName);

            Violation saved = violationService.recordViolation(violation);
            return ResponseEntity.ok(saved);

        } catch (IOException e) {
            return ResponseEntity.status(500).body("Failed to save photo: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Violation>> getAllViolations() {
        return ResponseEntity.ok(violationService.getAllViolations());
    }
    @GetMapping("/vehicle/{vehicleId}")
    public ResponseEntity<List<Violation>> getViolationsByVehicle(@PathVariable Integer vehicleId) {
        List<Violation> all = violationService.getAllViolations();
        List<Violation> filtered = all.stream()
                .filter(v -> v.getVehicle().getVehicleId().equals(vehicleId))
                .toList();
        return ResponseEntity.ok(filtered);
    }
    @PutMapping("/{violationId}/mark-paid")
    public ResponseEntity<?> markAsPaid(@PathVariable Integer violationId) {
        return violationService.markAsPaid(violationId);
    }
}