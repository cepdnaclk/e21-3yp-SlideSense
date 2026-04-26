package com.slidesense.backend.dto.probe;

import com.slidesense.backend.model.enums.ProbeStatus;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ProbeResponse(
    UUID id,
    String hwSerial,
    String firmwareVer,
    Double latitude,
    Double longitude,
    ProbeStatus status,
    OffsetDateTime installedAt
) {
}