package com.slidesense.backend.dto.auth;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    String tokenType,
    long accessTokenExpiresInMs,
    java.util.Map<String, String> user
) {
}
