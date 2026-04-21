package com.slidesense.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.Immutable;

@Entity
@Immutable
@Table(name = "sensor_aggregates")
public class SensorAggregate {

    @EmbeddedId
    private ProbeBucketId id;

    @Column(name = "avg_moisture")
    private Float avgMoisture;

    @Column(name = "max_vibration")
    private Float maxVibration;

    public SensorAggregate() {
    }

    public ProbeBucketId getId() {
        return id;
    }

    public void setId(ProbeBucketId id) {
        this.id = id;
    }

    public Float getAvgMoisture() {
        return avgMoisture;
    }

    public void setAvgMoisture(Float avgMoisture) {
        this.avgMoisture = avgMoisture;
    }

    public Float getMaxVibration() {
        return maxVibration;
    }

    public void setMaxVibration(Float maxVibration) {
        this.maxVibration = maxVibration;
    }
}
