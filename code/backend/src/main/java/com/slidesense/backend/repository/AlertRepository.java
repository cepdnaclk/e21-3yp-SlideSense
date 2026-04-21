package com.slidesense.backend.repository;

import com.slidesense.backend.model.Alert;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlertRepository extends JpaRepository<Alert, UUID> {

    List<Alert> findTop100ByProbe_IdOrderByTriggeredAtDesc(UUID probeId);
}
