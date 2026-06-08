import { normalizeRiskLevel, sortByRiskSeverity } from './riskUtils';

export function parseTimestamp(value) {
  const candidate = new Date(String(value ?? '').replace(' ', 'T'));
  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

export function isProbeOffline(probe) {
  const lastUpdated = parseTimestamp(probe?.lastUpdated);
  if (!lastUpdated) {
    return false;
  }

  const ageMs = Date.now() - lastUpdated.getTime();
  return ageMs > 12 * 60 * 60 * 1000 || Number(probe?.metrics?.signalStrength ?? 100) < 25;
}

export function getAlertRows(probes) {
  const movementAlerts = probes.filter((probe) => probe?.metrics?.tiltDetected).map((probe) => ({
    id: `${probe.id}-movement`,
    severity: 'Critical',
    time: probe.lastUpdated,
    node: probe.id,
    description: 'Tilt sensor movement detected',
  }));

  const riskAlerts = sortByRiskSeverity(
    probes.filter((probe) => normalizeRiskLevel(probe.riskLevel) !== 'low'),
  ).map((probe) => ({
    id: `${probe.id}-risk`,
    severity: normalizeRiskLevel(probe.riskLevel) === 'high' ? 'Critical' : 'Warning',
    time: probe.lastUpdated,
    node: probe.id,
    description: `${probe.id} reporting ${normalizeRiskLevel(probe.riskLevel)} risk conditions`,
  }));

  return [...movementAlerts, ...riskAlerts].slice(0, 6);
}
