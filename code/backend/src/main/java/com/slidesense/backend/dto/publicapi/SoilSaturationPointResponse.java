package com.slidesense.backend.dto.publicapi;

import java.time.OffsetDateTime;
import java.util.UUID;

public record SoilSaturationPointResponse(
    UUID probeId,
    OffsetDateTime bucket,
    Float avgMoisture,
    Float maxVibration
) {
}
