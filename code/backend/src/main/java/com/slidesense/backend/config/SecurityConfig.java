package com.slidesense.backend.config;

import com.slidesense.backend.security.ApiKeyAuthenticationFilter;
import com.slidesense.backend.security.CustomUserDetailsService;
import com.slidesense.backend.security.JwtAuthenticationFilter;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    @Bean
    public SecurityFilterChain securityFilterChain(
        HttpSecurity http,
        JwtAuthenticationFilter jwtAuthenticationFilter,
        ApiKeyAuthenticationFilter apiKeyAuthenticationFilter,
        AuthenticationProvider authenticationProvider
    ) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authenticationProvider(authenticationProvider)
            .exceptionHandling(exception ->
                exception
                    .authenticationEntryPoint((request, response, authException) -> {
                        log.warn(
                            "401 Unauthorized for {} {}. Reason: {}",
                            request.getMethod(),
                            request.getRequestURI(),
                            authException.getMessage()
                        );
                        response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                    })
                    .accessDeniedHandler((request, response, accessDeniedException) -> {
                        String principal =
                            request.getUserPrincipal() != null ? request.getUserPrincipal().getName() : "anonymous";
                        log.warn(
                            "403 Forbidden for {} {}. Principal: {}. Reason: {}",
                            request.getMethod(),
                            request.getRequestURI(),
                            principal,
                            accessDeniedException.getMessage()
                        );
                        response.sendError(HttpServletResponse.SC_FORBIDDEN, "Forbidden");
                    })
            )
            .authorizeHttpRequests(auth ->
                auth
                    .requestMatchers(
                        "/v3/api-docs/**",
                        "/swagger-ui/**",
                        "/swagger-ui.html",
                        "/actuator/health",
                        "/auth/register",
                        "/auth/login",
                        "/auth/refresh",
                        "/ingestion/http"
                    )
                    .permitAll()
                    .requestMatchers("/api/v1/public/**")
                    .hasRole("API_CLIENT")
                    .requestMatchers("/admin/**")
                    .hasRole("ADMIN")
                    .requestMatchers("/users/**", "/auth/logout")
                    .authenticated()
                    .anyRequest()
                    .authenticated()
            )
            .addFilterBefore(apiKeyAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider(CustomUserDetailsService userDetailsService) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
