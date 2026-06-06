package com.slidesense.backend.dto.probe;

import java.time.OffsetDateTime;

public record FrontendAlertDTO(
    String id,
    String severity,
    OffsetDateTime time,
    String node,
    String description
) {}
