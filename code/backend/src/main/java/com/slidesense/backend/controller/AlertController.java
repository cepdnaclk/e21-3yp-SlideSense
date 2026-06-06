package com.slidesense.backend.controller;

import com.slidesense.backend.dto.probe.FrontendAlertDTO;
import com.slidesense.backend.service.FrontendDataService;
import com.slidesense.backend.dto.probe.FrontendReadingDTO;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/alerts")
public class AlertController {

    private final FrontendDataService frontendDataService;

    public AlertController(FrontendDataService frontendDataService) {
        this.frontendDataService = frontendDataService;
    }

    @GetMapping
    public ResponseEntity<List<FrontendAlertDTO>> getAlerts() {
        List<FrontendAlertDTO> alerts = new ArrayList<>();
        List<FrontendReadingDTO> readings = frontendDataService.fetchAllReadings(200, null);

        for (FrontendReadingDTO reading : readings) {
            if (reading.tilt() != null && reading.tilt() > 15) {
                alerts.add(new FrontendAlertDTO(
                    reading.deviceID() + "-movement",
                    "Critical",
                    OffsetDateTime.ofInstant(java.time.Instant.ofEpochMilli(reading.timestamp()), ZoneOffset.UTC),
                    reading.deviceID(),
                    "Unexpected physical movement detected"
                ));
            }
        }

        return ResponseEntity.ok(alerts);
    }
}
