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
}
