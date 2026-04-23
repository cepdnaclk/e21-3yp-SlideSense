import RealTimeMetrics from './RealTimeMetrics';

export default function CurrentStatusPanel({ probe }) {
  if (!probe) {
    return (
      <section className="panel-card panel-card--metrics panel-card--empty">
        <div className="panel-card__title-row">
          <div>
            <span className="section-label">Current status</span>
            <h2 className="panel-card__title">No probe selected</h2>
          </div>
        </div>
        <p className="empty-state">Select a probe to view real-time rainfall, moisture, vibration, and power readings.</p>
      </section>
    );
  }

  return (
    <section className="panel-card panel-card--metrics">
      <div className="panel-card__title-row">
        <div>
          <span className="section-label">Current status</span>
          <h2 className="panel-card__title">Real-time readings for {probe.id}</h2>
        </div>
      </div>
      <div className="panel-card__subsection">
        <RealTimeMetrics metrics={probe.metrics} />
      </div>
    </section>
  );
}
