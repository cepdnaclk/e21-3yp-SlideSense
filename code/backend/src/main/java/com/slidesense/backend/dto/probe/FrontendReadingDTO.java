package com.slidesense.backend.dto.probe;

public record FrontendReadingDTO(
    String deviceID,
    Double lat,
    Double lng,
    String risk,
    Long timestamp,
    Float m1,
    Float m2,
    Float m3,
    Float avg_moisture,
    Float tilt,
    Float vibration_mag,
    Float power,
    Float signalStrength,
    String mode
) {}
