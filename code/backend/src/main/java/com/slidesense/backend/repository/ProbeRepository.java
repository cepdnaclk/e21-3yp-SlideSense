package com.slidesense.backend.repository;

import com.slidesense.backend.model.Probe;
import com.slidesense.backend.model.enums.ProbeStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProbeRepository extends JpaRepository<Probe, UUID> {

    Optional<Probe> findByProbeId(String probeId);

    Optional<Probe> findByHwSerial(String hwSerial);

    List<Probe> findAllByStatusNot(ProbeStatus status);
}
