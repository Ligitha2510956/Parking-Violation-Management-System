package com.parking.parkingviolation.controller;

import com.parking.parkingviolation.entity.OfficerWarning;
import com.parking.parkingviolation.entity.User;
import com.parking.parkingviolation.entity.Violation;
import com.parking.parkingviolation.entity.Appeal;
import com.parking.parkingviolation.repository.AppealRepository;
import com.parking.parkingviolation.repository.OfficerWarningRepository;
import com.parking.parkingviolation.repository.UserRepository;
import com.parking.parkingviolation.repository.ViolationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/officers")
public class OfficerAccuracyController {

    @Autowired private UserRepository userRepository;
    @Autowired private ViolationRepository violationRepository;
    @Autowired private AppealRepository appealRepository;
    @Autowired private OfficerWarningRepository warningRepository;

    // An officer only appears in the accuracy list once they've recorded at
    // least this many violations — avoids flagging someone off a tiny sample.
    private static final int MIN_VIOLATIONS = 10;

    // Officers at or above this overturn percentage are flagged for Admin's attention.
    private static final double BENCHMARK_PERCENT = 20.0;

    // Accuracy = (violations of theirs that got an APPROVED appeal / total violations they recorded) * 100
    @GetMapping("/accuracy")
    public ResponseEntity<List<Map<String, Object>>> getOfficerAccuracy() {
        List<User> officers = userRepository.findAll().stream()
                .filter(u -> "OFFICER".equals(u.getRole()))
                .toList();

        List<Violation> allViolations = violationRepository.findAll();
        List<Appeal> allAppeals = appealRepository.findAll();

        List<Map<String, Object>> result = new ArrayList<>();

        for (User officer : officers) {
            List<Violation> officerViolations = allViolations.stream()
                    .filter(v -> v.getOfficer().getUserId().equals(officer.getUserId()))
                    .toList();

            int totalViolations = officerViolations.size();
            if (totalViolations < MIN_VIOLATIONS) continue; // minimum condition not met — skip

            long approvedAppealsCount = officerViolations.stream()
                    .filter(v -> allAppeals.stream().anyMatch(a ->
                            a.getViolation().getViolationId().equals(v.getViolationId())
                            && "APPROVED".equals(a.getStatus())))
                    .count();

            double mistakePercent = (approvedAppealsCount * 100.0) / totalViolations;
            double rounded = Math.round(mistakePercent * 10.0) / 10.0;

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("officerId", officer.getUserId());
            entry.put("name", officer.getName());
            entry.put("email", officer.getEmail());
            entry.put("totalViolations", totalViolations);
            entry.put("approvedAppeals", approvedAppealsCount);
            entry.put("mistakePercent", rounded);
            entry.put("flagged", mistakePercent >= BENCHMARK_PERCENT);
            result.add(entry);
        }

        result.sort((a, b) -> Double.compare((double) b.get("mistakePercent"), (double) a.get("mistakePercent")));
        return ResponseEntity.ok(result);
    }

    // Admin sends a warning message to a flagged officer
    @PostMapping("/{officerId}/warning")
    public ResponseEntity<?> sendWarning(@PathVariable Integer officerId, @RequestBody Map<String, String> body) {
        User officer = userRepository.findById(officerId)
                .orElseThrow(() -> new RuntimeException("Officer not found"));

        OfficerWarning warning = new OfficerWarning();
        warning.setOfficer(officer);
        warning.setMessage(body.get("message"));

        OfficerWarning saved = warningRepository.save(warning);
        return ResponseEntity.ok(saved);
    }

    // Officer can see warnings sent to them
    @GetMapping("/{officerId}/warnings")
    public ResponseEntity<List<OfficerWarning>> getWarnings(@PathVariable Integer officerId) {
        return ResponseEntity.ok(warningRepository.findByOfficer_UserIdOrderBySentAtDesc(officerId));
    }
}