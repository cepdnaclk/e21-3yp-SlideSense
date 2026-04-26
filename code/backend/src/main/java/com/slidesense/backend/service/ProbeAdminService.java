package com.slidesense.backend.service;

import com.slidesense.backend.dto.probe.CreateProbeRequest;
import com.slidesense.backend.dto.probe.ProbeResponse;
import com.slidesense.backend.model.Probe;
import com.slidesense.backend.model.enums.ProbeStatus;
import com.slidesense.backend.repository.ProbeRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ProbeAdminService {

    private final ProbeRepository probeRepository;

    public ProbeAdminService(ProbeRepository probeRepository) {
        this.probeRepository = probeRepository;
    }

    @Transactional
    public ProbeResponse createProbe(CreateProbeRequest request) {
        String normalizedSerial = request.hwSerial().trim();

        if (probeRepository.findByHwSerial(normalizedSerial).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Probe serial already exists");
        }

        Probe probe = new Probe();
        probe.setHwSerial(normalizedSerial);
        probe.setFirmwareVer(request.firmwareVer());
        probe.setLatitude(request.latitude());
        probe.setLongitude(request.longitude());
        probe.setStatus(request.status() != null ? request.status() : ProbeStatus.ONLINE);

        return toResponse(probeRepository.save(probe));
    }

    private ProbeResponse toResponse(Probe probe) {
        return new ProbeResponse(
            probe.getId(),
            probe.getHwSerial(),
            probe.getFirmwareVer(),
            probe.getLatitude(),
            probe.getLongitude(),
            probe.getStatus(),
            probe.getInstalledAt()
        );
    }
}