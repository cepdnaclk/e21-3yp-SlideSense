import { useMemo, useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Tabs from '../../components/common/Tabs';
import AdminLayout from '../../layouts/AdminLayout';
import DashboardStatCard from '../../components/admin/DashboardStatCard';
import ProbeMapView from '../../components/admin/ProbeMapView';
import ProbeDetailsPanel from '../../components/admin/ProbeDetailsPanel';
import HighRiskAlertsPanel from '../../components/admin/HighRiskAlertsPanel';
import AlertHistoryPanel from '../../components/admin/AlertHistoryPanel';
import AnalyticsCharts from '../../components/admin/AnalyticsCharts';
import CurrentStatusPanel from '../../components/admin/CurrentStatusPanel';
import NodeRegistrationForm from '../../components/admin/NodeRegistrationForm';
import OperationalMetricsCards from '../../components/admin/OperationalMetricsCards';
import { useProbeNetwork } from '../../shared/hooks/useProbeNetwork';
import { getRiskCounts, normalizeRiskLevel, sortByRiskSeverity } from '../../shared/utils/riskUtils';
import { getAdminDashboardData } from '../../services/api/dashboardService';

// pulled from service layer so UI doesn't hold static data
const initialTabs = [];
const initialUsers = [];
const initialSecurityLogs = [];
const initialThresholds = { rainfall: 60, moisture: 70, vibration: 55 };

function parseTimestamp(value) {
  const candidate = new Date(String(value ?? '').replace(' ', 'T'));
  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

function isProbeOffline(probe) {
  const lastUpdated = parseTimestamp(probe?.lastUpdated);
  if (!lastUpdated) {
    return false;
  }

  const ageMs = Date.now() - lastUpdated.getTime();
  return ageMs > 45 * 60 * 1000 || Number(probe?.metrics?.signalStrength ?? 100) < 25;
}

function getAlertRows(probes) {
  const movementAlerts = probes.filter((probe) => probe?.metrics?.tiltDetected).map((probe) => ({
    id: `${probe.id}-movement`,
    severity: 'Critical',
    time: probe.lastUpdated,
    node: probe.id,
    description: 'Tilt sensor movement detected',
  }));

  const riskAlerts = sortByRiskSeverity(
    probes.filter((probe) => normalizeRiskLevel(probe.riskLevel) !== 'low'),
  ).map((probe) => ({
    id: `${probe.id}-risk`,
    severity: normalizeRiskLevel(probe.riskLevel) === 'high' ? 'Critical' : 'Warning',
    time: probe.lastUpdated,
    node: probe.id,
    description: `${probe.id} reporting ${normalizeRiskLevel(probe.riskLevel)} risk conditions`,
  }));

  return [...movementAlerts, ...riskAlerts].slice(0, 6);
}

function ConfigCard({ title, children }) {
  return (
    <Card className="config-card">
      <span className="section-label">{title}</span>
      {children}
    </Card>
  );
}

export default function AdminDashboard({ onLogout }) {
  const [tabs, setTabs] = useState(initialTabs);
  const [users, setUsers] = useState(initialUsers);
  const [securityLogs, setSecurityLogs] = useState(initialSecurityLogs);
  const [defaultThresholds, setDefaultThresholds] = useState(initialThresholds);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await getAdminDashboardData();
        if (!active) return;
        setTabs(data.tabs ?? []);
        setUsers(data.users ?? []);
        setSecurityLogs(data.securityLogs ?? []);
        setDefaultThresholds(data.defaultThresholds ?? initialThresholds);
        setThresholds(data.defaultThresholds ?? initialThresholds);
      } catch (err) {
        // keep defaults on error
      }
    }

    load();
    return () => { active = false; };
  }, []);
  const {
    probes,
    selectedProbe,
    selectedProbeId,
    searchValue,
    isLoadingLiveData,
    loadError,
    stats,
    highRiskProbes,
    selectProbe,
    handleSearchChange,
    handleSearchSubmit,
    addProbe,
    updateProbeCoordinate,
    removeProbe,
  } = useProbeNetwork();
  const [activeTabId, setActiveTabId] = useState('overview');
  const [thresholds, setThresholds] = useState(initialThresholds);
  const [statusMessage, setStatusMessage] = useState('');
  const [acknowledgedAlertIds, setAcknowledgedAlertIds] = useState([]);

  const activeAlerts = useMemo(() => getAlertRows(probes).filter((alert) => !acknowledgedAlertIds.includes(alert.id)), [probes, acknowledgedAlertIds]);
  const offlineCount = useMemo(() => probes.filter(isProbeOffline).length, [probes]);
  const activeNodeCount = Math.max(stats.total - offlineCount, 0);
  const systemHealthLabel = loadError ? 'Needs attention' : activeNodeCount === stats.total ? 'Healthy' : 'Degraded';

  function acknowledgeAlert(alertId) {
    setAcknowledgedAlertIds((current) => (current.includes(alertId) ? current : [...current, alertId]));
    setStatusMessage(`Alert ${alertId} acknowledged.`);
  }

  function clearResolvedAlerts() {
    setAcknowledgedAlertIds([]);
    setStatusMessage('Resolved alerts cleared from the active list.');
  }

  function saveThresholds() {
    setStatusMessage('Threshold settings saved locally for the current session.');
  }

  function handleThresholdChange(event) {
    const { name, value } = event.target;
    setThresholds((current) => ({ ...current, [name]: value }));
  }

  return (
    <AdminLayout
      title="Admin Dashboard"
      status={isLoadingLiveData ? 'Loading live sensor data from backend...' : loadError || 'Live backend connected.'}
      activeTabLabel={tabs.find((tab) => tab.id === activeTabId)?.label ?? 'System Overview'}
      activeTabDescription={tabs.find((tab) => tab.id === activeTabId)?.description ?? 'Admin control center'}
      probesCount={stats.total}
      highRiskCount={stats.high}
      selectedProbeId={selectedProbeId}
    >
      <main className="admin-dashboard">
        <div className="dashboard-header-actions">
          <Button variant="ghost" onClick={onLogout}>Switch role</Button>
        </div>

        <Tabs tabs={tabs} activeTabId={activeTabId} onChange={setActiveTabId} ariaLabel="Admin dashboard sections" />

        {statusMessage ? <p className="dashboard-banner">{statusMessage}</p> : null}

        {activeTabId === 'overview' ? (
          <section className="dashboard-stack">
            <div className="card-grid card-grid--two admin-overview-summary">
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

            <section className="stat-grid stat-grid--admin">
              <DashboardStatCard label="Total nodes" value={stats.total} tone="total" note="Monitored probes" />
              <DashboardStatCard label="Active nodes" value={activeNodeCount} tone="medium" note="Connected now" />
              <DashboardStatCard label="Offline nodes" value={offlineCount} tone="high" note="Needs verification" />
            </section>

            <OperationalMetricsCards
              moistureSensors={selectedProbe?.metrics?.moistureSensors}
              rainfall={selectedProbe?.metrics?.rainfall}
              tiltDetected={selectedProbe?.metrics?.tiltDetected ?? (selectedProbe?.metrics?.tilt === 1)}
              powerLevel={selectedProbe?.metrics?.power}
              mode={selectedProbe?.metrics?.mode}
              signalStrength={selectedProbe?.metrics?.signalStrength}
              vibration={selectedProbe?.metrics?.vibration}
            />
          </section>
        ) : null}

        {activeTabId === 'nodes' ? (
          <section className="dashboard-stack">
            <Card className="node-list-card">
              <div className="panel-card__title-row">
                <div>
                  <span className="section-label">Node list</span>
                  <h2 className="panel-card__title">Registered probes</h2>
                </div>
              </div>
              <Table>
                <thead>
                  <tr>
                    <th>Node ID</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Last update</th>
                  </tr>
                </thead>
                <tbody>
                  {probes.map((probe) => (
                    <tr key={probe.id}>
                      <td>{probe.id}</td>
                      <td>{probe.latitude.toFixed(4)}, {probe.longitude.toFixed(4)}</td>
                      <td>{isProbeOffline(probe) ? 'offline' : 'online'}</td>
                      <td>{probe.lastUpdated}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>

            <section className="dashboard-content">
              <ProbeMapView
                probes={probes}
                selectedProbeId={selectedProbeId}
                onSelectProbe={selectProbe}
                searchValue={searchValue}
                onSearchChange={handleSearchChange}
                onSearchSubmit={handleSearchSubmit}
              />

              <aside className="details-column">
                <CurrentStatusPanel probe={selectedProbe} />
                <Card className="historical-data-card">
                  <span className="section-label">Selected probe history</span>
                  <h2>{selectedProbe?.id ?? 'No probe selected'}</h2>
                  <Table>
                    <thead>
                      <tr>
                        <th>Label</th>
                        <th>Rainfall</th>
                        <th>Moisture</th>
                        <th>Vibration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedProbe?.history ?? []).slice(-6).map((row) => (
                        <tr key={`${row.label}-${row.rainfall}`}>
                          <td>{row.label}</td>
                          <td>{row.rainfall}</td>
                          <td>{row.moisture}</td>
                          <td>{row.vibration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card>
              </aside>
            </section>

            <section className="dashboard-content dashboard-content--stacked">
              <ProbeDetailsPanel
                probe={selectedProbe}
                onEditCoordinate={updateProbeCoordinate}
                onRemoveProbe={removeProbe}
              />
              <NodeRegistrationForm onAddProbe={addProbe} existingIds={probes.map((probe) => probe.id)} />
              <AnalyticsCharts probe={selectedProbe} />
            </section>
          </section>
        ) : null}

        {activeTabId === 'alerts' ? (
          <section className="dashboard-stack">
            <div className="card-grid card-grid--two">
              <HighRiskAlertsPanel alerts={highRiskProbes} onSelectProbe={selectProbe} />
              <AlertHistoryPanel alerts={highRiskProbes} />
            </div>

            <Card className="alerts-management-card">
              <div className="panel-card__title-row">
                <div>
                  <span className="section-label">Active alerts list</span>
                  <h2 className="panel-card__title">System-wide alerts</h2>
                </div>
                <Button variant="outline" onClick={clearResolvedAlerts}>Clear resolved</Button>
              </div>

              <Table>
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Time</th>
                    <th>Node</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAlerts.length === 0 ? (
                    <tr>
                      <td colSpan="5">No active alerts.</td>
                    </tr>
                  ) : activeAlerts.map((alert) => (
                    <tr key={alert.id}>
                      <td>{alert.severity}</td>
                      <td>{alert.time}</td>
                      <td>{alert.node}</td>
                      <td>{alert.description}</td>
                      <td>
                        <Button variant="ghost" onClick={() => acknowledgeAlert(alert.id)}>Acknowledge</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          </section>
        ) : null}

        {activeTabId === 'configuration' ? (
          <section className="dashboard-stack">
            <div className="card-grid card-grid--two">
              <ConfigCard title="Threshold settings">
                <div className="config-form-grid">
                  <label>
                    Rainfall threshold
                    <input name="rainfall" type="number" value={thresholds.rainfall} onChange={handleThresholdChange} />
                  </label>
                  <label>
                    Soil moisture threshold
                    <input name="moisture" type="number" value={thresholds.moisture} onChange={handleThresholdChange} />
                  </label>
                  <label>
                    Vibration threshold
                    <input name="vibration" type="number" value={thresholds.vibration} onChange={handleThresholdChange} />
                  </label>
                </div>
                <Button onClick={saveThresholds}>Save thresholds</Button>
              </ConfigCard>

              <ConfigCard title="Risk rules editor">
                <p>Define risk levels and update detection logic parameters.</p>
                <div className="config-form-grid">
                  <label>
                    Low risk label
                    <input defaultValue="Stable" />
                  </label>
                  <label>
                    Warning label
                    <input defaultValue="Watch closely" />
                  </label>
                  <label>
                    Critical label
                    <input defaultValue="Evacuate" />
                  </label>
                </div>
              </ConfigCard>
            </div>

            <div className="card-grid card-grid--two">
              <ConfigCard title="User management">
                <Table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.email}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>{user.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                <div className="config-action-row">
                  <Button>Add user</Button>
                  <Button variant="outline">Assign roles</Button>
                  <Button variant="ghost">Disable user</Button>
                </div>
              </ConfigCard>

              <ConfigCard title="Security logs">
                <Table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Event</th>
                      <th>Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityLogs.map((entry) => (
                      <tr key={`${entry.time}-${entry.event}`}>
                        <td>{entry.time}</td>
                        <td>{entry.event}</td>
                        <td>{entry.detail}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </ConfigCard>
            </div>
          </section>
        ) : null}
      </main>
    </AdminLayout>
  );
}