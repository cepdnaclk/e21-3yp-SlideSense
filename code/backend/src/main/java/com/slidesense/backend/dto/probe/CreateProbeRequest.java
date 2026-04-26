package com.slidesense.backend.dto.probe;

import com.slidesense.backend.model.enums.ProbeStatus;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateProbeRequest(
    @NotBlank @Size(max = 64) String hwSerial,
    @Size(max = 20) String firmwareVer,
    @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
    @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
    ProbeStatus status
) {
}