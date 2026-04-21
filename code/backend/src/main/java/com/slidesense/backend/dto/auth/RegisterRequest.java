package com.slidesense.backend.dto.auth;

import com.slidesense.backend.model.enums.RequestedRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record RegisterRequest(
    @Email @NotBlank String email,
    @NotBlank @Size(max = 160) String fullName,
    @Size(max = 30) String phoneNumber,
    String address,
    @NotBlank @Size(min = 8, max = 128) String password,
    @NotNull RequestedRole requestedRole,
    UUID probeId,
    @NotBlank String reason
) {
}
