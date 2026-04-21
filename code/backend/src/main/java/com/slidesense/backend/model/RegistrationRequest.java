package com.slidesense.backend.model;

import com.slidesense.backend.model.enums.RegistrationRequestStatus;
import com.slidesense.backend.model.enums.RequestedRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.hibernate.annotations.Check;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "registration_requests")
@Check(constraints = "(requested_role = 'resident' AND probe_id IS NOT NULL) OR (requested_role = 'researcher' AND probe_id IS NULL)")
public class RegistrationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "requested_role", nullable = false, length = 20)
    private RequestedRole requestedRole = RequestedRole.RESIDENT;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "probe_id")
    private Probe probe;

    @Column(nullable = false, columnDefinition = "text")
    private String reason;

    @Column(name = "verification_notes", columnDefinition = "text")
    private String verificationNotes;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private RegistrationRequestStatus status = RegistrationRequestStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private OffsetDateTime reviewedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    public RegistrationRequest() {
    }
}
