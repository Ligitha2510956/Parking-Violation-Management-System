package com.parking.parkingviolation.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

@Entity
@Table(name = "violation_category")
public class ViolationCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Integer categoryId;

    @NotBlank(message = "Category name is required")
    @Column(name = "category_name", nullable = false)
    private String categoryName;

    @DecimalMin(value = "0.0", inclusive = true, message = "Fine amount cannot be negative")
    @Column(name = "fine_amount", nullable = false)
    private BigDecimal fineAmount;

    private String description;

    // Getters and Setters
    public Integer getCategoryId() { return categoryId; }
    public void setCategoryId(Integer categoryId) { this.categoryId = categoryId; }

    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }

    public BigDecimal getFineAmount() { return fineAmount; }
    public void setFineAmount(BigDecimal fineAmount) { this.fineAmount = fineAmount; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}