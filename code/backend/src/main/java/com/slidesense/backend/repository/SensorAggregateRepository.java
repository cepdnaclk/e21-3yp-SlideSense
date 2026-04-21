package com.slidesense.backend.repository;

import com.slidesense.backend.model.ProbeBucketId;
import com.slidesense.backend.model.SensorAggregate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SensorAggregateRepository extends JpaRepository<SensorAggregate, ProbeBucketId> {

    List<SensorAggregate> findByIdProbeIdAndIdBucketBetweenOrderByIdBucketDesc(
        UUID probeId,
        OffsetDateTime from,
        OffsetDateTime to
    );
}
