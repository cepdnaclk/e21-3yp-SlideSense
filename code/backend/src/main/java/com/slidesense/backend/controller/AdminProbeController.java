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
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/probes")
@Tag(name = "Admin")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProbeController {

    private final ProbeAdminService probeAdminService;

    public AdminProbeController(ProbeAdminService probeAdminService) {
        this.probeAdminService = probeAdminService;
    }

    @PostMapping("/create")
    @Operation(summary = "Create a new probe")
    public ResponseEntity<ProbeResponse> createProbe(@Valid @RequestBody CreateProbeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(probeAdminService.createProbe(request));
    }

    @DeleteMapping("/{probeId}")
    @Operation(summary = "Deactivate (soft delete) a probe")
    public ResponseEntity<Void> deactivateProbe(@PathVariable String probeId) {
        probeAdminService.deactivateProbe(probeId);
        return ResponseEntity.noContent().build();
    }
}