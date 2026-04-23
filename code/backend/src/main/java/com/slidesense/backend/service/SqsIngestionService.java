package com.slidesense.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.slidesense.backend.dto.ingestion.SqsSensorReadingMessage;
import com.slidesense.backend.model.Probe;
import com.slidesense.backend.model.RainfallReading;
import com.slidesense.backend.model.SensorReading;
import com.slidesense.backend.repository.ProbeRepository;
import com.slidesense.backend.repository.RainfallReadingRepository;
import com.slidesense.backend.repository.SensorReadingRepository;
import java.io.IOException;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class SqsIngestionService {

    private static final Logger log = LoggerFactory.getLogger(SqsIngestionService.class);

    private final ObjectMapper objectMapper;
    private final ProbeRepository probeRepository;
    private final SensorReadingRepository sensorReadingRepository;
    private final RainfallReadingRepository rainfallReadingRepository;

    public SqsIngestionService(
        ObjectMapper objectMapper,
        ProbeRepository probeRepository,
        SensorReadingRepository sensorReadingRepository,
        RainfallReadingRepository rainfallReadingRepository
    ) {
        this.objectMapper = objectMapper;
        this.probeRepository = probeRepository;
        this.sensorReadingRepository = sensorReadingRepository;
        this.rainfallReadingRepository = rainfallReadingRepository;
    }

    @Transactional
    public void processPayload(String payload) {
        SqsSensorReadingMessage message;
        try {
            message = objectMapper.readValue(payload, SqsSensorReadingMessage.class);
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid SQS payload JSON", ex);
        }

        processMessage(message);
    }

    @Transactional
    public void processMessage(SqsSensorReadingMessage message) {
        if (message.recordedAt() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "recordedAt is required");
        }

        Probe probe = resolveProbe(message.probeId(), message.hwSerial());

        boolean hasSensorData =
            message.moisture() != null ||
            message.tiltAngle() != null ||
            message.vibrationMag() != null ||
            message.samplingMode() != null;

        if (hasSensorData) {
            SensorReading sensorReading = new SensorReading();
            sensorReading.setProbe(probe);
            sensorReading.setRecordedAt(message.recordedAt());
            sensorReading.setMoisture(message.moisture());
            sensorReading.setTiltAngle(message.tiltAngle());
            sensorReading.setVibrationMag(message.vibrationMag());
            sensorReading.setSamplingMode(message.samplingMode());
            sensorReadingRepository.save(sensorReading);
        }

        if (message.rainfallMm() != null) {
            RainfallReading rainfallReading = new RainfallReading();
            rainfallReading.setProbe(probe);
            rainfallReading.setRecordedAt(message.recordedAt());
            rainfallReading.setRainfallMm(message.rainfallMm());
            rainfallReadingRepository.save(rainfallReading);
        }

        if (!hasSensorData && message.rainfallMm() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Payload has no reading fields");
        }

        log.debug("Ingested SQS message for probe {} at {}", probe.getId(), message.recordedAt());
    }

    private Probe resolveProbe(UUID probeId, String hwSerial) {
        if (probeId != null) {
            return probeRepository
                .findById(probeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Probe not found"));
        }

        if (hwSerial != null && !hwSerial.isBlank()) {
            return probeRepository
                .findByHwSerial(hwSerial)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Probe not found"));
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Either probeId or hwSerial is required");
    }
}
