import { colors } from '../../../shared/styles/colors';

const METRIC_CONFIG = [
  { key: 'rainfall', label: 'Rainfall', unit: 'mm', color: colors.primary },
  { key: 'moisture', label: 'Avg moisture', unit: '%', color: colors.secondary },
  { key: 'vibration', label: 'Vibration', unit: 'Hz', color: colors.accent },
  { key: 'power', label: 'Power', unit: '%', color: colors.muted },
];

function clamp(value) {
  return Math.max(0, Math.min(100, value));
}

function getMoistureReadings(metrics) {
  const m1 = Number(metrics?.moistureSensors?.m1 ?? metrics?.m1 ?? metrics?.moisture ?? 0);
  const m2 = Number(metrics?.moistureSensors?.m2 ?? metrics?.m2 ?? metrics?.moisture ?? 0);
  const m3 = Number(metrics?.moistureSensors?.m3 ?? metrics?.m3 ?? metrics?.moisture ?? 0);
  const avg = Number(metrics?.moistureSensors?.avg ?? metrics?.avg_moisture ?? ((m1 + m2 + m3) / 3));

  return {
    m1,
    m2,
    m3,
    avg: Number.isFinite(avg) ? Number(avg.toFixed(1)) : 0,
  };
}

export default function RealTimeMetrics({ metrics }) {
  const moistureReadings = getMoistureReadings(metrics);
  const tiltValue = Number(metrics?.tilt ?? 0);
  const isTiltRisky = tiltValue === 1;
  const normalizedMetrics = {
    ...metrics,
    moisture: moistureReadings.avg,
  };

  return (
    <>
      <div className="metrics-grid">
        {METRIC_CONFIG.map((config) => {
          const value = clamp(normalizedMetrics?.[config.key] ?? 0);

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

      <div className="moisture-sensor-grid" aria-label="Individual moisture sensor values">
        <div className="detail-item">
          <span className="detail-item__label">Moisture sensor M1</span>
          <span className="detail-item__value">{clamp(moistureReadings.m1)}%</span>
        </div>
        <div className="detail-item">
          <span className="detail-item__label">Moisture sensor M2</span>
          <span className="detail-item__value">{clamp(moistureReadings.m2)}%</span>
        </div>
        <div className="detail-item">
          <span className="detail-item__label">Moisture sensor M3</span>
          <span className="detail-item__value">{clamp(moistureReadings.m3)}%</span>
        </div>
        <div className="detail-item">
          <span className="detail-item__label">Tilt status</span>
          <span className={`detail-item__value ${isTiltRisky ? 'tilt-risky' : 'tilt-safe'}`}>
            {isTiltRisky ? 'Risky (Tilt detected)' : 'Stable (No tilt)'}
          </span>
        </div>
      </div>
    </>
  );
}