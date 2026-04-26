package com.slidesense.backend.controller;

import com.slidesense.backend.dto.probe.CreateProbeRequest;
import com.slidesense.backend.dto.probe.ProbeResponse;
import com.slidesense.backend.service.ProbeAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/probes/create")
@Tag(name = "Admin")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProbeController {

    private final ProbeAdminService probeAdminService;

    public AdminProbeController(ProbeAdminService probeAdminService) {
        this.probeAdminService = probeAdminService;
    }

    @PostMapping
    @Operation(summary = "Create a new probe")
    public ResponseEntity<ProbeResponse> createProbe(@Valid @RequestBody CreateProbeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(probeAdminService.createProbe(request));
    }
}