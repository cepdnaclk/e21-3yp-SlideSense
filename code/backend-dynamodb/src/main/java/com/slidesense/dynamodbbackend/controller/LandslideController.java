package com.slidesense.dynamodbbackend.controller;

import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.slidesense.dynamodbbackend.dto.LandslidePageResponse;
import com.slidesense.dynamodbbackend.service.LandslideService;

import software.amazon.awssdk.core.exception.SdkClientException;
import software.amazon.awssdk.services.dynamodb.model.DynamoDbException;

@RestController
@RequestMapping("/api/landslide")
@CrossOrigin(origins = "*")
public class LandslideController {

    private final LandslideService landslideService;
    private final String defaultDeviceId;

    public LandslideController(
            LandslideService landslideService,
            @Value("${app.dynamodb.default-device-id:LandslideProject/Prob01}") String defaultDeviceId
    ) {
        this.landslideService = landslideService;
        this.defaultDeviceId = defaultDeviceId;
    }

    @GetMapping
        public ResponseEntity<?> getAllData(
                        @RequestParam(name = "limit", required = false, defaultValue = "25") int limit,
                        @RequestParam(name = "nextToken", required = false) String nextToken
        ) {
                if (limit < 1 || limit > 200) {
                        return ResponseEntity.badRequest()
                                        .body(Map.of("error", "limit must be between 1 and 200"));
                }

        try {
                        LandslidePageResponse data = landslideService.getAllData(limit, nextToken);
                        return ResponseEntity.ok(data);
                } catch (IllegalArgumentException ex) {
                        return ResponseEntity.badRequest().body(Map.of(
                                        "error", "Invalid pagination token",
                                        "details", ex.getMessage()
                        ));
        } catch (SdkClientException ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of(
                            "error", "AWS credentials are not configured",
                            "details", "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, or use an IAM role/profile."
                    ));
        } catch (DynamoDbException ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of(
                            "error", "DynamoDB request failed",
                            "details", ex.getMessage()
                    ));
        }
    }

    @GetMapping("/latest")
    public ResponseEntity<?> getLatest(
            @RequestParam(name = "deviceID", required = false) String deviceID
    ) {
        String targetDeviceId = (deviceID == null || deviceID.isBlank()) ? defaultDeviceId : deviceID;
        try {
            return landslideService.getLatestReading(targetDeviceId)
                    .<ResponseEntity<?>>map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (SdkClientException ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of(
                            "error", "AWS credentials are not configured",
                            "details", "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, or use an IAM role/profile."
                    ));
        } catch (DynamoDbException ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of(
                            "error", "DynamoDB request failed",
                            "details", ex.getMessage()
                    ));
        }
    }

    @GetMapping("/latest/simple")
    public ResponseEntity<Map<String, String>> getLatestSimple(
            @RequestParam(name = "deviceID", required = false) String deviceID
    ) {
        String targetDeviceId = (deviceID == null || deviceID.isBlank()) ? defaultDeviceId : deviceID;
        try {
            return landslideService.getLatestReading(targetDeviceId)
                    .map(data -> Map.of(
                            "moisture", String.valueOf(data.m1()),
                            "rain", String.valueOf(data.rain()),
                            "tilt", String.valueOf(data.tilt()),
                            "riskyByTilt", String.valueOf(data.riskyByTilt())
                    ))
                    .map(ResponseEntity::ok)
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (SdkClientException ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(Map.of(
                            "error", "AWS credentials are not configured",
                            "details", "Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY, or use an IAM role/profile."
                    ));
        } catch (DynamoDbException ex) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of(
                            "error", "DynamoDB request failed",
                            "details", ex.getMessage()
                    ));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        return ResponseEntity.ok(Map.of("status", "ok"));
    }
}
