package com.slidesense.backend.model;

import com.slidesense.backend.model.enums.ProbeStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "probes")
public class Probe {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "hw_serial", nullable = false, unique = true, length = 64)
    private String hwSerial;

    @Column(name = "firmware_ver", length = 20)
    private String firmwareVer;

    private Double latitude;

    private Double longitude;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProbeStatus status = ProbeStatus.ONLINE;

    @CreationTimestamp
    @Column(name = "installed_at", nullable = false, updatable = false)
    private OffsetDateTime installedAt;

    public Probe() {
    }
}
