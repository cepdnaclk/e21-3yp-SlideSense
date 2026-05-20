package com.slidesense.backend.service;

import com.slidesense.backend.dto.publicapi.RainfallPointResponse;
import com.slidesense.backend.dto.publicapi.SoilSaturationPointResponse;
import com.slidesense.backend.model.Probe;
import com.slidesense.backend.model.RainfallAggregate;
import com.slidesense.backend.model.SensorAggregate;
import com.slidesense.backend.repository.ProbeRepository;
import com.slidesense.backend.repository.RainfallAggregateRepository;
import com.slidesense.backend.repository.SensorAggregateRepository;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

@Service
public class PublicApiService {

    private final RainfallAggregateRepository rainfallAggregateRepository;
    private final SensorAggregateRepository sensorAggregateRepository;
    private final ProbeRepository probeRepository;

    public PublicApiService(
        RainfallAggregateRepository rainfallAggregateRepository,
        SensorAggregateRepository sensorAggregateRepository,
        ProbeRepository probeRepository
    ) {
        this.rainfallAggregateRepository = rainfallAggregateRepository;
        this.sensorAggregateRepository = sensorAggregateRepository;
        this.probeRepository = probeRepository;
    }

    public List<RainfallPointResponse> getRainfallHistory(String probeId, OffsetDateTime from, OffsetDateTime to) {
        Probe probe = resolveProbe(probeId);
        List<RainfallAggregate> points = rainfallAggregateRepository
            .findByIdProbeIdAndIdBucketBetweenOrderByIdBucketDesc(probe.getId(), from, to);

        return points
            .stream()
            .map(p -> new RainfallPointResponse(probe.getProbeId(), p.getId().getBucket(), p.getTotalRainfall()))
            .toList();
    }

    public List<SoilSaturationPointResponse> getSoilSaturation(String probeId, OffsetDateTime from, OffsetDateTime to) {
        Probe probe = resolveProbe(probeId);
        List<SensorAggregate> points = sensorAggregateRepository
            .findByIdProbeIdAndIdBucketBetweenOrderByIdBucketDesc(probe.getId(), from, to);

        return points
            .stream()
            .map(
                p ->
                    new SoilSaturationPointResponse(
                        probe.getProbeId(),
                        p.getId().getBucket(),
                        p.getAvgMoisture(),
                        p.getMaxVibration()
                    )
            )
            .toList();
    }

    private Probe resolveProbe(String probeId) {
        String normalizedProbeId = probeId != null ? probeId.trim() : null;
        if (normalizedProbeId == null || normalizedProbeId.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "probeId is required");
        }

        return probeRepository
            .findByProbeId(normalizedProbeId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Probe not found"));
    }
}
