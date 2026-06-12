package com.slidesense.backend.service;

import com.slidesense.backend.dto.probe.CreateProbeRequest;
import com.slidesense.backend.dto.probe.ProbeResponse;
import com.slidesense.backend.model.Probe;
import com.slidesense.backend.model.enums.ProbeStatus;
import com.slidesense.backend.repository.ProbeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProbeAdminServiceTest {

    @Mock
    private ProbeRepository probeRepository;

    @InjectMocks
    private ProbeAdminService probeAdminService;

    private CreateProbeRequest createRequest;

    @BeforeEach
    void setUp() {
        createRequest = new CreateProbeRequest(
                "probe-1",
                "serial-123",
                "v1.0.0",
                45.0,
                90.0,
                ProbeStatus.ONLINE
        );
    }

    @Test
    void createProbe_success() {
        // Arrange
        when(probeRepository.findByProbeId("probe-1")).thenReturn(Optional.empty());
        when(probeRepository.findByHwSerial("serial-123")).thenReturn(Optional.empty());

        Probe savedProbe = new Probe();
        savedProbe.setProbeId("probe-1");
        savedProbe.setHwSerial("serial-123");
        savedProbe.setFirmwareVer("v1.0.0");
        savedProbe.setLatitude(45.0);
        savedProbe.setLongitude(90.0);
        savedProbe.setStatus(ProbeStatus.ONLINE);

        when(probeRepository.save(any(Probe.class))).thenReturn(savedProbe);

        // Act
        ProbeResponse response = probeAdminService.createProbe(createRequest);

        // Assert
        assertThat(response).isNotNull();
        assertThat(response.probeId()).isEqualTo("probe-1");
        assertThat(response.hwSerial()).isEqualTo("serial-123");
        verify(probeRepository, times(1)).save(any(Probe.class));
    }

    @Test
    void createProbe_duplicateProbeId_throwsConflict() {
        // Arrange
        when(probeRepository.findByProbeId("probe-1")).thenReturn(Optional.of(new Probe()));

        // Act & Assert
        assertThatThrownBy(() -> probeAdminService.createProbe(createRequest))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Probe ID already exists");

        verify(probeRepository, never()).save(any());
    }

    @Test
    void deactivateProbe_success() {
        // Arrange
        Probe probe = new Probe();
        probe.setProbeId("probe-1");
        probe.setStatus(ProbeStatus.ONLINE);

        when(probeRepository.findByProbeId("probe-1")).thenReturn(Optional.of(probe));

        // Act
        probeAdminService.deactivateProbe("probe-1");

        // Assert
        assertThat(probe.getStatus()).isEqualTo(ProbeStatus.DEACTIVATED);
        verify(probeRepository, times(1)).save(probe);
    }
}
