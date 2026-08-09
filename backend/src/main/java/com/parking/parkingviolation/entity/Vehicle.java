package com.parking.parkingviolation.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "vehicle")
public class Vehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vehicle_id")
    private Integer vehicleId;

    @Column(name = "vehicle_number", unique = true, nullable = false)
    private String vehicleNumber;

    // Many vehicles -> one owner (constraint #5: owner can have multiple vehicles)
    @ManyToOne
    @JoinColumn(name = "owner_id", nullable = true)
    private User owner;

    @Column(name = "vehicle_type")
    private String vehicleType;

    // Getters and Setters
    public Integer getVehicleId() { return vehicleId; }
    public void setVehicleId(Integer vehicleId) { this.vehicleId = vehicleId; }

    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }

    public User getOwner() { return owner; }
    public void setOwner(User owner) { this.owner = owner; }

    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }
}