package com.slidesense.backend.model.enums;

import com.fasterxml.jackson.annotation.JsonCreator;

public enum SamplingMode {
    NORMAL,
    ELEVATED,
    BURST;

    @JsonCreator
    public static SamplingMode fromJson(String value) {
        if (value == null) {
            return null;
        }
        return SamplingMode.valueOf(value.trim().toUpperCase());
    }
}
