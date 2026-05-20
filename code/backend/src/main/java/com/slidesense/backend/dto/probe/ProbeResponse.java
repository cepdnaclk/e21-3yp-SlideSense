package com.slidesense.backend.dto.probe;

import com.slidesense.backend.model.enums.ProbeStatus;
import java.time.OffsetDateTime;

public record ProbeResponse(
    String probeId,
    String hwSerial,
    String firmwareVer,
    Double latitude,
    Double longitude,
    ProbeStatus status,
    OffsetDateTime installedAt
) {
}