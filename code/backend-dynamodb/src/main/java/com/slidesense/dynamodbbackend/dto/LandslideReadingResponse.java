package com.slidesense.dynamodbbackend.dto;

public record LandslideReadingResponse(
        String deviceID,
        long timestamp,
        double m1,
        double m2,
        double m3,
        double avg_moisture,
        double rain,
        int tilt,
        String risk,
        double lat,
        double lng,
        boolean riskyByTilt
) {
}
