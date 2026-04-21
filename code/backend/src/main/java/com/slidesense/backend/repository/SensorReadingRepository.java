package com.slidesense.backend.repository;

import com.slidesense.backend.model.SensorReading;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SensorReadingRepository extends JpaRepository<SensorReading, Long> {

    List<SensorReading> findByProbe_IdAndRecordedAtBetweenOrderByRecordedAtDesc(
        UUID probeId,
        OffsetDateTime from,
        OffsetDateTime to
    );
}
