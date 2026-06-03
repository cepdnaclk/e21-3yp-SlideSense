import { useMemo, useState, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Tabs from '../../components/common/Tabs';
import RoleLayout from '../../layouts/RoleLayout';
import ProbeMapView from '../../components/admin/ProbeMapView';
import CurrentStatusPanel from '../../components/admin/CurrentStatusPanel';
import AnalyticsCharts from '../../components/admin/AnalyticsCharts';
import { useProbeNetwork } from '../../shared/hooks/useProbeNetwork';

import { getResearcherDashboardData } from '../../services/api/dashboardService';

const DEFAULT_TABS = [];
const DEFAULT_TIME_RANGES = [];

function downloadTextFile(filename, content, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function ResearcherDashboard({ onLogout }) {
  const {
    probes,
    selectedProbe,
    selectedProbeId,
    searchValue,
    isLoadingLiveData,
    loadError,
    selectProbe,
    handleSearchChange,
    handleSearchSubmit,
  } = useProbeNetwork();
  const [tabs, setTabs] = useState(DEFAULT_TABS);
  const [timeRanges, setTimeRanges] = useState(DEFAULT_TIME_RANGES);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const cfg = await getResearcherDashboardData();
        if (!active) return;
        setTabs(cfg.tabs ?? DEFAULT_TABS);
        setTimeRanges(cfg.timeRanges ?? DEFAULT_TIME_RANGES);
      } catch (e) {
        // keep defaults
      }
    })();
    return () => { active = false; };
  }, []);
  const [activeTab, setActiveTab] = useState(tabs[0]?.id ?? 'live');
  const [range, setRange] = useState(timeRanges[1]?.id ?? timeRanges[0]?.id ?? '24h');

  const comparisonRows = useMemo(() => probes.slice(0, 3).map((probe) => ({
    id: probe.id,
    rainfall: Number(probe.metrics?.rainfall ?? 0),
    moisture: Number(probe.metrics?.moisture ?? 0),
    vibration: Number(probe.metrics?.vibration ?? 0),
    lastUpdated: probe.lastUpdated,
  })), [probes]);

  function handleDownloadCsv() {
    if (!selectedProbe) {
      return;
    }

    const rows = [
      ['timestamp', 'nodeId', 'rainfall', 'moisture', 'vibration', 'power'],
      ...(selectedProbe.history ?? []).map((row) => [row.label, selectedProbe.id, row.rainfall, row.moisture, row.vibration, row.power]),
    ];

    downloadTextFile(`${selectedProbe.id}-history.csv`, rows.map((row) => row.join(',')).join('\n'), 'text/csv');
  }

  function handleDownloadReport() {
    if (!selectedProbe) {
      return;
    }

    const report = [
      `Probe report for ${selectedProbe.id}`,
      `Last updated: ${selectedProbe.lastUpdated}`,
      `Rainfall: ${selectedProbe.metrics?.rainfall ?? 0}`,
      `Soil moisture: ${selectedProbe.metrics?.moisture ?? 0}`,
      `Vibration: ${selectedProbe.metrics?.vibration ?? 0}`,
      `Range: ${range}`,
    ].join('\n');

    downloadTextFile(`${selectedProbe.id}-report.txt`, report);
  }

  return (
    <RoleLayout
      eyebrow="Researcher view"
      title="Environmental Data Workspace"
      status={isLoadingLiveData ? 'Syncing live monitoring data...' : loadError || `Selected node: ${selectedProbeId ?? 'None'}`}
      actions={<Button variant="ghost" onClick={onLogout}>Switch role</Button>}
    >
      <main className="role-dashboard role-dashboard--researcher">
        <Tabs tabs={tabs} activeTabId={activeTab} onChange={setActiveTab} ariaLabel="Researcher dashboard tabs" />

        {activeTab === 'live' ? (
          <section className="dashboard-stack">
            <Card className="research-card">
              <span className="section-label">Location selector</span>
              <ProbeMapView
                probes={probes}
                selectedProbeId={selectedProbeId}
                onSelectProbe={selectProbe}
                searchValue={searchValue}
                onSearchChange={handleSearchChange}
                onSearchSubmit={handleSearchSubmit}
              />
            </Card>

            <div className="card-grid card-grid--two">
              <CurrentStatusPanel probe={selectedProbe} />

              <Card className="research-feed-card">
                <span className="section-label">Live status stream</span>
                <h2>Recent updates for {selectedProbe?.id ?? 'the selected node'}</h2>
                <div className="status-stream">
                  {(selectedProbe?.history ?? []).slice(-5).reverse().map((entry) => (
                    <div key={`${entry.label}-${entry.rainfall}-${entry.moisture}`} className="status-stream__row">
                      <strong>{entry.label}</strong>
                      <span>{entry.rainfall} mm rainfall · {entry.moisture}% moisture · {entry.vibration} vibration</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </section>
        ) : null}

        {activeTab === 'analytics' ? (
          <section className="dashboard-stack">
            <Card className="research-controls-card">
              <span className="section-label">Time range selector</span>
              <div className="range-picker">
                {timeRanges.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`range-picker__button ${range === item.id ? 'is-active' : ''}`}
                    onClick={() => setRange(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </Card>

            <AnalyticsCharts probe={selectedProbe} />

            <Card className="research-comparison-card">
              <span className="section-label">Multi-sensor comparison</span>
              <h2>Selected node versus nearby nodes</h2>
              <Table>
                <thead>
                  <tr>
                    <th>Node</th>
                    <th>Rainfall</th>
                    <th>Moisture</th>
                    <th>Vibration</th>
                    <th>Last update</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.rainfall}</td>
                      <td>{row.moisture}</td>
                      <td>{row.vibration}</td>
                      <td>{row.lastUpdated}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          </section>
        ) : null}

        {activeTab === 'export' ? (
          <section className="dashboard-stack">
            <div className="card-grid card-grid--three">
              <Card className="research-export-card">
                <span className="section-label">Historical data table</span>
                <Table>
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Rainfall</th>
                      <th>Moisture</th>
                      <th>Vibration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedProbe?.history ?? []).slice(-6).map((entry) => (
                      <tr key={`${entry.label}-${entry.rainfall}`}>
                        <td>{entry.label}</td>
                        <td>{entry.rainfall}</td>
                        <td>{entry.moisture}</td>
                        <td>{entry.vibration}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card>

              <Card className="research-export-card">
                <span className="section-label">Data filters</span>
                <p>Selected node: {selectedProbe?.id ?? 'none'}</p>
                <p>Time range: {range}</p>
                <p>Sensor type: rainfall / soil moisture / vibration</p>
              </Card>

              <Card className="research-export-card">
                <span className="section-label">Export options</span>
                <Button onClick={handleDownloadCsv}>Download CSV</Button>
                <Button variant="outline" onClick={handleDownloadReport}>Download report</Button>
                <p>Sampling rate and reliability indicators can be reviewed from the live node data stream.</p>
              </Card>
            </div>
          </section>
        ) : null}
      </main>
    </RoleLayout>
  );
}