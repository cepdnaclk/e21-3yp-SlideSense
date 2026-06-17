package com.slidesense.backend.service;

import com.slidesense.backend.dto.probe.FrontendLatestSimpleDTO;
import com.slidesense.backend.dto.probe.FrontendReadingDTO;
import com.slidesense.backend.model.Probe;
import com.slidesense.backend.model.SensorReading;
import com.slidesense.backend.model.ProbeAccessGrant;
import com.slidesense.backend.model.User;
import com.slidesense.backend.model.enums.ProbeStatus;
import com.slidesense.backend.model.enums.SamplingMode;
import com.slidesense.backend.model.enums.UserRole;
import com.slidesense.backend.repository.ProbeAccessGrantRepository;
import com.slidesense.backend.repository.ProbeRepository;
import com.slidesense.backend.repository.SensorReadingRepository;
import com.slidesense.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FrontendDataServiceTest {

    @Mock
    private ProbeRepository probeRepository;
    @Mock
    private SensorReadingRepository sensorReadingRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProbeAccessGrantRepository probeAccessGrantRepository;

    @InjectMocks
    private FrontendDataService frontendDataService;

    private Probe testProbe;
    private User testUser;
    private SensorReading testReading;

    @BeforeEach
    void setUp() {
        testProbe = new Probe();
        testProbe.setId(UUID.randomUUID());
        testProbe.setProbeId("test-probe-1");
        testProbe.setLatitude(10.0);
        testProbe.setLongitude(20.0);
        testProbe.setStatus(ProbeStatus.ONLINE);
        testProbe.setInstalledAt(OffsetDateTime.now(ZoneOffset.UTC));

        testUser = new User();
        testUser.setId(UUID.randomUUID());
        testUser.setEmail("test@example.com");
        testUser.setRole(UserRole.RESIDENT);

        testReading = new SensorReading();
        testReading.setProbe(testProbe);
        testReading.setMoisture(50f);
        testReading.setTiltAngle(5f);
        testReading.setVibrationMag(2f);
        testReading.setSamplingMode(SamplingMode.NORMAL);
        testReading.setRecordedAt(OffsetDateTime.now(ZoneOffset.UTC));
    }

    @Test
    void fetchAllReadings_returnsData() {
        when(probeRepository.findAllByStatusNot(ProbeStatus.DEACTIVATED)).thenReturn(List.of(testProbe));
        when(sensorReadingRepository.findByProbe_IdAndRecordedAtBetweenOrderByRecordedAtDesc(
                eq(testProbe.getId()), any(), any())).thenReturn(List.of(testReading));

        List<FrontendReadingDTO> readings = frontendDataService.fetchAllReadings(10, null, null, null);

        assertThat(readings).hasSize(1);
        assertThat(readings.get(0).deviceID()).isEqualTo("test-probe-1");
        assertThat(readings.get(0).avg_moisture()).isEqualTo(50f);
        assertThat(readings.get(0).tilt()).isEqualTo(5f);
    }

    @Test
    void fetchMyReadings_returnsDataForAuthorizedUser() {
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        
        ProbeAccessGrant grant = new ProbeAccessGrant();
        grant.setProbe(testProbe);
        grant.setUser(testUser);
        
        when(probeAccessGrantRepository.findByUser_IdAndRevokedAtIsNull(testUser.getId())).thenReturn(List.of(grant));
        when(sensorReadingRepository.findByProbe_IdAndRecordedAtBetweenOrderByRecordedAtDesc(
                eq(testProbe.getId()), any(), any())).thenReturn(List.of(testReading));

        List<FrontendReadingDTO> readings = frontendDataService.fetchMyReadings("test@example.com", 10, null, null, null);

        assertThat(readings).hasSize(1);
        assertThat(readings.get(0).deviceID()).isEqualTo("test-probe-1");
    }

    @Test
    void fetchMyReadings_returnsEmptyIfUserNotFound() {
        when(userRepository.findByEmail("unknown@example.com")).thenReturn(Optional.empty());

        List<FrontendReadingDTO> readings = frontendDataService.fetchMyReadings("unknown@example.com", 10, null, null, null);

        assertThat(readings).isEmpty();
    }

    @Test
    void fetchLatestSimple_returnsLatestData() {
        when(probeRepository.findByProbeId("test-probe-1")).thenReturn(Optional.of(testProbe));
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        
        ProbeAccessGrant grant = new ProbeAccessGrant();
        when(probeAccessGrantRepository.findByUser_IdAndProbe_IdAndRevokedAtIsNull(testUser.getId(), testProbe.getId()))
                .thenReturn(Optional.of(grant));

        when(sensorReadingRepository.findByProbe_IdAndRecordedAtBetweenOrderByRecordedAtDesc(
                eq(testProbe.getId()), any(), any())).thenReturn(List.of(testReading));

        FrontendLatestSimpleDTO latest = frontendDataService.fetchLatestSimple("test-probe-1", "test@example.com");

        assertThat(latest).isNotNull();
        assertThat(latest.moisture()).isEqualTo(50f);
        assertThat(latest.tilt()).isEqualTo(5f);
    }

    @Test
    void fetchLatestSimple_returnsNullIfAccessDenied() {
        when(probeRepository.findByProbeId("test-probe-1")).thenReturn(Optional.of(testProbe));
        when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(testUser));
        
        when(probeAccessGrantRepository.findByUser_IdAndProbe_IdAndRevokedAtIsNull(testUser.getId(), testProbe.getId()))
                .thenReturn(Optional.empty()); // No access

        FrontendLatestSimpleDTO latest = frontendDataService.fetchLatestSimple("test-probe-1", "test@example.com");

        assertThat(latest).isNull();
    }
}
