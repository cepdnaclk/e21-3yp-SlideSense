package com.slidesense.backend.model;

import com.slidesense.backend.model.enums.SamplingMode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(
    name = "sensor_readings",
    indexes = {
        @Index(name = "idx_sensor_readings_probe_time", columnList = "probe_id, recorded_at")
    }
)
public class SensorReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "probe_id", nullable = false)
    private Probe probe;

    @Column(name = "recorded_at", nullable = false)
    private OffsetDateTime recordedAt;

    private Float moisture;

    @Column(name = "tilt_angle")
    private Float tiltAngle;

    @Column(name = "vibration_mag")
    private Float vibrationMag;

    @Enumerated(EnumType.STRING)
    @Column(name = "sampling_mode", length = 10)
    private SamplingMode samplingMode;

    public SensorReading() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Probe getProbe() {
        return probe;
    }

    public void setProbe(Probe probe) {
        this.probe = probe;
    }

    public OffsetDateTime getRecordedAt() {
        return recordedAt;
    }

    public void setRecordedAt(OffsetDateTime recordedAt) {
        this.recordedAt = recordedAt;
    }

    public Float getMoisture() {
        return moisture;
    }

    public void setMoisture(Float moisture) {
        this.moisture = moisture;
    }

    public Float getTiltAngle() {
        return tiltAngle;
    }

    public void setTiltAngle(Float tiltAngle) {
        this.tiltAngle = tiltAngle;
    }

    public Float getVibrationMag() {
        return vibrationMag;
    }

    public void setVibrationMag(Float vibrationMag) {
        this.vibrationMag = vibrationMag;
    }

    public SamplingMode getSamplingMode() {
        return samplingMode;
    }

    public void setSamplingMode(SamplingMode samplingMode) {
        this.samplingMode = samplingMode;
    }
}
