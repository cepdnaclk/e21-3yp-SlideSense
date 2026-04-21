package com.slidesense.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import org.hibernate.annotations.Immutable;

@Entity
@Immutable
@Table(name = "rainfall_aggregates")
public class RainfallAggregate {

    @EmbeddedId
    private ProbeBucketId id;

    @Column(name = "total_rainfall")
    private Float totalRainfall;

    public RainfallAggregate() {
    }
}
