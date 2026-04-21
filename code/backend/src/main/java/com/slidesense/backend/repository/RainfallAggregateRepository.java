package com.slidesense.backend.repository;

import com.slidesense.backend.model.ProbeBucketId;
import com.slidesense.backend.model.RainfallAggregate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RainfallAggregateRepository extends JpaRepository<RainfallAggregate, ProbeBucketId> {

    List<RainfallAggregate> findByIdProbeIdAndIdBucketBetweenOrderByIdBucketDesc(
        UUID probeId,
        OffsetDateTime from,
        OffsetDateTime to
    );
}
