package com.slidesense.backend.controller;

import com.slidesense.backend.dto.auth.MessageResponse;
import com.slidesense.backend.dto.ingestion.SqsSensorReadingMessage;
import com.slidesense.backend.service.SqsIngestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ingestion")
@Tag(name = "HTTP Ingestion")
public class HttpIngestionController {

    private final SqsIngestionService sqsIngestionService;

    public HttpIngestionController(SqsIngestionService sqsIngestionService) {
        this.sqsIngestionService = sqsIngestionService;
    }

    @PostMapping("/http")
    @Operation(summary = "Ingest a sensor reading packet over HTTP")
    public ResponseEntity<MessageResponse> ingestHttpPayload(@Valid @RequestBody SqsSensorReadingMessage message) {
        sqsIngestionService.processMessage(message);
        return ResponseEntity.ok(new MessageResponse("HTTP payload ingested"));
    }
}