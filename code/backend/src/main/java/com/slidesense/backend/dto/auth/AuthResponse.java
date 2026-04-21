package com.slidesense.backend.dto.auth;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    String tokenType,
    long accessTokenExpiresInMs
) {
}
