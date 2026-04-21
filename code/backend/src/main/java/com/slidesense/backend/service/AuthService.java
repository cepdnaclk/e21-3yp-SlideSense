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
import java.util.HashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RegistrationRequestRepository registrationRequestRepository;
    private final ProbeRepository probeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(
        UserRepository userRepository,
        RegistrationRequestRepository registrationRequestRepository,
        ProbeRepository probeRepository,
        PasswordEncoder passwordEncoder,
        AuthenticationManager authenticationManager,
        JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.registrationRequestRepository = registrationRequestRepository;
        this.probeRepository = probeRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Transactional
    public MessageResponse register(RegisterRequest request) {
        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is already registered");
        }

        if (request.requestedRole() == RequestedRole.RESIDENT && request.probeId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "probeId is required for resident requests");
        }

        if (request.requestedRole() == RequestedRole.RESEARCHER && request.probeId() != null) {
            throw new ResponseStatusException(
                HttpStatus.BAD_REQUEST,
                "probeId must not be provided for researcher requests"
            );
        }

        User user = new User();
        user.setEmail(request.email());
        user.setFullName(request.fullName());
        user.setPhoneNumber(request.phoneNumber());
        user.setAddress(request.address());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setRole(UserRole.RESIDENT);
        user.setRegistrationStatus(UserRegistrationStatus.PENDING);
        user = userRepository.save(user);

        RegistrationRequest registrationRequest = new RegistrationRequest();
        registrationRequest.setUser(user);
        registrationRequest.setRequestedRole(request.requestedRole());
        registrationRequest.setReason(request.reason());
        registrationRequest.setStatus(RegistrationRequestStatus.PENDING);

        if (request.requestedRole() == RequestedRole.RESIDENT) {
            Probe probe = probeRepository
                .findById(request.probeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Probe not found"));
            registrationRequest.setProbe(probe);
        }

        registrationRequestRepository.save(registrationRequest);

        return new MessageResponse("Registration submitted and pending admin approval");
    }

    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );
        } catch (DisabledException ex) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is not approved yet");
        } catch (BadCredentialsException ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        User user = userRepository
            .findByEmail(request.email())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        Map<String, Object> claims = new HashMap<>();
        claims.put("uid", user.getId().toString());
        claims.put("role", user.getRole().name());

        UserDetails userDetails = toUserDetails(user);
        String accessToken = jwtService.generateAccessToken(userDetails, claims);
        String refreshToken = jwtService.generateRefreshToken(userDetails, claims);

        return new AuthResponse(accessToken, refreshToken, "Bearer", jwtService.getAccessExpirationMs());
    }

    public AuthResponse refresh(RefreshRequest request) {
        String refreshToken = request.refreshToken();
        String type;
        String email;

        try {
            type = jwtService.extractTokenType(refreshToken);
            email = jwtService.extractUsername(refreshToken);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }

        if (!"REFRESH".equals(type)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Token is not a refresh token");
        }

        User user = userRepository
            .findByEmail(email)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        if (user.getRegistrationStatus() != UserRegistrationStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Account is not approved");
        }

        UserDetails userDetails = toUserDetails(user);
        if (!jwtService.isTokenValid(refreshToken, userDetails)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid refresh token");
        }

        Map<String, Object> claims = new HashMap<>();
        claims.put("uid", user.getId().toString());
        claims.put("role", user.getRole().name());

        String accessToken = jwtService.generateAccessToken(userDetails, claims);
        String newRefreshToken = jwtService.generateRefreshToken(userDetails, claims);

        return new AuthResponse(accessToken, newRefreshToken, "Bearer", jwtService.getAccessExpirationMs());
    }

    public MessageResponse logout() {
        return new MessageResponse("Logged out");
    }

    private UserDetails toUserDetails(User user) {
        return org.springframework.security.core.userdetails.User
            .withUsername(user.getEmail())
            .password(user.getPasswordHash())
            .roles(user.getRole().name())
            .build();
    }
}
