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

  function handleEditCoordinate(field) {
    const label = field === 'latitude' ? 'Latitude' : 'Longitude';
    const nextValue = window.prompt(`Enter new ${label} value`, String(probe[field]));

    if (nextValue === null) {
      return;
    }

    const parsedValue = Number(nextValue.trim());
    if (!Number.isFinite(parsedValue)) {
      window.alert(`Please enter a valid number for ${label}.`);
      return;
    }

    onEditCoordinate(probe.id, field, parsedValue);
  }

  function handleRemove() {
    const confirmed = window.confirm(`Remove ${probe.id} from monitoring?`);
    if (confirmed) {
      onRemoveProbe(probe.id);
    }
  }

  return (
    <section className="panel-card" id="probe-details-panel">
      <div className="panel-card__title-row">
        <div>
          <span className="section-label">Probe details</span>
          <h2 className="panel-card__title">{probe.id}</h2>
        </div>
      </div>

      <div className="details-grid">
        <div className="detail-item">
          <span className="detail-item__label">Latitude</span>
          <div className="detail-item__value-row">
            <span className="detail-item__value">{probe.latitude.toFixed(4)}</span>
            <button type="button" className="detail-action-button" onClick={() => handleEditCoordinate('latitude')}>
              Edit
            </button>
          </div>
        </div>
        <div className="detail-item">
          <span className="detail-item__label">Longitude</span>
          <div className="detail-item__value-row">
            <span className="detail-item__value">{probe.longitude.toFixed(4)}</span>
            <button type="button" className="detail-action-button" onClick={() => handleEditCoordinate('longitude')}>
              Edit
            </button>
          </div>
        </div>
        <div className="detail-item">
          <span className="detail-item__label">Last updated</span>
          <span className="detail-item__value">{probe.lastUpdated}</span>
        </div>
      </div>

      <button type="button" className="remove-probe-button" onClick={handleRemove}>
        Remove probe
      </button>

    </section>
  );
}