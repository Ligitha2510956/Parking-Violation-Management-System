package com.parking.parkingviolation.controller;

import com.parking.parkingviolation.entity.ViolationCategory;
import com.parking.parkingviolation.repository.ViolationCategoryRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

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
    public ResponseEntity<ViolationCategory> addCategory(@Valid @RequestBody ViolationCategory category) {
        return ResponseEntity.ok(categoryRepository.save(category));
    }

    // Admin edits an existing category
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCategory(
            @PathVariable Integer id,
            @Valid @RequestBody ViolationCategory updatedCategory) {

        Optional<ViolationCategory> existingOpt = categoryRepository.findById(id);
        if (existingOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Category not found");
        }

        ViolationCategory existing = existingOpt.get();
        existing.setCategoryName(updatedCategory.getCategoryName());
        existing.setFineAmount(updatedCategory.getFineAmount());
        existing.setDescription(updatedCategory.getDescription());

        categoryRepository.save(existing);
        return ResponseEntity.ok(existing);
    }
}