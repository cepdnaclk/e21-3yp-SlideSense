package com.slidesense.backend.security;

import com.slidesense.backend.model.ApiKey;
import com.slidesense.backend.repository.ApiKeyRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {

    private final ApiKeyRepository apiKeyRepository;
    private final String apiKeyHeader;

    public ApiKeyAuthenticationFilter(
        ApiKeyRepository apiKeyRepository,
        @Value("${security.api-key.header:X-API-Key}") String apiKeyHeader
    ) {
        this.apiKeyRepository = apiKeyRepository;
        this.apiKeyHeader = apiKeyHeader;
    }

    @Override
    protected void doFilterInternal(
        HttpServletRequest request,
        HttpServletResponse response,
        FilterChain filterChain
    ) throws ServletException, IOException {
        String requestUri = request.getRequestURI();
        if (!requestUri.startsWith("/api/v1/public")) {
            filterChain.doFilter(request, response);
            return;
        }

        String rawApiKey = request.getHeader(apiKeyHeader);
        if (rawApiKey == null || rawApiKey.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        String keyHash = sha256Hex(rawApiKey);
        Optional<ApiKey> keyOptional = apiKeyRepository.findByKeyHash(keyHash);

        if (keyOptional.isPresent()) {
            ApiKey apiKey = keyOptional.get();
            boolean notExpired = apiKey.getExpiresAt() == null || apiKey.getExpiresAt().isAfter(OffsetDateTime.now());

            if (notExpired) {
                UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                    "api-key:" + apiKey.getOwnerEmail(),
                    null,
                    List.of(new SimpleGrantedAuthority("ROLE_API_CLIENT"))
                );
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        filterChain.doFilter(request, response);
    }

    private String sha256Hex(String value) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 algorithm is not available", ex);
        }
    }
}
