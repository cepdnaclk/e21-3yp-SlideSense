import Card from '../common/Card';

export default function Sidebar({ activeTabLabel, activeTabDescription, probesCount, highRiskCount, selectedProbeId }) {
  return (
    <aside className="admin-sidebar">
      <Card className="admin-sidebar__card">
        <span className="section-label">Navigation</span>
        <h2 className="admin-sidebar__title">{activeTabLabel}</h2>
        <p className="admin-sidebar__description">{activeTabDescription}</p>
      </Card>

      <Card className="admin-sidebar__card admin-sidebar__card--summary">
        <span className="section-label">Live summary</span>
        <dl className="admin-summary-list">
          <div>
            <dt>Probes</dt>
            <dd>{probesCount}</dd>
          </div>
          <div>
            <dt>High risk</dt>
            <dd>{highRiskCount}</dd>
          </div>
          <div>
            <dt>Selected</dt>
            <dd>{selectedProbeId ?? 'None'}</dd>
          </div>
        </dl>
      </Card>
    </aside>
  );
}