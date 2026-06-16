package com.slidesense.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(name = "threshold_settings")
public class ThresholdSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "rainfall_threshold", nullable = false)
    private Double rainfallThreshold;

    @Column(name = "moisture_threshold", nullable = false)
    private Double moistureThreshold;

    @Column(name = "vibration_threshold", nullable = false)
    private Double vibrationThreshold;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public ThresholdSetting() {
    }

    public ThresholdSetting(Double rainfallThreshold, Double moistureThreshold, Double vibrationThreshold) {
        this.rainfallThreshold = rainfallThreshold;
        this.moistureThreshold = moistureThreshold;
        this.vibrationThreshold = vibrationThreshold;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public Double getRainfallThreshold() {
        return rainfallThreshold;
    }

    public void setRainfallThreshold(Double rainfallThreshold) {
        this.rainfallThreshold = rainfallThreshold;
    }

    public Double getMoistureThreshold() {
        return moistureThreshold;
    }

    public void setMoistureThreshold(Double moistureThreshold) {
        this.moistureThreshold = moistureThreshold;
    }

    public Double getVibrationThreshold() {
        return vibrationThreshold;
    }

    public void setVibrationThreshold(Double vibrationThreshold) {
        this.vibrationThreshold = vibrationThreshold;
    }

    public OffsetDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(OffsetDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
