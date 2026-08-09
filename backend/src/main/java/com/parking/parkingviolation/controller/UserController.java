package com.parking.parkingviolation.controller;

import com.parking.parkingviolation.entity.User;
import com.parking.parkingviolation.repository.UserRepository;
import com.parking.parkingviolation.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public ResponseEntity<User> register(@RequestBody User user) {
        return ResponseEntity.ok(userService.registerOwner(user));
    }

    @PostMapping("/create-officer")
    public ResponseEntity<User> createOfficer(@RequestBody User user) {
        return ResponseEntity.ok(userService.createOfficer(user));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> credentials) {
        Optional<User> userOpt = userService.login(
                credentials.get("email"),
                credentials.get("password")
        );
        if (userOpt.isPresent()) {
            return ResponseEntity.ok(userOpt.get());
        } else {
            return ResponseEntity.status(401).body("Invalid email or password");
        }
    }

    // Get all officers (for Admin view)
    @GetMapping("/officers")
    public ResponseEntity<List<User>> getAllOfficers() {
        List<User> officers = userRepository.findAll().stream()
                .filter(u -> u.getRole().equals("OFFICER"))
                .toList();
        return ResponseEntity.ok(officers);
    }
}