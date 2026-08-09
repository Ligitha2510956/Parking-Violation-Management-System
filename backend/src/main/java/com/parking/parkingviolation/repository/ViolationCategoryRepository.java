package com.parking.parkingviolation.repository;

import com.parking.parkingviolation.entity.ViolationCategory;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ViolationCategoryRepository extends JpaRepository<ViolationCategory, Integer> {
}