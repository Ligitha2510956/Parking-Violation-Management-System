package com.parking.parkingviolation.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "appeal")
public class Appeal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "appeal_id")
    private Integer appealId;

    @ManyToOne
    @JoinColumn(name = "violation_id", nullable = false)
    private Violation violation;

    // The Vehicle Owner who submitted this appeal
    @ManyToOne
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Column(name = "counter_evidence_url")
    private String counterEvidenceUrl;

    // One of: SUBMITTED, UNDER_REVIEW, EVIDENCE_REVIEWED, APPROVED, CANCELLED
    @Column(nullable = false)
    private String status = "SUBMITTED";

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt = LocalDateTime.now();

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    // Getters and Setters
    public Integer getAppealId() { return appealId; }
    public void setAppealId(Integer appealId) { this.appealId = appealId; }

    public Violation getViolation() { return violation; }
    public void setViolation(Violation violation) { this.violation = violation; }

    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getCounterEvidenceUrl() { return counterEvidenceUrl; }
    public void setCounterEvidenceUrl(String counterEvidenceUrl) { this.counterEvidenceUrl = counterEvidenceUrl; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public LocalDateTime getResolvedAt() { return resolvedAt; }
    public void setResolvedAt(LocalDateTime resolvedAt) { this.resolvedAt = resolvedAt; }
}