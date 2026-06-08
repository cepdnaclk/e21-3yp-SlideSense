package com.slidesense.backend.controller;

import com.slidesense.backend.dto.auth.RegisterRequest;
import com.slidesense.backend.dto.auth.MessageResponse;
import com.slidesense.backend.dto.user.UserProfileResponse;
import com.slidesense.backend.model.enums.UserRole;
import com.slidesense.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@Tag(name = "Users")
@SecurityRequirement(name = "bearerAuth")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<UserProfileResponse> getCurrentUser(Authentication authentication) {
        return ResponseEntity.ok(userService.getCurrentProfile(authentication.getName()));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all users (Admin only)")
    public ResponseEntity<List<UserProfileResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Create a new user directly (Admin only)")
    public ResponseEntity<UserProfileResponse> createUser(@Valid @RequestBody RegisterRequest request, Authentication authentication) {
        return ResponseEntity.ok(userService.createUser(request, authentication.getName()));
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Delete a user (Admin only)")
    public ResponseEntity<MessageResponse> deleteUser(@PathVariable UUID userId) {
        return ResponseEntity.ok(userService.deleteUser(userId));
    }

    @PutMapping("/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Update a user's role (Admin only)")
    public ResponseEntity<UserProfileResponse> updateUserRole(@PathVariable UUID userId, @RequestParam UserRole role) {
        return ResponseEntity.ok(userService.updateUserRole(userId, role));
    }
}
