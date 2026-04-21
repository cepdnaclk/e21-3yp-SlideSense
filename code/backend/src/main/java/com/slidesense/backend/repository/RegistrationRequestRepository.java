package com.slidesense.backend.repository;

import com.slidesense.backend.model.RegistrationRequest;
import com.slidesense.backend.model.enums.RegistrationRequestStatus;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegistrationRequestRepository extends JpaRepository<RegistrationRequest, UUID> {

    List<RegistrationRequest> findByStatusOrderByCreatedAtDesc(RegistrationRequestStatus status);
}
