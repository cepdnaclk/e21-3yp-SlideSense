package com.slidesense.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.io.Serializable;
import java.time.OffsetDateTime;
import java.util.Objects;
import java.util.UUID;

@Embeddable
public class ProbeBucketId implements Serializable {

    @Column(name = "probe_id", nullable = false)
    private UUID probeId;

    @Column(name = "bucket", nullable = false)
    private OffsetDateTime bucket;

    public ProbeBucketId() {
    }

    public ProbeBucketId(UUID probeId, OffsetDateTime bucket) {
        this.probeId = probeId;
        this.bucket = bucket;
    }

    public UUID getProbeId() {
        return probeId;
    }

    public void setProbeId(UUID probeId) {
        this.probeId = probeId;
    }

    public OffsetDateTime getBucket() {
        return bucket;
    }

    public void setBucket(OffsetDateTime bucket) {
        this.bucket = bucket;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ProbeBucketId that)) {
            return false;
        }
        return Objects.equals(probeId, that.probeId) && Objects.equals(bucket, that.bucket);
    }

    @Override
    public int hashCode() {
        return Objects.hash(probeId, bucket);
    }
}
