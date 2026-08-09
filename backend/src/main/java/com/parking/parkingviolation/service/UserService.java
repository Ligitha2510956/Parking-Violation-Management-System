package com.parking.parkingviolation.service;

import com.parking.parkingviolation.entity.User;
import com.parking.parkingviolation.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    // Vehicle Owner self-registration
    public User registerOwner(User user) {
        user.setRole("OWNER");
        return userRepository.save(user);
    }

    // Admin creates an Officer account
    public User createOfficer(User user) {
        user.setRole("OFFICER");
        return userRepository.save(user);
    }

    // Login check — returns user if email+password match
    public Optional<User> login(String email, String password) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isPresent() && userOpt.get().getPassword().equals(password)) {
            return userOpt;
        }
        return Optional.empty();
    }
}