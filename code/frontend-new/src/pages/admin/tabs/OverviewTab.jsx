import Card from '../../../components/common/Card';
import DashboardStatCard from '../../../components/admin/DashboardStatCard';
import ProbeMapView from '../../../components/admin/ProbeMapView';

export default function OverviewTab({
  stats,
  selectedProbeId,
  systemHealthLabel,
  activeNodeCount,
  loadError,
  highRiskProbes,
  activeAlerts,
  offlineCount,
  probes,
  selectProbe,
  searchValue,
  handleSearchChange,
  handleSearchSubmit,
  focusTrigger,
  selectedProbe
}) {
  return (
    <section className="dashboard-stack">
      <div className="card-grid card-grid--three admin-overview-summary">
        <Card className="admin-sidebar__card admin-sidebar__card--summary">
          <span className="section-label">Live summary</span>
          <dl className="admin-summary-list">
            <div>
              <dt>Probes</dt>
              <dd>{stats.total}</dd>
            </div>
            <div>
              <dt>High risk</dt>
              <dd>{stats.high}</dd>
            </div>
          </dl>
        </Card>

        <Card className="system-health-card">
          <span className="section-label">System status indicators</span>
          <h2>Overall system health: {systemHealthLabel}</h2>
          <div className="status-pill-row">
            <span className={`status-pill status-pill--${activeNodeCount > 0 ? 'good' : 'warn'}`}>Connectivity {activeNodeCount > 0 ? 'Online' : 'Offline'}</span>
            <span className="status-pill status-pill--good">API {loadError ? 'Degraded' : 'Healthy'}</span>
            <span className="status-pill status-pill--good">Backend {loadError ? 'Attention required' : 'Healthy'}</span>
          </div>
          <p>High risk nodes: {highRiskProbes.length}. Alerts requiring immediate review: {activeAlerts.length}.</p>
        </Card>

        <Card className="overview-alert-card">
          <span className="section-label">Quick alerts overview</span>
          <h2>Latest critical alerts</h2>
          <div className="overview-alert-list">
            {activeAlerts.length === 0 ? (
              <p className="empty-state">No active critical alerts at the moment.</p>
            ) : activeAlerts.slice(0, 3).map((alert) => (
              <article key={alert.id} className="overview-alert-row">
                <strong>{alert.node}</strong>
                <span>{alert.description}</span>
                <small>{alert.time}</small>
              </article>
            ))}
          </div>
        </Card>
      </div>

      <section className="card-grid card-grid--three">
        <DashboardStatCard label="Offline nodes" value={offlineCount} tone="high" note="Needs verification" />
        <DashboardStatCard label="Total nodes" value={stats.total} tone="total" note="Monitored probes" />
        <DashboardStatCard label="Active nodes" value={activeNodeCount} tone="medium" note="Connected now" />
      </section>

      <ProbeMapView
        probes={probes}
        selectedProbeId={selectedProbeId}
        onSelectProbe={selectProbe}
        searchValue={searchValue}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        focusTrigger={focusTrigger}
        hideSearch={true}
      />
    </section>
  );
}
