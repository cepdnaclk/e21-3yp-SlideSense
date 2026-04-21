package com.slidesense.backend.service;

import com.slidesense.backend.dto.publicapi.RainfallPointResponse;
import com.slidesense.backend.dto.publicapi.SoilSaturationPointResponse;
import com.slidesense.backend.model.RainfallAggregate;
import com.slidesense.backend.model.SensorAggregate;
import com.slidesense.backend.repository.RainfallAggregateRepository;
import com.slidesense.backend.repository.SensorAggregateRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class PublicApiService {

    private final RainfallAggregateRepository rainfallAggregateRepository;
    private final SensorAggregateRepository sensorAggregateRepository;

    public PublicApiService(
        RainfallAggregateRepository rainfallAggregateRepository,
        SensorAggregateRepository sensorAggregateRepository
    ) {
        this.rainfallAggregateRepository = rainfallAggregateRepository;
        this.sensorAggregateRepository = sensorAggregateRepository;
    }

    public List<RainfallPointResponse> getRainfallHistory(UUID probeId, OffsetDateTime from, OffsetDateTime to) {
        List<RainfallAggregate> points = rainfallAggregateRepository
            .findByIdProbeIdAndIdBucketBetweenOrderByIdBucketDesc(probeId, from, to);

        return points
            .stream()
            .map(p -> new RainfallPointResponse(p.getId().getProbeId(), p.getId().getBucket(), p.getTotalRainfall()))
            .toList();
    }

    public List<SoilSaturationPointResponse> getSoilSaturation(UUID probeId, OffsetDateTime from, OffsetDateTime to) {
        List<SensorAggregate> points = sensorAggregateRepository
            .findByIdProbeIdAndIdBucketBetweenOrderByIdBucketDesc(probeId, from, to);

        return points
            .stream()
            .map(
                p ->
                    new SoilSaturationPointResponse(
                        p.getId().getProbeId(),
                        p.getId().getBucket(),
                        p.getAvgMoisture(),
                        p.getMaxVibration()
                    )
            )
            .toList();
    }
}
