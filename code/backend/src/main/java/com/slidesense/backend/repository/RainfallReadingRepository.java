package com.slidesense.backend.repository;

import com.slidesense.backend.model.RainfallReading;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RainfallReadingRepository extends JpaRepository<RainfallReading, Long> {

    List<RainfallReading> findByProbe_IdAndRecordedAtBetweenOrderByRecordedAtDesc(
        UUID probeId,
        OffsetDateTime from,
        OffsetDateTime to
    );
}
