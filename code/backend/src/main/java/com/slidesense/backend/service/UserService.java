package com.slidesense.backend.service;

import com.slidesense.backend.dto.user.UserProfileResponse;
import com.slidesense.backend.model.User;
import com.slidesense.backend.repository.UserRepository;
import com.slidesense.backend.dto.auth.RegisterRequest;
import com.slidesense.backend.dto.auth.MessageResponse;
import com.slidesense.backend.model.Probe;
import com.slidesense.backend.model.ProbeAccessGrant;
import com.slidesense.backend.model.enums.RequestedRole;
import com.slidesense.backend.model.enums.UserRegistrationStatus;
import com.slidesense.backend.model.enums.UserRole;
import com.slidesense.backend.repository.ProbeAccessGrantRepository;
import com.slidesense.backend.repository.ProbeRepository;
import com.slidesense.backend.repository.RegistrationRequestRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final ProbeRepository probeRepository;
    private final ProbeAccessGrantRepository probeAccessGrantRepository;
    private final RegistrationRequestRepository registrationRequestRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
        UserRepository userRepository,
        ProbeRepository probeRepository,
        ProbeAccessGrantRepository probeAccessGrantRepository,
        RegistrationRequestRepository registrationRequestRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.probeRepository = probeRepository;
        this.probeAccessGrantRepository = probeAccessGrantRepository;
        this.registrationRequestRepository = registrationRequestRepository;
        this.passwordEncoder = passwordEncoder;
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

    public List<UserProfileResponse> getAllUsers() {
        return userRepository.findAll().stream()
            .map(user -> new UserProfileResponse(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhoneNumber(),
                user.getAddress(),
                user.getRole(),
                user.getRegistrationStatus(),
                user.getApprovedAt(),
                user.getCreatedAt()
            ))
            .toList();
    }

    @Transactional
    public UserProfileResponse createUser(RegisterRequest request, String adminEmail) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is already registered");
        }

        User admin = userRepository.findByEmail(adminEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin not found"));

        String normalizedProbeId = request.probeId() != null ? request.probeId().trim() : null;
        Probe assignedProbe = null;

        if (request.requestedRole() == RequestedRole.RESIDENT) {
            if (normalizedProbeId == null || normalizedProbeId.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Probe assignment is required for resident requests");
            }
            assignedProbe = probeRepository.findByProbeId(normalizedProbeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Probe not found"));
        } else if (normalizedProbeId != null && !normalizedProbeId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "probeId must not be provided for researcher requests");
        }

        User user = new User();
        user.setEmail(request.email());
        user.setFullName(request.fullName());
        user.setPhoneNumber(request.phoneNumber());
        user.setAddress(request.address());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(request.requestedRole() == RequestedRole.RESIDENT ? UserRole.RESIDENT : UserRole.RESEARCHER);
        user.setRegistrationStatus(UserRegistrationStatus.APPROVED);
        user.setApprovedAt(OffsetDateTime.now());
        user.setApprovedBy(admin);
        
        user = userRepository.save(user);

        if (assignedProbe != null) {
            ProbeAccessGrant grant = new ProbeAccessGrant();
            grant.setUser(user);
            grant.setProbe(assignedProbe);
            grant.setGrantedBy(admin);
            probeAccessGrantRepository.save(grant);
        }

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

    @Transactional
    public MessageResponse deleteUser(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
            
        probeAccessGrantRepository.deleteByUser(user);
        registrationRequestRepository.deleteByUser(user);
        
        userRepository.delete(user);
        return new MessageResponse("User deleted successfully");
    }

    @Transactional
    public UserProfileResponse updateUserRole(UUID userId, UserRole newRole) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setRole(newRole);
        user = userRepository.save(user);
        
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
