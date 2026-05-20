import { useEffect, useMemo, useState } from 'react';
import StatCard from './components/StatCard';
import MapView from './components/MapView';
import ProbeDetailsPanel from './components/ProbeDetailsPanel';
import AlertsPanel from './components/AlertsPanel';
import AlertHistory from './components/AlertHistory';
import AnalyticsCharts from './components/AnalyticsCharts';
import CurrentStatusPanel from './components/CurrentStatusPanel';
import AddProbeForm from './components/AddProbeForm';
import BelowMapStatusCards from './components/BelowMapStatusCards';
import { fetchAllReadings, fetchLatestSimple, mapReadingsToProbes } from './data/landslideApi';
import { getRiskCounts, normalizeRiskLevel, sortByRiskSeverity } from '../../shared/utils/riskUtils';

const API_ALL_DATA_URL = import.meta.env.VITE_API_ALL_DATA_URL ?? 'http://landslideproject-env.eba-x9dyqa5g.ap-south-1.elasticbeanstalk.com/api/landslide';
const API_LATEST_SIMPLE_URL = import.meta.env.VITE_API_LATEST_SIMPLE_URL ?? 'http://landslideproject-env.eba-x9dyqa5g.ap-south-1.elasticbeanstalk.com/api/landslide/latest/simple';

function formatNowLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function createProbeRecord({ id, latitude, longitude }) {
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

  return {
    id,
    latitude,
    longitude,
    riskLevel: 'low',
    lastUpdated: now,
    metrics: {
      rainfall: 0,
      moisture: 0,
      moistureSensors: {
        m1: 0,
        m2: 0,
        m3: 0,
        avg: 0,
      },
      vibration: 0,
      power: 100,
      tilt: 0,
      tiltDetected: false,
      mode: 'normal',
      signalStrength: 100,
    },
    history: [],
  };
}

export default function AdminDashboard() {
  const [probes, setProbes] = useState([]);
  const [selectedProbeId, setSelectedProbeId] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [isLoadingLiveData, setIsLoadingLiveData] = useState(false);
  const [loadError, setLoadError] = useState('');

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

  useEffect(() => {
    let active = true;

    async function loadLiveData() {
      setIsLoadingLiveData(true);
      setLoadError('');

      try {
        const rows = await fetchAllReadings(API_ALL_DATA_URL);
        const liveProbes = mapReadingsToProbes(rows);

        if (!active || liveProbes.length === 0) {
          if (active && liveProbes.length === 0) {
            setProbes([]);
            setSelectedProbeId(null);
            setLoadError('No probe records found from backend API.');
          }
          return;
        }

        setProbes(liveProbes);
        setSelectedProbeId((currentId) => currentId && liveProbes.some((probe) => probe.id === currentId)
          ? currentId
          : liveProbes[0].id);
      } catch (error) {
        if (active) {
          setProbes([]);
          setSelectedProbeId(null);
          setLoadError(`Live data unavailable: ${error.message}.`);
        }
      } finally {
        if (active) {
          setIsLoadingLiveData(false);
        }
      }
    }

    loadLiveData();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function syncLatestForSelectedProbe() {
      if (!selectedProbeId) {
        return;
      }

      const latest = await fetchLatestSimple(API_LATEST_SIMPLE_URL, selectedProbeId);
      if (!active || !latest) {
        return;
      }

      setProbes((current) => current.map((probe) => {
        if (probe.id !== selectedProbeId) {
          return probe;
        }

        const m2 = Number(probe.metrics?.moistureSensors?.m2 ?? latest.moisture);
        const m3 = Number(probe.metrics?.moistureSensors?.m3 ?? latest.moisture);
        const avg = Number(((latest.moisture + m2 + m3) / 3).toFixed(1));
        const vibration = Number.isFinite(Number(latest.vibration))
          ? Number(latest.vibration)
          : (latest.tilt === 1 ? 70 : 15);
        const nextHistory = [...(Array.isArray(probe.history) ? probe.history : []), {
          label: 'Now',
          rainfall: latest.rain,
          moisture: avg,
          vibration,
          power: Number(probe.metrics?.power ?? 100),
        }].slice(-48);

        return {
          ...probe,
          lastUpdated: latest.lastUpdated ?? formatNowLocal(),
          history: nextHistory,
          metrics: {
            ...probe.metrics,
            rainfall: latest.rain,
            moisture: avg,
            moistureSensors: {
              m1: latest.moisture,
              m2,
              m3,
              avg,
            },
            tilt: latest.tilt,
            vibration,
          },
        };
      }));
    }

    syncLatestForSelectedProbe();

    return () => {
      active = false;
    };
  }, [selectedProbeId]);

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
        <div className="dashboard-brand">
          <img src="/logo.png" alt="Slide Sense logo" className="dashboard-brand__logo" />
        </div>
        <div className="dashboard-header__title">
          <h1>Admin Dashboard</h1>
          {isLoadingLiveData && <p>Loading live sensor data from backend...</p>}
          {!isLoadingLiveData && !loadError && <p>Live backend connected.</p>}
          {loadError && <p>{loadError}</p>}
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
        moistureSensors={selectedProbe?.metrics?.moistureSensors}
        rainfall={selectedProbe?.metrics?.rainfall}
        tiltDetected={selectedProbe?.metrics?.tiltDetected ?? (selectedProbe?.metrics?.tilt === 1)}
        powerLevel={selectedProbe?.metrics?.power}
        mode={selectedProbe?.metrics?.mode}
        signalStrength={selectedProbe?.metrics?.signalStrength}
        vibration={selectedProbe?.metrics?.vibration}
      />

      <section className="analytics-section">
        <AnalyticsCharts probe={selectedProbe} />
      </section>
    </main>
  );
}