package com.slidesense.backend.controller;

import com.slidesense.backend.dto.publicapi.RainfallPointResponse;
import com.slidesense.backend.dto.publicapi.SoilSaturationPointResponse;
import com.slidesense.backend.service.PublicApiService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/public")
@Tag(name = "Public Research API")
@SecurityRequirement(name = "apiKeyAuth")
@PreAuthorize("hasRole('API_CLIENT')")
public class PublicApiController {

    private final PublicApiService publicApiService;

    public PublicApiController(PublicApiService publicApiService) {
        this.publicApiService = publicApiService;
    }

    @GetMapping("/rainfall-history")
    @Operation(summary = "Get rainfall aggregate history for a probe")
    public ResponseEntity<List<RainfallPointResponse>> rainfallHistory(
        @RequestParam UUID probeId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to
    ) {
        return ResponseEntity.ok(publicApiService.getRainfallHistory(probeId, from, to));
    }

    @GetMapping("/soil-saturation")
    @Operation(summary = "Get soil saturation aggregates for a probe")
    public ResponseEntity<List<SoilSaturationPointResponse>> soilSaturation(
        @RequestParam UUID probeId,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to
    ) {
        return ResponseEntity.ok(publicApiService.getSoilSaturation(probeId, from, to));
    }
}
