package com.parking.parkingviolation.service;

import com.parking.parkingviolation.entity.Violation;
import com.parking.parkingviolation.entity.ViolationCategory;
import com.parking.parkingviolation.repository.ViolationRepository;
import com.parking.parkingviolation.repository.ViolationCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;
import org.springframework.http.ResponseEntity;
import java.time.LocalDateTime;

@Service
public class ViolationService {

    @Autowired
    private ViolationRepository violationRepository;

    @Autowired
    private ViolationCategoryRepository categoryRepository;

    // Record a new violation — fine amount is auto-calculated from category
    public Violation recordViolation(Violation violation) {
        ViolationCategory category = categoryRepository.findById(
                violation.getCategory().getCategoryId()
        ).orElseThrow(() -> new RuntimeException("Category not found"));

        violation.setFineAmount(category.getFineAmount()); // auto-calculated
        violation.setFineStatus("PENDING");
        return violationRepository.save(violation);
    }

    public List<Violation> getViolationsByOwner(Integer ownerId) {
        // We'll refine this once Vehicle-Owner link is queried properly
        return violationRepository.findAll(); // placeholder for now
    }

    public List<Violation> getAllViolations() {
        return violationRepository.findAll();
    }
    public ResponseEntity<?> markAsPaid(Integer violationId) {

    Optional<Violation> violationOptional =
            violationRepository.findById(violationId);

    if (violationOptional.isEmpty()) {
        return ResponseEntity.status(404).body("Violation not found");
    }

    Violation violation = violationOptional.get();

    violation.setFineStatus("PAID");
    violationRepository.save(violation);

    return ResponseEntity.ok(violation);
}
}