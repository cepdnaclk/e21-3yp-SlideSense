import { colors, riskColors } from '../styles/colors';

export const RISK_LEVELS = ['low', 'medium', 'high'];

export function normalizeRiskLevel(level) {
  return RISK_LEVELS.includes(String(level).toLowerCase()) ? String(level).toLowerCase() : 'low';
}

export function getRiskColor(level) {
  return riskColors[normalizeRiskLevel(level)] ?? colors.accent;
}

export function getRiskLabel(level) {
  const normalized = normalizeRiskLevel(level);
  return normalized === 'low' ? 'No risk' : normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function getRiskCounts(probes) {
  return probes.reduce(
    (counts, probe) => {
      const normalized = normalizeRiskLevel(probe.riskLevel);
      counts.total += 1;
      counts[normalized] += 1;
      return counts;
    },
    { total: 0, low: 0, medium: 0, high: 0 },
  );
}

export function sortByRiskSeverity(probes) {
  const severity = { high: 0, medium: 1, low: 2 };
  return [...probes].sort((left, right) => severity[normalizeRiskLevel(left.riskLevel)] - severity[normalizeRiskLevel(right.riskLevel)]);
}