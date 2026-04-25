import { useEffect, useMemo, useState } from 'react';
import StatCard from './components/StatCard';
import MapView from './components/MapView';
import ProbeDetailsPanel from './components/ProbeDetailsPanel';
import AddProbeForm from './components/AddProbeForm';
import AnalyticsCharts from './components/AnalyticsCharts';
import BelowMapStatusCards from './components/BelowMapStatusCards';
import { dummyProbes, createProbeRecord } from './data/dummyProbes';
import { getRiskCounts, normalizeRiskLevel, sortByRiskSeverity } from '../../shared/utils/riskUtils';

export default function AdminDashboard() {
  const [probes, setProbes] = useState(dummyProbes);
  const [selectedProbeId, setSelectedProbeId] = useState(dummyProbes[0]?.id ?? null);
  const [searchValue, setSearchValue] = useState(dummyProbes[0]?.id ?? '');

  const selectedProbe = useMemo(
    () => probes.find((probe) => probe.id === selectedProbeId) ?? null,
    [probes, selectedProbeId],
  );

  const stats = useMemo(() => getRiskCounts(probes), [probes]);
  const highRiskProbes = useMemo(() => sortByRiskSeverity(probes.filter((probe) => normalizeRiskLevel(probe.riskLevel) === 'high')), [probes]);

  useEffect(() => {
    if (selectedProbe?.id) {
      setSearchValue(selectedProbe.id);
    }
  }, [selectedProbe]);

  function handleSelectProbe(probeId) {
    setSelectedProbeId(probeId);
    setSearchValue(probeId);

    const detailsPanel = document.getElementById('probe-details-panel');
    if (detailsPanel) {
      detailsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function handleSearchChange(event) {
    setSearchValue(event.target.value.toUpperCase());
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    const match = probes.find((probe) => probe.id.toLowerCase() === searchValue.trim().toLowerCase());

    if (match) {
      handleSelectProbe(match.id);
    }
  }

  function handleAddProbe({ id, latitude, longitude }) {
    const nextProbe = createProbeRecord({ id, latitude, longitude });
    setProbes((current) => [...current, nextProbe]);
    handleSelectProbe(nextProbe.id);
  }

  function handleUpdateProbeCoordinate(probeId, field, value) {
    const nextValue = Number(value);
    if (!Number.isFinite(nextValue)) {
      return;
    }

    setProbes((current) =>
      current.map((probe) => (probe.id === probeId ? { ...probe, [field]: nextValue } : probe)),
    );
  }

  function handleRemoveProbe(probeId) {
    setProbes((current) => {
      const nextProbes = current.filter((probe) => probe.id !== probeId);

      if (nextProbes.length === 0) {
        setSelectedProbeId(null);
        setSearchValue('');
        return nextProbes;
      }

      if (selectedProbeId === probeId) {
        const nextSelectedId = nextProbes[0].id;
        setSelectedProbeId(nextSelectedId);
        setSearchValue(nextSelectedId);
      }

      return nextProbes;
    });
  }

  return (
    <main className="admin-dashboard">
      <header className="dashboard-header">
        <div>
          <span className="section-label">Slide Sense</span>
          <h1>Admin Dashboard</h1>
        </div>
      </header>

      <section className="stat-grid">
        <StatCard label="Total probes" value={stats.total} tone="total" note="Monitored nodes" />
        <article className="stat-card stat-card--risk">
          <span className="stat-card__accent" />
          <div className="stat-card__label">Risk levels</div>
          <div className="risk-summary-list">
            <div className="risk-summary-item">
              <span className="risk-summary-item__label risk-summary-item__label--high">High</span>
              <span className="risk-summary-item__value">{stats.high}</span>
            </div>
            <div className="risk-summary-item">
              <span className="risk-summary-item__label risk-summary-item__label--medium">Medium</span>
              <span className="risk-summary-item__value">{stats.medium}</span>
            </div>
            <div className="risk-summary-item">
              <span className="risk-summary-item__label risk-summary-item__label--low">No risk</span>
              <span className="risk-summary-item__value">{stats.low}</span>
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-content">
        <MapView
          probes={probes}
          selectedProbeId={selectedProbeId}
          onSelectProbe={handleSelectProbe}
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
          onSearchSubmit={handleSearchSubmit}
        />

        <aside className="details-column">
          <ProbeDetailsPanel
            probe={selectedProbe}
            onEditCoordinate={handleUpdateProbeCoordinate}
            onRemoveProbe={handleRemoveProbe}
          />
          <AddProbeForm onAddProbe={handleAddProbe} existingIds={probes.map((probe) => probe.id)} />
        </aside>
      </section>

      <BelowMapStatusCards
        moistureSensors={selectedProbe?.metrics?.moistureSensors ?? [0, 0, 0]}
        rainfall={selectedProbe?.metrics?.rainfall ?? 0}
        tiltDetected={selectedProbe?.metrics?.tiltDetected ?? false}
        powerLevel={selectedProbe?.metrics?.power ?? 0}
        mode={selectedProbe?.metrics?.mode ?? 'normal'}
        signalStrength={selectedProbe?.metrics?.signalStrength ?? 0}
      />

      <section className="analytics-section">
        <AnalyticsCharts probe={selectedProbe} />
      </section>
    </main>
  );
}