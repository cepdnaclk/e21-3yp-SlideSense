package com.slidesense.backend.controller;

import com.slidesense.backend.model.ThresholdSetting;
import com.slidesense.backend.model.SecurityLog;
import com.slidesense.backend.repository.ThresholdSettingRepository;
import com.slidesense.backend.repository.SecurityLogRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/config")
@Tag(name = "Admin Config")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminConfigController {

    private final ThresholdSettingRepository thresholdSettingRepository;
    private final SecurityLogRepository securityLogRepository;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public AdminConfigController(
            ThresholdSettingRepository thresholdSettingRepository,
            SecurityLogRepository securityLogRepository) {
        this.thresholdSettingRepository = thresholdSettingRepository;
        this.securityLogRepository = securityLogRepository;
    }

    @GetMapping("/thresholds")
    @Operation(summary = "Get admin threshold configurations")
    public ResponseEntity<Map<String, Object>> getThresholds() {
        ThresholdSetting setting = thresholdSettingRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> {
                    ThresholdSetting defaultSetting = new ThresholdSetting(60.0, 70.0, 55.0);
                    defaultSetting.setId(UUID.fromString("00000000-0000-0000-0000-000000000000"));
                    return thresholdSettingRepository.save(defaultSetting);
                });

        return ResponseEntity.ok(Map.of(
                "rainfall", setting.getRainfallThreshold(),
                "moisture", setting.getMoistureThreshold(),
                "vibration", setting.getVibrationThreshold()
        ));
    }

    @PostMapping("/thresholds")
    @Operation(summary = "Save/update admin threshold configurations")
    public ResponseEntity<Map<String, Object>> saveThresholds(@RequestBody Map<String, Double> payload) {
        ThresholdSetting setting = thresholdSettingRepository.findAll().stream()
                .findFirst()
                .orElseGet(() -> {
                    ThresholdSetting defaultSetting = new ThresholdSetting(60.0, 70.0, 55.0);
                    defaultSetting.setId(UUID.fromString("00000000-0000-0000-0000-000000000000"));
                    return defaultSetting;
                });

        if (payload.containsKey("rainfall")) {
            setting.setRainfallThreshold(payload.get("rainfall"));
        }
        if (payload.containsKey("moisture")) {
            setting.setMoistureThreshold(payload.get("moisture"));
        }
        if (payload.containsKey("vibration")) {
            setting.setVibrationThreshold(payload.get("vibration"));
        }
        setting.setUpdatedAt(OffsetDateTime.now());

        ThresholdSetting saved = thresholdSettingRepository.save(setting);

        // Also add a security log for this modification
        SecurityLog log = new SecurityLog("Threshold settings updated", 
            String.format("Rainfall: %.1f, Moisture: %.1f, Vibration: %.1f", 
                saved.getRainfallThreshold(), saved.getMoistureThreshold(), saved.getVibrationThreshold()));
        securityLogRepository.save(log);

        return ResponseEntity.ok(Map.of(
                "rainfall", saved.getRainfallThreshold(),
                "moisture", saved.getMoistureThreshold(),
                "vibration", saved.getVibrationThreshold()
        ));
    }

    @GetMapping("/security-logs")
    @Operation(summary = "Get system security logs")
    public ResponseEntity<List<Map<String, Object>>> getSecurityLogs() {
        List<SecurityLog> logs = securityLogRepository.findAll();
        // Sort descending by created_at (most recent logs first)
        List<Map<String, Object>> mapped = logs.stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(log -> Map.of(
                        "id", (Object) log.getId().toString(),
                        "event", (Object) log.getEvent(),
                        "detail", (Object) (log.getDetail() != null ? log.getDetail() : ""),
                        "time", (Object) log.getCreatedAt().format(DATE_FORMATTER)
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(mapped);
    }
}
