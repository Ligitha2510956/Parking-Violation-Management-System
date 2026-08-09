package com.parking.parkingviolation.controller;

import com.parking.parkingviolation.entity.ViolationCategory;
import com.parking.parkingviolation.repository.ViolationCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class ViolationCategoryController {

    @Autowired
    private ViolationCategoryRepository categoryRepository;

    // Get all categories (needed so Officer can pick one while recording a violation)
    @GetMapping
    public ResponseEntity<List<ViolationCategory>> getAllCategories() {
        return ResponseEntity.ok(categoryRepository.findAll());
    }

    // Admin adds a new category
    @PostMapping
    public ResponseEntity<ViolationCategory> addCategory(@RequestBody ViolationCategory category) {
        return ResponseEntity.ok(categoryRepository.save(category));
    }
}