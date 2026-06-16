package com.slidesense.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slidesense.backend.dto.auth.AuthResponse;
import com.slidesense.backend.dto.auth.LoginRequest;
import com.slidesense.backend.dto.auth.MessageResponse;
import com.slidesense.backend.dto.auth.RefreshRequest;
import com.slidesense.backend.dto.auth.RegisterRequest;
import com.slidesense.backend.model.enums.RequestedRole;
import com.slidesense.backend.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    private MockMvc mockMvc;

    @Mock
    private AuthService authService;

    @InjectMocks
    private AuthController authController;

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(authController).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void register_returnsOk() throws Exception {
        RegisterRequest request = new RegisterRequest(
                "test@example.com", "Test User", "1234567890", "Address", "password123",
                RequestedRole.RESIDENT, "probe-123", "Reason"
        );

        when(authService.register(any(RegisterRequest.class)))
                .thenReturn(new MessageResponse("Registration submitted and pending admin approval"));

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Registration submitted and pending admin approval"));
    }

    @Test
    void login_returnsTokens() throws Exception {
        LoginRequest request = new LoginRequest("test@example.com", "password123");

        AuthResponse authResponse = new AuthResponse(
                "access_token", "refresh_token", "Bearer", 86400000L, Map.of("role", "RESIDENT")
        );

        when(authService.login(any(LoginRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("access_token"))
                .andExpect(jsonPath("$.refreshToken").value("refresh_token"))
                .andExpect(jsonPath("$.user.role").value("RESIDENT"));
    }

    @Test
    void refresh_returnsNewTokens() throws Exception {
        RefreshRequest request = new RefreshRequest("old_refresh_token");

        AuthResponse authResponse = new AuthResponse(
                "new_access_token", "new_refresh_token", "Bearer", 86400000L, Map.of("role", "RESIDENT")
        );

        when(authService.refresh(any(RefreshRequest.class))).thenReturn(authResponse);

        mockMvc.perform(post("/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").value("new_access_token"))
                .andExpect(jsonPath("$.refreshToken").value("new_refresh_token"));
    }

    @Test
    void logout_returnsOk() throws Exception {
        when(authService.logout()).thenReturn(new MessageResponse("Logged out"));

        mockMvc.perform(post("/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Logged out"));
    }
}
