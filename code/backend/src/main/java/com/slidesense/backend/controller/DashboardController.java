package com.slidesense.backend.controller;

import java.util.List;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dashboard")
public class DashboardController {

    @GetMapping("/admin")
    public ResponseEntity<Map<String, Object>> getAdminDashboard() {
        return ResponseEntity.ok(Map.of(
            "defaultThresholds", Map.of(
                "moistureWarning", 40,
                "moistureCritical", 60,
                "vibrationWarning", 15,
                "vibrationCritical", 30
            ),
            "users", List.of(
                Map.of("id", "u1", "name", "Admin User", "role", "admin"),
                Map.of("id", "u2", "name", "Researcher User", "role", "researcher")
            ),
            "securityLogs", List.of(
                Map.of("id", "log1", "event", "Login", "user", "Admin User", "time", "2024-01-01T10:00:00Z")
            )
        ));
    }

    @GetMapping("/researcher")
    public ResponseEntity<Map<String, Object>> getResearcherDashboard() {
        return ResponseEntity.ok(Map.of(
            "timeRanges", List.of(
                Map.of("id", "24h", "label", "Last 24 Hours"),
                Map.of("id", "7d", "label", "Last 7 Days"),
                Map.of("id", "30d", "label", "Last 30 Days")
            ),
            "defaultRange", "7d"
        ));
    }

    @GetMapping("/resident")
    public ResponseEntity<Map<String, Object>> getResidentDashboard() {
        return ResponseEntity.ok(Map.of(
            "safetyContent", Map.of(
                "emergencyContacts", List.of("119", "110"),
                "evacuationRoutes", "Follow the green signs to the nearest shelter."
            )
        ));
    }

    @GetMapping("/analytics-config")
    public ResponseEntity<Map<String, Object>> getAnalyticsConfig() {
        return ResponseEntity.ok(Map.of(
            "metrics", List.of("moisture", "rainfall", "vibration"),
            "timeRanges", List.of(
                Map.of("key", "1h", "label", "1 Hour"),
                Map.of("key", "24h", "label", "24 Hours")
            ),
            "defaultRange", "24h"
        ));
    }
}
