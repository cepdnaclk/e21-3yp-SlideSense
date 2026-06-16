package com.slidesense.backend.repository;

import com.slidesense.backend.model.SecurityLog;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SecurityLogRepository extends JpaRepository<SecurityLog, UUID> {
}
