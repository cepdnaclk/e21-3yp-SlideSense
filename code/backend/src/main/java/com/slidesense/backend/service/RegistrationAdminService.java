package com.slidesense.backend.service;

import com.slidesense.backend.dto.user.RegistrationRequestResponse;
import com.slidesense.backend.model.ProbeAccessGrant;
import com.slidesense.backend.model.RegistrationRequest;
import com.slidesense.backend.model.User;
import com.slidesense.backend.model.enums.RegistrationRequestStatus;
import com.slidesense.backend.model.enums.RequestedRole;
import com.slidesense.backend.model.enums.UserRegistrationStatus;
import com.slidesense.backend.model.enums.UserRole;
import com.slidesense.backend.repository.ProbeAccessGrantRepository;
import com.slidesense.backend.repository.RegistrationRequestRepository;
import com.slidesense.backend.repository.UserRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class RegistrationAdminService {

    private final RegistrationRequestRepository registrationRequestRepository;
    private final ProbeAccessGrantRepository probeAccessGrantRepository;
    private final UserRepository userRepository;

    public RegistrationAdminService(
        RegistrationRequestRepository registrationRequestRepository,
        ProbeAccessGrantRepository probeAccessGrantRepository,
        UserRepository userRepository
    ) {
        this.registrationRequestRepository = registrationRequestRepository;
        this.probeAccessGrantRepository = probeAccessGrantRepository;
        this.userRepository = userRepository;
    }

    public List<RegistrationRequestResponse> listByStatus(RegistrationRequestStatus status) {
        return registrationRequestRepository
            .findByStatusOrderByCreatedAtDesc(status)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public RegistrationRequestResponse approve(UUID requestId, String adminEmail, String verificationNotes) {
        RegistrationRequest request = registrationRequestRepository
            .findById(requestId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Registration request not found"));

        if (request.getStatus() != RegistrationRequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request is not in pending state");
        }

        User admin = userRepository
            .findByEmail(adminEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin user not found"));

        User user = request.getUser();
        user.setRegistrationStatus(UserRegistrationStatus.APPROVED);
        user.setRole(mapRequestedRoleToUserRole(request.getRequestedRole()));
        user.setApprovedAt(OffsetDateTime.now());
        user.setApprovedBy(admin);

        request.setStatus(RegistrationRequestStatus.APPROVED);
        request.setReviewedBy(admin);
        request.setReviewedAt(OffsetDateTime.now());
        request.setVerificationNotes(verificationNotes);

        userRepository.save(user);

        if (request.getRequestedRole() == RequestedRole.RESIDENT && request.getProbe() != null) {
            probeAccessGrantRepository
                .findByUser_IdAndProbe_IdAndRevokedAtIsNull(user.getId(), request.getProbe().getId())
                .orElseGet(() -> {
                    ProbeAccessGrant grant = new ProbeAccessGrant();
                    grant.setUser(user);
                    grant.setProbe(request.getProbe());
                    grant.setGrantedBy(admin);
                    return probeAccessGrantRepository.save(grant);
                });
        }

        return toResponse(registrationRequestRepository.save(request));
    }

    @Transactional
    public RegistrationRequestResponse reject(UUID requestId, String adminEmail, String verificationNotes) {
        RegistrationRequest request = registrationRequestRepository
            .findById(requestId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Registration request not found"));

        if (request.getStatus() != RegistrationRequestStatus.PENDING) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request is not in pending state");
        }

        User admin = userRepository
            .findByEmail(adminEmail)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin user not found"));

        User user = request.getUser();
        user.setRegistrationStatus(UserRegistrationStatus.REJECTED);

        request.setStatus(RegistrationRequestStatus.REJECTED);
        request.setReviewedBy(admin);
        request.setReviewedAt(OffsetDateTime.now());
        request.setVerificationNotes(verificationNotes);

        userRepository.save(user);
        return toResponse(registrationRequestRepository.save(request));
    }

    private UserRole mapRequestedRoleToUserRole(RequestedRole requestedRole) {
        return switch (requestedRole) {
            case RESIDENT -> UserRole.RESIDENT;
            case RESEARCHER -> UserRole.RESEARCHER;
        };
    }

    private RegistrationRequestResponse toResponse(RegistrationRequest request) {
        return new RegistrationRequestResponse(
            request.getId(),
            request.getUser().getId(),
            request.getUser().getEmail(),
            request.getRequestedRole(),
            request.getProbe() != null ? request.getProbe().getId() : null,
            request.getReason(),
            request.getVerificationNotes(),
            request.getStatus(),
            request.getReviewedAt(),
            request.getCreatedAt()
        );
    }
}
