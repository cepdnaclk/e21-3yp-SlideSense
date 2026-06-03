import { alertDisplayLimit, alertTemplates } from '../mock/alertMockData.js';
import { normalizeRiskLevel, sortByRiskSeverity } from '../../shared/utils/riskUtils.js';

export async function getAlertRows(probes) {
  const movementAlerts = probes
    .filter((probe) => probe?.metrics?.tiltDetected)
    .map((probe) => ({
      id: `${probe.id}-movement`,
      severity: 'Critical',
      time: probe.lastUpdated,
      node: probe.id,
      description: alertTemplates.movement,
    }));

  const riskAlerts = sortByRiskSeverity(
    probes.filter((probe) => normalizeRiskLevel(probe.riskLevel) !== 'low'),
  ).map((probe) => ({
    id: `${probe.id}-risk`,
    severity: normalizeRiskLevel(probe.riskLevel) === 'high' ? 'Critical' : 'Warning',
    time: probe.lastUpdated,
    node: probe.id,
    description: `${probe.id} ${alertTemplates.highRisk}`,
  }));

  return [...movementAlerts, ...riskAlerts].slice(0, alertDisplayLimit);
}