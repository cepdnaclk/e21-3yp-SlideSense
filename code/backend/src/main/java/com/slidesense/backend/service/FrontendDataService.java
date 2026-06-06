package com.slidesense.backend.service;

import com.slidesense.backend.dto.probe.FrontendLatestSimpleDTO;
import com.slidesense.backend.dto.probe.FrontendReadingDTO;
import com.slidesense.backend.model.Probe;
import com.slidesense.backend.model.SensorReading;
import com.slidesense.backend.model.ProbeAccessGrant;
import com.slidesense.backend.model.User;
import com.slidesense.backend.repository.ProbeRepository;
import com.slidesense.backend.repository.SensorReadingRepository;
import com.slidesense.backend.repository.UserRepository;
import com.slidesense.backend.repository.ProbeAccessGrantRepository;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FrontendDataService {

    private final ProbeRepository probeRepository;
    private final SensorReadingRepository sensorReadingRepository;
    private final UserRepository userRepository;
    private final ProbeAccessGrantRepository probeAccessGrantRepository;

    public FrontendDataService(ProbeRepository probeRepository, 
                               SensorReadingRepository sensorReadingRepository,
                               UserRepository userRepository,
                               ProbeAccessGrantRepository probeAccessGrantRepository) {
        this.probeRepository = probeRepository;
        this.sensorReadingRepository = sensorReadingRepository;
        this.userRepository = userRepository;
        this.probeAccessGrantRepository = probeAccessGrantRepository;
    }

    private List<FrontendReadingDTO> fetchReadingsForProbes(List<Probe> probes) {
        List<FrontendReadingDTO> result = new ArrayList<>();
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        OffsetDateTime from = now.minusDays(7); // default 7 days history

        for (Probe probe : probes) {
            List<SensorReading> readings = sensorReadingRepository.findByProbe_IdAndRecordedAtBetweenOrderByRecordedAtDesc(
                probe.getId(), from, now
            );
            
            if (readings.isEmpty()) {
                // mock empty reading
                result.add(new FrontendReadingDTO(
                    probe.getProbeId(), probe.getLatitude(), probe.getLongitude(), "low",
                    probe.getInstalledAt().toInstant().toEpochMilli(),
                    0f, 0f, 0f, 0f, 0f, 0f, 100f, 100f, "normal"
                ));
            } else {
                for (int i = 0; i < Math.min(readings.size(), 20); i++) {
                    SensorReading r = readings.get(i);
                    Float moisture = r.getMoisture() != null ? r.getMoisture() : 0f;
                    result.add(new FrontendReadingDTO(
                        probe.getProbeId(), probe.getLatitude(), probe.getLongitude(), "low",
                        r.getRecordedAt().toInstant().toEpochMilli(),
                        moisture, moisture, moisture, moisture,
                        r.getTiltAngle() != null ? r.getTiltAngle() : 0f,
                        r.getVibrationMag() != null ? r.getVibrationMag() : 0f,
                        100f, 100f, 
                        r.getSamplingMode() != null ? r.getSamplingMode().name().toLowerCase() : "normal"
                    ));
                }
            }
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<FrontendReadingDTO> fetchAllReadings(int limit, String nextToken) {
        List<Probe> probes = probeRepository.findAll();
        return fetchReadingsForProbes(probes);
    }

    @Transactional(readOnly = true)
    public List<FrontendReadingDTO> fetchMyReadings(String email, int limit, String nextToken) {
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            return new ArrayList<>();
        }
        List<ProbeAccessGrant> grants = probeAccessGrantRepository.findByUser_IdAndRevokedAtIsNull(user.getId());
        List<Probe> probes = grants.stream().map(ProbeAccessGrant::getProbe).collect(Collectors.toList());
        return fetchReadingsForProbes(probes);
    }

    @Transactional(readOnly = true)
    public FrontendLatestSimpleDTO fetchLatestSimple(String deviceID, String email) {
        // If email is provided, check access
        Probe probe = probeRepository.findByProbeId(deviceID).orElse(null);
        if (probe == null) return null;

        if (email != null) {
            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) return null;
            // Check if user has access or is admin/researcher
            if (user.getRole().name().equals("RESIDENT")) {
                var grant = probeAccessGrantRepository.findByUser_IdAndProbe_IdAndRevokedAtIsNull(user.getId(), probe.getId());
                if (grant.isEmpty()) {
                    return null; // Deny access
                }
            }
        }

        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        OffsetDateTime from = now.minusDays(30);
        List<SensorReading> readings = sensorReadingRepository.findByProbe_IdAndRecordedAtBetweenOrderByRecordedAtDesc(
            probe.getId(), from, now
        );
        if (readings.isEmpty()) {
            return new FrontendLatestSimpleDTO(0f, 0f, 0f, 0f, now.toInstant().toEpochMilli());
        }
        SensorReading r = readings.get(0);
        return new FrontendLatestSimpleDTO(
            r.getMoisture() != null ? r.getMoisture() : 0f,
            0f, // Rain
            r.getTiltAngle() != null ? r.getTiltAngle() : 0f,
            r.getVibrationMag() != null ? r.getVibrationMag() : 0f,
            r.getRecordedAt().toInstant().toEpochMilli()
        );
    }
}
