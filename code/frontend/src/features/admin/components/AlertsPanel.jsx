import { getRiskColor, getRiskLabel } from '../../../shared/utils/riskUtils';

export default function AlertsPanel({ alerts, onSelectProbe }) {
  return (
    <section className="panel-card panel-card--alerts">
      <div className="panel-card__title-row">
        <div>
          <span className="section-label">Alerts</span>
          <h2 className="panel-card__title">High-risk probes</h2>
        </div>
        <span className="alert-badge">{alerts.length}</span>
      </div>

      <div className="alerts-list">
        {alerts.length === 0 ? (
          <p className="empty-state">No active high-risk probes.</p>
        ) : (
          alerts.map((probe) => (
            <button key={probe.id} type="button" className="alert-row" onClick={() => onSelectProbe(probe.id)}>
              <span className="alert-row__marker" style={{ backgroundColor: getRiskColor('high') }} />
              <span className="alert-row__body">
                <strong>{probe.id}</strong>
                <span>{getRiskLabel(probe.riskLevel)} risk</span>
              </span>
            </button>
          ))
        )}
      </div>
    </section>
  );
}