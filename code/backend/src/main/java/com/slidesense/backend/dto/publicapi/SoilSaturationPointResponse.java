package com.slidesense.backend.dto.publicapi;

import java.time.OffsetDateTime;
public record SoilSaturationPointResponse(
    String probeId,
    OffsetDateTime bucket,
    Float avgMoisture,
    Float maxVibration
) {
}
