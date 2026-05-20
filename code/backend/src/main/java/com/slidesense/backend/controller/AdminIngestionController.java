package com.slidesense.backend.controller;

import com.slidesense.backend.dto.auth.MessageResponse;
import com.slidesense.backend.dto.ingestion.ReplaySqsMessageRequest;
import com.slidesense.backend.service.SqsIngestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/ingestion")
@Tag(name = "Admin Ingestion")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class AdminIngestionController {

    private final SqsIngestionService sqsIngestionService;

    public AdminIngestionController(SqsIngestionService sqsIngestionService) {
        this.sqsIngestionService = sqsIngestionService;
    }

    @PostMapping("/sqs/replay")
    @Operation(summary = "Replay one SQS payload manually")
    public ResponseEntity<MessageResponse> replaySqsPayload(@Valid @RequestBody ReplaySqsMessageRequest request) {
        sqsIngestionService.processPayload(request.payload());
        return ResponseEntity.ok(new MessageResponse("SQS payload ingested"));
    }
}
