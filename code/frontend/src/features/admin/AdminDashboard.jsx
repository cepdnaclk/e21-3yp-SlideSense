import { useEffect, useMemo, useState } from 'react';
import StatCard from './components/StatCard';
import MapView from './components/MapView';
import ProbeDetailsPanel from './components/ProbeDetailsPanel';
import AlertsPanel from './components/AlertsPanel';
import AlertHistory from './components/AlertHistory';
import AnalyticsCharts from './components/AnalyticsCharts';
import CurrentStatusPanel from './components/CurrentStatusPanel';
import { fetchAllReadings, fetchLatestSimple, mapReadingsToProbes } from './data/landslideApi';
import { getRiskCounts, normalizeRiskLevel, sortByRiskSeverity } from '../../shared/utils/riskUtils';

const API_ALL_DATA_URL = import.meta.env.VITE_API_ALL_DATA_URL ?? 'http://landslideproject-env.eba-x9dyqa5g.ap-south-1.elasticbeanstalk.com/api/landslide';
const API_LATEST_SIMPLE_URL = import.meta.env.VITE_API_LATEST_SIMPLE_URL ?? 'http://landslideproject-env.eba-x9dyqa5g.ap-south-1.elasticbeanstalk.com/api/landslide/latest/simple';

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

        return {
          ...probe,
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
            vibration: latest.tilt === 1 ? 70 : 15,
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

  return (
    <main className="admin-dashboard">
      <header className="dashboard-header">
        <div>
          <span className="section-label">Slide Sense</span>
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
          <ProbeDetailsPanel probe={selectedProbe} />
        </aside>
      </section>

      <section className="support-panels">
        <CurrentStatusPanel probe={selectedProbe} />
        <AlertsPanel alerts={highRiskProbes} onSelectProbe={handleSelectProbe} />
        <AlertHistory alerts={highRiskProbes} />
      </section>

      <section className="analytics-section">
        <AnalyticsCharts probe={selectedProbe} />
      </section>
    </main>
  );
}