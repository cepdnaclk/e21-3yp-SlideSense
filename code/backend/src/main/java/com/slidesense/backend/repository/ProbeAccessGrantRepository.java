package com.slidesense.backend.repository;

import com.slidesense.backend.model.ProbeAccessGrant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProbeAccessGrantRepository extends JpaRepository<ProbeAccessGrant, UUID> {

    List<ProbeAccessGrant> findByUser_IdAndRevokedAtIsNull(UUID userId);

    Optional<ProbeAccessGrant> findByUser_IdAndProbe_IdAndRevokedAtIsNull(UUID userId, UUID probeId);
}
