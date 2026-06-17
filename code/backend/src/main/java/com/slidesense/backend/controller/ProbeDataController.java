package com.slidesense.backend.controller;

import com.slidesense.backend.dto.probe.FrontendLatestSimpleDTO;
import com.slidesense.backend.dto.probe.FrontendReadingDTO;
import com.slidesense.backend.service.FrontendDataService;
import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/probes")
public class ProbeDataController {

    private final FrontendDataService frontendDataService;

    public ProbeDataController(FrontendDataService frontendDataService) {
        this.frontendDataService = frontendDataService;
    }

    @GetMapping("/readings")
    @PreAuthorize("hasRole('ADMIN') or hasRole('RESEARCHER')")
    public ResponseEntity<Map<String, Object>> getReadings(
            @RequestParam(defaultValue = "200") int limit,
            @RequestParam(required = false) String nextToken,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.OffsetDateTime startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.OffsetDateTime endDate) {
        
        List<FrontendReadingDTO> items = frontendDataService.fetchAllReadings(limit, nextToken, startDate, endDate);
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("items", items);
        response.put("nextToken", null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/my-readings")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> getMyReadings(
            Authentication authentication,
            @RequestParam(defaultValue = "200") int limit,
            @RequestParam(required = false) String nextToken,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.OffsetDateTime startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.OffsetDateTime endDate) {
        
        String email = authentication.getName();
        List<FrontendReadingDTO> items = frontendDataService.fetchMyReadings(email, limit, nextToken, startDate, endDate);
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("items", items);
        response.put("nextToken", null);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/latest")
    public ResponseEntity<FrontendLatestSimpleDTO> getLatestSimple(
            Authentication authentication,
            @RequestParam String deviceID) {
        
        String email = authentication != null ? authentication.getName() : null;
        FrontendLatestSimpleDTO latest = frontendDataService.fetchLatestSimple(deviceID, email);
        if (latest == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(latest);
    }
}
