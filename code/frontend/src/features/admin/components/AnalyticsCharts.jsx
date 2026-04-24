import { chartColors } from '../../../shared/styles/colors';

const METRICS = [
  { key: 'rainfall', label: 'Rainfall', unit: 'mm', color: chartColors[0] },
  { key: 'moisture', label: 'Moisture', unit: '%', color: chartColors[1] },
  { key: 'vibration', label: 'Vibration', unit: 'Hz', color: chartColors[2] },
  { key: 'power', label: 'Power', unit: '%', color: chartColors[3] },
];

function buildPath(points, width, height) {
  const gap = width / Math.max(points.length - 1, 1);
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${index * gap} ${height - (point / 100) * height}`)
    .join(' ');
}

function Chart({ label, unit, color, series }) {
  const width = 360;
  const height = 150;
  const path = buildPath(series, width, height);

  return (
    <article className="chart-card">
      <div className="chart-card__header">
        <div>
          <span className="section-label">Trend</span>
          <h3>{label}</h3>
        </div>
        <span className="chart-card__unit">{unit}</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-card__svg" role="img" aria-label={`${label} trend chart`}>
        <line x1="0" y1={height - 1} x2={width} y2={height - 1} stroke="rgba(18, 48, 79, 0.12)" />
        <path d={path} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {series.map((point, index) => {
          const gap = width / Math.max(series.length - 1, 1);
          return <circle key={`${label}-${index}`} cx={index * gap} cy={height - (point / 100) * height} r="4" fill={color} />;
        })}
      </svg>
    </article>
  );
}

export default function AnalyticsCharts({ probe }) {
  if (!probe) {
    return (
      <section className="panel-card panel-card--analytics panel-card--empty">
        <div className="panel-card__title-row">
          <div>
            <span className="section-label">Analytics</span>
            <h2 className="panel-card__title">No probe selected</h2>
          </div>
        </div>
        <p className="empty-state">Select a probe to review long-term rainfall, moisture, vibration, and power trends.</p>
      </section>
    );
  }

  return (
    <section className="panel-card panel-card--analytics">
      <div className="panel-card__title-row">
        <div>
          <span className="section-label">Long-term analytics</span>
          <h2 className="panel-card__title">Trend history for {probe.id}</h2>
        </div>
      </div>

      <div className="charts-grid">
        {METRICS.map((metric) => (
          <Chart
            key={metric.key}
            label={metric.label}
            unit={metric.unit}
            color={metric.color}
            series={probe.history.map((point) => point[metric.key])}
          />
        ))}
      </div>
    </section>
  );
}