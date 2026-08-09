package com.parking.parkingviolation.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "violation")
public class Violation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "violation_id")
    private Integer violationId;

    @ManyToOne
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    // The Officer who recorded this violation
    @ManyToOne
    @JoinColumn(name = "officer_id", nullable = false)
    private User officer;

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private ViolationCategory category;

    @Column(nullable = false)
    private String location;

    @Column(name = "photo_url", nullable = false)
    private String photoUrl;

    @Column(name = "fine_amount", nullable = false)
    private BigDecimal fineAmount;

    // "PENDING", "PAID", or "WAIVED"
    @Column(name = "fine_status", nullable = false)
    private String fineStatus = "PENDING";

    @Column(name = "recorded_at")
    private LocalDateTime recordedAt = LocalDateTime.now();

    // Getters and Setters
    public Integer getViolationId() { return violationId; }
    public void setViolationId(Integer violationId) { this.violationId = violationId; }

    public Vehicle getVehicle() { return vehicle; }
    public void setVehicle(Vehicle vehicle) { this.vehicle = vehicle; }

    public User getOfficer() { return officer; }
    public void setOfficer(User officer) { this.officer = officer; }

    public ViolationCategory getCategory() { return category; }
    public void setCategory(ViolationCategory category) { this.category = category; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getPhotoUrl() { return photoUrl; }
    public void setPhotoUrl(String photoUrl) { this.photoUrl = photoUrl; }

    public BigDecimal getFineAmount() { return fineAmount; }
    public void setFineAmount(BigDecimal fineAmount) { this.fineAmount = fineAmount; }

    public String getFineStatus() { return fineStatus; }
    public void setFineStatus(String fineStatus) { this.fineStatus = fineStatus; }

    public LocalDateTime getRecordedAt() { return recordedAt; }
    public void setRecordedAt(LocalDateTime recordedAt) { this.recordedAt = recordedAt; }
}