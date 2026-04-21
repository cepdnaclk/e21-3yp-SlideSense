package com.slidesense.backend.dto.user;

import com.slidesense.backend.model.enums.UserRegistrationStatus;
import com.slidesense.backend.model.enums.UserRole;
import java.time.OffsetDateTime;
import java.util.UUID;

public record UserProfileResponse(
    UUID id,
    String email,
    String fullName,
    String phoneNumber,
    String address,
    UserRole role,
    UserRegistrationStatus registrationStatus,
    OffsetDateTime approvedAt,
    OffsetDateTime createdAt
) {
}
