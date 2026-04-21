package com.slidesense.backend.dto.user;

import com.slidesense.backend.model.enums.RegistrationRequestStatus;
import com.slidesense.backend.model.enums.RequestedRole;
import java.time.OffsetDateTime;
import java.util.UUID;

public record RegistrationRequestResponse(
    UUID id,
    UUID userId,
    String userEmail,
    RequestedRole requestedRole,
    UUID probeId,
    String reason,
    String verificationNotes,
    RegistrationRequestStatus status,
    OffsetDateTime reviewedAt,
    OffsetDateTime createdAt
) {
}
