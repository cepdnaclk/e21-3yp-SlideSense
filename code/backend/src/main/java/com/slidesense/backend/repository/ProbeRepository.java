package com.slidesense.backend.repository;

import com.slidesense.backend.model.Probe;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProbeRepository extends JpaRepository<Probe, UUID> {

    Optional<Probe> findByHwSerial(String hwSerial);
}
