package com.slidesense.backend.controller;

import com.slidesense.backend.dto.user.RegistrationRequestResponse;
import com.slidesense.backend.dto.user.ReviewRegistrationRequest;
import com.slidesense.backend.model.enums.RegistrationRequestStatus;
import com.slidesense.backend.service.RegistrationAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/registration-requests")
@Tag(name = "Admin")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRegistrationController {

    private final RegistrationAdminService registrationAdminService;

    public AdminRegistrationController(RegistrationAdminService registrationAdminService) {
        this.registrationAdminService = registrationAdminService;
    }

    @GetMapping
    @Operation(summary = "List registration requests by status")
    public ResponseEntity<List<RegistrationRequestResponse>> listByStatus(
        @RequestParam(defaultValue = "PENDING") RegistrationRequestStatus status
    ) {
        return ResponseEntity.ok(registrationAdminService.listByStatus(status));
    }

    @PostMapping("/{requestId}/approve")
    @Operation(summary = "Approve registration request")
    public ResponseEntity<RegistrationRequestResponse> approve(
        @PathVariable UUID requestId,
        @Valid @RequestBody(required = false) ReviewRegistrationRequest review,
        Authentication authentication
    ) {
        String notes = review == null ? null : review.verificationNotes();
        return ResponseEntity.ok(registrationAdminService.approve(requestId, authentication.getName(), notes));
    }

    @PostMapping("/{requestId}/reject")
    @Operation(summary = "Reject registration request")
    public ResponseEntity<RegistrationRequestResponse> reject(
        @PathVariable UUID requestId,
        @Valid @RequestBody(required = false) ReviewRegistrationRequest review,
        Authentication authentication
    ) {
        String notes = review == null ? null : review.verificationNotes();
        return ResponseEntity.ok(registrationAdminService.reject(requestId, authentication.getName(), notes));
    }
}
