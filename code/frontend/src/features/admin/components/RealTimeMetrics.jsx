import { colors } from '../../../shared/styles/colors';

const METRIC_CONFIG = [
  { key: 'rainfall', label: 'Rainfall', unit: 'mm', color: colors.primary },
  { key: 'moisture', label: 'Moisture', unit: '%', color: colors.secondary },
  { key: 'vibration', label: 'Vibration', unit: 'Hz', color: colors.accent },
  { key: 'power', label: 'Power', unit: '%', color: colors.muted },
];

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

export default function RealTimeMetrics({ metrics }) {
  return (
    <div className="metrics-grid">
      {METRIC_CONFIG.map((config) => {
        const value = clamp(metrics?.[config.key] ?? 0);

        return (
          <div key={config.key} className="metric-card">
            <div className="metric-card__header">
              <span className="metric-card__label">{config.label}</span>
              <span className="metric-card__value">{value}{config.unit}</span>
            </div>
            <div className="metric-track">
              <span className="metric-track__fill" style={{ width: `${value}%`, backgroundColor: config.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}