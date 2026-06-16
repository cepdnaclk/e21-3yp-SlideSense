package com.slidesense.backend.service;

import com.slidesense.backend.dto.auth.AuthResponse;
import com.slidesense.backend.dto.auth.LoginRequest;
import com.slidesense.backend.dto.auth.MessageResponse;
import com.slidesense.backend.dto.auth.RefreshRequest;
import com.slidesense.backend.dto.auth.RegisterRequest;
import com.slidesense.backend.model.Probe;
import com.slidesense.backend.model.RegistrationRequest;
import com.slidesense.backend.model.User;
import com.slidesense.backend.model.enums.RegistrationRequestStatus;
import com.slidesense.backend.model.enums.RequestedRole;
import com.slidesense.backend.model.enums.UserRegistrationStatus;
import com.slidesense.backend.model.enums.UserRole;
import com.slidesense.backend.repository.ProbeRepository;
import com.slidesense.backend.repository.RegistrationRequestRepository;
import com.slidesense.backend.repository.UserRepository;
import com.slidesense.backend.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RegistrationRequestRepository registrationRequestRepository;
    @Mock
    private ProbeRepository probeRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@example.com");
        testUser.setPasswordHash("hashed_password");
        testUser.setRole(UserRole.RESIDENT);
        testUser.setRegistrationStatus(UserRegistrationStatus.APPROVED);
    }

    @Test
    void register_success_resident_with_probe() {
        RegisterRequest request = new RegisterRequest(
                "new@example.com", "New User", "1234567890", "123 Main St", "password123",
                RequestedRole.RESIDENT, "probe-123", "Reason for joining"
        );

        when(userRepository.findByEmail(request.email())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(request.password())).thenReturn("hashed_password");
        when(userRepository.save(any(User.class))).thenAnswer(i -> {
            User u = i.getArgument(0);
            u.setId(UUID.randomUUID());
            return u;
        });

        Probe testProbe = new Probe();
        testProbe.setProbeId("probe-123");
        when(probeRepository.findByProbeId("probe-123")).thenReturn(Optional.of(testProbe));

        MessageResponse response = authService.register(request);

        assertThat(response.message()).contains("pending admin approval");
        verify(userRepository).save(any(User.class));
        verify(registrationRequestRepository).save(any(RegistrationRequest.class));
    }

    @Test
    void register_fails_when_email_exists() {
        RegisterRequest request = new RegisterRequest(
                "test@example.com", "Test User", "1234567890", "123 Main St", "password123",
                RequestedRole.RESIDENT, "probe-123", "Reason for joining"
        );

        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(testUser));

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Email is already registered");

        verify(userRepository, never()).save(any());
        verify(registrationRequestRepository, never()).save(any());
    }

    @Test
    void register_fails_when_researcher_provides_probe() {
        RegisterRequest request = new RegisterRequest(
                "researcher@example.com", "Researcher", "1234567890", "123 Main St", "password123",
                RequestedRole.RESEARCHER, "probe-123", "Researching"
        );

        when(userRepository.findByEmail(request.email())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("probeId must not be provided for researcher requests");

        verify(userRepository, never()).save(any());
    }

    @Test
    void login_success() {
        LoginRequest request = new LoginRequest("test@example.com", "password123");

        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(testUser));
        when(jwtService.generateAccessToken(any(UserDetails.class), anyMap())).thenReturn("access_token");
        when(jwtService.generateRefreshToken(any(UserDetails.class), anyMap())).thenReturn("refresh_token");
        when(jwtService.getAccessExpirationMs()).thenReturn(86400000L);

        AuthResponse response = authService.login(request);

        assertThat(response.accessToken()).isEqualTo("access_token");
        assertThat(response.refreshToken()).isEqualTo("refresh_token");
        assertThat(response.user()).containsEntry("role", "RESIDENT");
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    void login_fails_when_disabled() {
        LoginRequest request = new LoginRequest("test@example.com", "password123");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new DisabledException("Disabled"));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Account is not approved yet");
    }

    @Test
    void login_fails_when_bad_credentials() {
        LoginRequest request = new LoginRequest("test@example.com", "wrong_password");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Invalid credentials");
    }

    @Test
    void refresh_success() {
        RefreshRequest request = new RefreshRequest("valid_refresh_token");

        when(jwtService.extractTokenType(request.refreshToken())).thenReturn("REFRESH");
        when(jwtService.extractUsername(request.refreshToken())).thenReturn("test@example.com");
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        when(jwtService.isTokenValid(eq(request.refreshToken()), any(UserDetails.class))).thenReturn(true);
        when(jwtService.generateAccessToken(any(UserDetails.class), anyMap())).thenReturn("new_access_token");
        when(jwtService.generateRefreshToken(any(UserDetails.class), anyMap())).thenReturn("new_refresh_token");
        when(jwtService.getAccessExpirationMs()).thenReturn(86400000L);

        AuthResponse response = authService.refresh(request);

        assertThat(response.accessToken()).isEqualTo("new_access_token");
        assertThat(response.refreshToken()).isEqualTo("new_refresh_token");
    }

    @Test
    void refresh_fails_for_invalid_token_type() {
        RefreshRequest request = new RefreshRequest("access_token");

        when(jwtService.extractTokenType(request.refreshToken())).thenReturn("ACCESS");
        when(jwtService.extractUsername(request.refreshToken())).thenReturn("test@example.com");

        assertThatThrownBy(() -> authService.refresh(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Token is not a refresh token");
    }
}
