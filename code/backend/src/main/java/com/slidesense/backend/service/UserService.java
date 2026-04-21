package com.slidesense.backend.service;

import com.slidesense.backend.dto.user.UserProfileResponse;
import com.slidesense.backend.model.User;
import com.slidesense.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserProfileResponse getCurrentProfile(String email) {
        User user = userRepository
            .findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        return new UserProfileResponse(
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.getPhoneNumber(),
            user.getAddress(),
            user.getRole(),
            user.getRegistrationStatus(),
            user.getApprovedAt(),
            user.getCreatedAt()
        );
    }
}
