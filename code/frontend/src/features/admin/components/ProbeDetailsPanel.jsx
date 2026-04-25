import { getRiskColor, getRiskLabel } from '../../../shared/utils/riskUtils';

export default function ProbeDetailsPanel({ probe }) {
  const m1 = Number(probe?.metrics?.moistureSensors?.m1 ?? probe?.metrics?.m1 ?? probe?.metrics?.moisture ?? 0);
  const m2 = Number(probe?.metrics?.moistureSensors?.m2 ?? probe?.metrics?.m2 ?? probe?.metrics?.moisture ?? 0);
  const m3 = Number(probe?.metrics?.moistureSensors?.m3 ?? probe?.metrics?.m3 ?? probe?.metrics?.moisture ?? 0);
  const avgMoisture = Number(probe?.metrics?.moistureSensors?.avg ?? probe?.metrics?.avg_moisture ?? ((m1 + m2 + m3) / 3));
  const isTiltRisky = Number(probe?.metrics?.tilt ?? 0) === 1;

  if (!probe) {
    return (
      <section className="panel-card panel-card--empty" id="probe-details-panel">
        <div className="panel-card__title-row">
          <div>
            <span className="section-label">Probe details</span>
            <h2 className="panel-card__title">No probe selected</h2>
          </div>
        </div>
        <p className="empty-state">Use search, the map, or the alert list to focus a probe and load live monitoring data.</p>
      </section>
    );
  }

  return (
    <section className="panel-card" id="probe-details-panel">
      <div className="panel-card__title-row">
        <div>
          <span className="section-label">Probe details</span>
          <h2 className="panel-card__title">{probe.id}</h2>
        </div>
        <span className="risk-pill" style={{ backgroundColor: `${getRiskColor(probe.riskLevel)}18`, color: getRiskColor(probe.riskLevel) }}>
          {getRiskLabel(probe.riskLevel)}
        </span>
      </div>

      <div className="details-grid">
        <div className="detail-item">
          <span className="detail-item__label">Latitude</span>
          <span className="detail-item__value">{probe.latitude.toFixed(4)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-item__label">Longitude</span>
          <span className="detail-item__value">{probe.longitude.toFixed(4)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-item__label">Current risk</span>
          <span className="detail-item__value">{getRiskLabel(probe.riskLevel)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-item__label">Moisture sensors (M1/M2/M3)</span>
          <span className="detail-item__value">{m1.toFixed(1)}% / {m2.toFixed(1)}% / {m3.toFixed(1)}%</span>
        </div>
        <div className="detail-item">
          <span className="detail-item__label">Avg moisture</span>
          <span className="detail-item__value">{avgMoisture.toFixed(1)}%</span>
        </div>
        <div className="detail-item">
          <span className="detail-item__label">Tilt</span>
          <span className={`detail-item__value ${isTiltRisky ? 'tilt-risky' : 'tilt-safe'}`}>
            {isTiltRisky ? 'Risky (Tilt = 1)' : 'Stable (Tilt = 0)'}
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-item__label">Last updated</span>
          <span className="detail-item__value">{probe.lastUpdated}</span>
        </div>
      </div>

    </section>
  );
}