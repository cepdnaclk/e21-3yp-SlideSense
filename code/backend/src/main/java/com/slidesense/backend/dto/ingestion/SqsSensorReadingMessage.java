package com.slidesense.backend.dto.ingestion;

import com.slidesense.backend.model.enums.SamplingMode;
import java.time.OffsetDateTime;
import java.util.UUID;

public record SqsSensorReadingMessage(
    UUID probeId,
    String hwSerial,
    OffsetDateTime recordedAt,
    Float moisture,
    Float tiltAngle,
    Float vibrationMag,
    SamplingMode samplingMode,
    Float rainfallMm
) {
}
