package com.slidesense.backend.dto.publicapi;

import java.time.OffsetDateTime;
import java.util.UUID;

public record RainfallPointResponse(
    UUID probeId,
    OffsetDateTime bucket,
    Float totalRainfall
) {
}
