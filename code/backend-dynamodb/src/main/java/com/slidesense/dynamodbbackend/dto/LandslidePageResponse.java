package com.slidesense.dynamodbbackend.dto;

import java.util.List;

public record LandslidePageResponse(
        List<LandslideReadingResponse> items,
        String nextToken,
        int count
) {
}
