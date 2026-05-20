package com.slidesense.backend.dto.ingestion;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.slidesense.backend.model.enums.SamplingMode;
import java.time.OffsetDateTime;

public record SqsSensorReadingMessage(
    @JsonAlias("probe_id") String probeId,
    Long deviceTimeMs,
    String hwSerial,
    OffsetDateTime recordedAt,
    Float moisture,
    Float tiltAngle,
    Float vibrationMag,
    SamplingMode samplingMode,
    Float rainfallMm
) {
}
