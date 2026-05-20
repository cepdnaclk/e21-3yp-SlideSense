package com.slidesense.backend.dto.ingestion;

import jakarta.validation.constraints.NotBlank;

public record ReplaySqsMessageRequest(@NotBlank String payload) {
}
