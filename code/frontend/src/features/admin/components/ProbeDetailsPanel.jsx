import { getRiskColor, getRiskLabel } from '../../../shared/utils/riskUtils';

export default function ProbeDetailsPanel({ probe }) {
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
          <span className="detail-item__label">Last updated</span>
          <span className="detail-item__value">{probe.lastUpdated}</span>
        </div>
      </div>

    </section>
  );
}