package com.slidesense.backend.repository;

import com.slidesense.backend.model.Device;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceRepository extends JpaRepository<Device, UUID> {

    List<Device> findByUser_IdAndIsActiveTrue(UUID userId);
}
