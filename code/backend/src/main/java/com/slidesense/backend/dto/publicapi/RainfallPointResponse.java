package com.slidesense.backend.dto.publicapi;

import java.time.OffsetDateTime;
public record RainfallPointResponse(
    String probeId,
    OffsetDateTime bucket,
    Float totalRainfall
) {
}
