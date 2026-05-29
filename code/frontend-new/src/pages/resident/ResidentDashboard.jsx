import { useMemo, useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Tabs from '../../components/common/Tabs';
import RoleLayout from '../../layouts/RoleLayout';
import { useProbeNetwork } from '../../shared/hooks/useProbeNetwork';
import { getRiskLabel, normalizeRiskLevel } from '../../shared/utils/riskUtils';

import { getResidentDashboardData } from '../../services/api/dashboardService';

const DEFAULT_TABS = [];

function getSnapshot(probes, highRiskProbes) {
  const riskScore = highRiskProbes.length > 0 ? 'high' : probes.some((probe) => normalizeRiskLevel(probe.riskLevel) === 'medium') ? 'medium' : 'low';
  const latestTimestamp = probes.reduce((latest, probe) => (probe.lastUpdated > latest ? probe.lastUpdated : latest), '');
  const rainfall = Math.round(probes.reduce((sum, probe) => sum + Number(probe.metrics?.rainfall ?? 0), 0) / Math.max(probes.length, 1));
  const moisture = Math.round(probes.reduce((sum, probe) => sum + Number(probe.metrics?.moisture ?? 0), 0) / Math.max(probes.length, 1));
  const vibration = Math.round(Math.max(...probes.map((probe) => Number(probe.metrics?.vibration ?? 0)), 0));

  return {
    riskScore,
    latestTimestamp: latestTimestamp || 'Waiting for updates',
    rainfall,
    moisture,
    vibration,
    explanation: riskScore === 'high'
      ? 'Environmental conditions indicate elevated landslide risk. Stay alert and prepare to move to safer ground.'
      : riskScore === 'medium'
        ? 'Rainfall or soil moisture is increasing. Monitor conditions closely and avoid steep slopes.'
        : 'Conditions are currently stable, with no immediate warning signs detected.',
  };
}

function AlertIcon({ kind }) {
  return <span className={`weather-icon weather-icon--${kind}`} aria-hidden="true" />;
}

export default function ResidentDashboard({ onLogout }) {
  const { probes, highRiskProbes, isLoadingLiveData, loadError } = useProbeNetwork();
  const [tabs, setTabs] = useState(DEFAULT_TABS);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const cfg = await getResidentDashboardData();
        if (!active) return;
        setTabs(cfg.tabs ?? DEFAULT_TABS);
        setActiveTab(cfg.tabs?.[0]?.id ?? 'overview');
      } catch (e) {
        // keep defaults
      }
    })();
    return () => { active = false; };
  }, []);

  const snapshot = useMemo(() => getSnapshot(probes, highRiskProbes), [probes, highRiskProbes]);
  const activeAlerts = useMemo(
    () => highRiskProbes.slice(0, 4).map((probe, index) => ({
      id: probe.id,
      severity: index === 0 ? 'Critical' : 'Warning',
      time: probe.lastUpdated,
      location: `Monitoring sector ${probe.id}`,
    })),
    [highRiskProbes],
  );

  const statusTone = snapshot.riskScore === 'high' ? 'Critical' : snapshot.riskScore === 'medium' ? 'Warning' : 'Safe';

  return (
    <RoleLayout
      eyebrow="Resident view"
      title="Community Safety Dashboard"
      status={isLoadingLiveData ? 'Loading live conditions...' : loadError || `Current risk: ${statusTone}`}
      actions={<Button variant="ghost" onClick={onLogout}>Switch role</Button>}
    >
      <main className="role-dashboard role-dashboard--resident">
        <Tabs tabs={tabs} activeTabId={activeTab} onChange={setActiveTab} ariaLabel="Resident dashboard tabs" />

        {activeTab === 'overview' ? (
          <section className="dashboard-stack">
            <Card className={`priority-card priority-card--${snapshot.riskScore}`}>
              <span className="section-label">Current situation overview</span>
              <div className="priority-card__row">
                <div>
                  <h2>Risk level: {getRiskLabel(snapshot.riskScore)}</h2>
                  <p>{snapshot.explanation}</p>
                </div>
                <div className="priority-card__status">Last updated {snapshot.latestTimestamp}</div>
              </div>
            </Card>

            <div className="card-grid card-grid--three">
              <Card className="info-card">
                <span className="section-label">Rainfall status</span>
                <div className="info-card__headline">
                  <AlertIcon kind={snapshot.rainfall > 65 ? 'heavy' : snapshot.rainfall > 25 ? 'light' : 'clear'} />
                  <strong>{snapshot.rainfall} mm</strong>
                </div>
                <div className="status-bar"><span style={{ width: `${Math.min(snapshot.rainfall, 100)}%` }} /></div>
                <p>{snapshot.rainfall > 65 ? 'Heavy rain' : snapshot.rainfall > 25 ? 'Light rain' : 'Sunny or dry conditions'}</p>
              </Card>

              <Card className="info-card">
                <span className="section-label">Soil moisture</span>
                <div className="info-card__headline"><strong>{snapshot.moisture}%</strong></div>
                <div className="status-bar"><span style={{ width: `${Math.min(snapshot.moisture, 100)}%` }} /></div>
                <p>{snapshot.moisture > 70 ? 'High moisture - watch for slope saturation.' : snapshot.moisture > 45 ? 'Moderate moisture - stay aware.' : 'Low moisture - stable for now.'}</p>
              </Card>

              <Card className="info-card">
                <span className="section-label">System alert status</span>
                <div className="info-card__headline"><strong>{highRiskProbes.length > 0 ? 'Active' : 'None'}</strong></div>
                <p>{highRiskProbes.length > 0 ? `${highRiskProbes.length} alert(s) currently need attention.` : 'No active general system alerts.'}</p>
                <div className="trend-indicator">
                  <span className={`trend-indicator__arrow trend-indicator__arrow--${snapshot.vibration > 60 ? 'up' : 'stable'}`}>{snapshot.vibration > 60 ? '↑' : '→'}</span>
                  <span>{snapshot.vibration > 60 ? 'Rising activity' : 'Stable activity'}</span>
                </div>
              </Card>
            </div>

            <Card className="alerts-card">
              <div className="panel-card__title-row">
                <div>
                  <span className="section-label">Alerts</span>
                  <h2 className="panel-card__title">Active alerts</h2>
                </div>
              </div>
              <div className="resident-alert-list">
                {activeAlerts.length === 0 ? (
                  <p className="empty-state">No active alerts at the moment.</p>
                ) : activeAlerts.map((alert) => (
                  <article key={alert.id} className="resident-alert-row">
                    <div>
                      <strong>{alert.id}</strong>
                      <p>{alert.location}</p>
                    </div>
                    <div>
                      <span>{alert.severity}</span>
                      <small>{alert.time}</small>
                    </div>
                  </article>
                ))}
              </div>
            </Card>
          </section>
        ) : (
          <section className="dashboard-stack dashboard-stack--safety">
            <div className="card-grid card-grid--two">
              <Card className="guidance-card">
                <span className="section-label">Emergency instructions</span>
                <h2>Actions by risk level</h2>
                <ul>
                  <li><strong>Moderate:</strong> Keep devices charged, monitor alerts, and avoid steep or loose slopes.</li>
                  <li><strong>High:</strong> Move to safer ground, keep family together, and prepare a go-bag.</li>
                  <li><strong>Critical:</strong> Evacuate immediately and follow official instructions without delay.</li>
                </ul>
              </Card>

              <Card className="guidance-card">
                <span className="section-label">Emergency contacts</span>
                <h2>Who to call</h2>
                <p>Disaster Management Center: 117</p>
                <p>Local emergency authority: contact your district office or local response unit.</p>
                <a className="button button--primary guidance-card__call" href="tel:117">Call emergency hotline</a>
              </Card>
            </div>

            <div className="card-grid card-grid--two">
              <Card className="guidance-card">
                <span className="section-label">Evacuation guide</span>
                <h2>How to evacuate safely</h2>
                <ol>
                  <li>Leave early if warnings increase.</li>
                  <li>Move away from slopes, drains, and streams.</li>
                  <li>Use official routes and meet at a safe location.</li>
                </ol>
                <p><strong>Do:</strong> carry medicines, documents, and water.</p>
                <p><strong>Do not:</strong> cross fresh landslide debris or wait near retaining walls.</p>
              </Card>

              <Card className="guidance-card">
                <span className="section-label">Safety tips</span>
                <h2>Watch for warning signs</h2>
                <ul>
                  <li>Cracks in the ground or walls.</li>
                  <li>Unusual rumbling sounds.</li>
                  <li>Tilting trees or poles.</li>
                  <li>Sudden muddy water or blocked drains.</li>
                </ul>
                <p>Avoid slopes during heavy rain, stay off unstable ground, and contact authorities if conditions worsen quickly.</p>
              </Card>
            </div>
          </section>
        )}
      </main>
    </RoleLayout>
  );
}