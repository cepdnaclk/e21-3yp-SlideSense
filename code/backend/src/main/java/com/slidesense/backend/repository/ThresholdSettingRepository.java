package com.slidesense.backend.repository;

import com.slidesense.backend.model.ThresholdSetting;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ThresholdSettingRepository extends JpaRepository<ThresholdSetting, UUID> {
}
