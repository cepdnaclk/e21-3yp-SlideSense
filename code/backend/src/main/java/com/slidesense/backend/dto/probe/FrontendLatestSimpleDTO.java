package com.slidesense.backend.dto.probe;

public record FrontendLatestSimpleDTO(
    Float moisture,
    Float rain,
    Float tilt,
    Float vibration,
    Long timestamp
) {}
