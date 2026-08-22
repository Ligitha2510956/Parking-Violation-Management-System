package com.parking.parkingviolation.controller;

import com.parking.parkingviolation.entity.Appeal;
import com.parking.parkingviolation.entity.User;
import com.parking.parkingviolation.entity.Violation;
import com.parking.parkingviolation.repository.AppealRepository;
import com.parking.parkingviolation.repository.UserRepository;
import com.parking.parkingviolation.repository.ViolationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/appeals")
public class AppealController {

    @Autowired private AppealRepository appealRepository;
    @Autowired private ViolationRepository violationRepository;
    @Autowired private UserRepository userRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    private static final List<String> VALID_STATUSES = List.of(
            "SUBMITTED", "UNDER_REVIEW", "EVIDENCE_REVIEWED", "APPROVED", "CANCELLED"
    );

    // Vehicle Owner submits an appeal. Evidence photo is optional (constraint: evidence optional).
    @PostMapping
    public ResponseEntity<?> submitAppeal(
            @RequestParam("violationId") Integer violationId,
            @RequestParam("ownerId") Integer ownerId,
            @RequestParam("reason") String reason,
            @RequestParam(value = "evidence", required = false) MultipartFile evidence
    ) {
        try {
            Violation violation = violationRepository.findById(violationId)
                    .orElseThrow(() -> new RuntimeException("Violation not found"));

            // Only the vehicle's actual registered owner can appeal it
            if (violation.getVehicle().getOwner() == null
                    || !violation.getVehicle().getOwner().getUserId().equals(ownerId)) {
                return ResponseEntity.status(403).body("You can only appeal violations on your own vehicle.");
            }

            // Only pending fines make sense to appeal
            if (!"PENDING".equals(violation.getFineStatus())) {
                return ResponseEntity.badRequest().body("Only pending fines can be appealed.");
            }

            // One appeal per violation
            if (appealRepository.findByViolation_ViolationId(violationId).isPresent()) {
                return ResponseEntity.badRequest().body("An appeal has already been submitted for this violation.");
            }

            User owner = userRepository.findById(ownerId)
                    .orElseThrow(() -> new RuntimeException("Owner not found"));

            Appeal appeal = new Appeal();
            appeal.setViolation(violation);
            appeal.setOwner(owner);
            appeal.setReason(reason);

            if (evidence != null && !evidence.isEmpty()) {
                String fileName = UUID.randomUUID() + "_" + evidence.getOriginalFilename();
                Path uploadPath = Paths.get(uploadDir);
                if (!Files.exists(uploadPath)) {
                    Files.createDirectories(uploadPath);
                }
                Files.copy(evidence.getInputStream(), uploadPath.resolve(fileName), StandardCopyOption.REPLACE_EXISTING);
                appeal.setCounterEvidenceUrl("/uploads/violations/" + fileName);
            }

            Appeal saved = appealRepository.save(appeal);
            return ResponseEntity.ok(saved);

        } catch (IOException e) {
            return ResponseEntity.status(500).body("Failed to save evidence: " + e.getMessage());
        }
    }

    // Owner's live tracking — fetch all their own appeals
    @GetMapping("/owner/{ownerId}")
    public ResponseEntity<List<Appeal>> getAppealsByOwner(@PathVariable Integer ownerId) {
        return ResponseEntity.ok(appealRepository.findByOwner_UserId(ownerId));
    }

    // Admin — all appeals
    @GetMapping
    public ResponseEntity<List<Appeal>> getAllAppeals() {
        return ResponseEntity.ok(appealRepository.findAll());
    }

    // Admin — advance the appeal through the workflow.
    // Approving an appeal automatically waives the linked fine (never done manually).
    @PutMapping("/{appealId}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Integer appealId, @RequestBody Map<String, String> body) {
        Appeal appeal = appealRepository.findById(appealId)
                .orElseThrow(() -> new RuntimeException("Appeal not found"));

        String newStatus = body.get("status");
        if (!VALID_STATUSES.contains(newStatus)) {
            return ResponseEntity.badRequest().body("Invalid status.");
        }

        appeal.setStatus(newStatus);

        if ("APPROVED".equals(newStatus) || "CANCELLED".equals(newStatus)) {
            appeal.setResolvedAt(LocalDateTime.now());
        }

        if ("APPROVED".equals(newStatus)) {
            Violation violation = appeal.getViolation();
            violation.setFineStatus("WAIVED");
            violationRepository.save(violation);
        }

        Appeal saved = appealRepository.save(appeal);
        return ResponseEntity.ok(saved);
    }
}