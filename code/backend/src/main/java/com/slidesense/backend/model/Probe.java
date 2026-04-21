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

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getHwSerial() {
        return hwSerial;
    }

    public void setHwSerial(String hwSerial) {
        this.hwSerial = hwSerial;
    }

    public String getFirmwareVer() {
        return firmwareVer;
    }

    public void setFirmwareVer(String firmwareVer) {
        this.firmwareVer = firmwareVer;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public ProbeStatus getStatus() {
        return status;
    }

    public void setStatus(ProbeStatus status) {
        this.status = status;
    }

    public OffsetDateTime getInstalledAt() {
        return installedAt;
    }

    public void setInstalledAt(OffsetDateTime installedAt) {
        this.installedAt = installedAt;
    }
}
