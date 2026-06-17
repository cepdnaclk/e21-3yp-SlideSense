import { useEffect, useMemo, useState } from 'react';
import { getNodes, getLatestNodeSnapshot, mapReadingsToNodes, createNode, deleteNode } from '../../services/api/nodeService';
import { getRiskCounts, normalizeRiskLevel, sortByRiskSeverity } from '../utils/riskUtils';


function formatNowLocal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function createProbeRecord({ id, hwSerial, latitude, longitude }) {
  const now = new Date().toISOString().slice(0, 16).replace('T', ' ');

  return {
    id,
    hwSerial,
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

export function useProbeNetwork() {
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [probes, setProbes] = useState([]);
  const [selectedProbeId, setSelectedProbeId] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [isLoadingLiveData, setIsLoadingLiveData] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [focusTrigger, setFocusTrigger] = useState(0);

  const selectedProbe = useMemo(
    () => probes.find((probe) => probe.id === selectedProbeId) ?? null,
    [probes, selectedProbeId],
  );

  const stats = useMemo(() => getRiskCounts(probes), [probes]);
  const highRiskProbes = useMemo(
    () => sortByRiskSeverity(probes.filter((probe) => normalizeRiskLevel(probe.riskLevel) === 'high')),
    [probes],
  );

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
        const liveProbes = await getNodes(
          dateRange.start ? new Date(dateRange.start).toISOString() : null,
          dateRange.end ? new Date(dateRange.end).toISOString() : null
        );

        if (!active || !Array.isArray(liveProbes) || liveProbes.length === 0) {
          if (active && (!Array.isArray(liveProbes) || liveProbes.length === 0)) {
            setProbes([]);
            setSelectedProbeId(null);
            setLoadError('No probe records found from mock service.');
          }
          return;
        }

        setProbes(liveProbes);
        setSelectedProbeId((currentId) => (currentId && liveProbes.some((probe) => probe.id === currentId) ? currentId : null));
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
  }, [dateRange.start, dateRange.end]);

  useEffect(() => {
    let active = true;

    async function syncLatestForSelectedProbe() {
      if (!selectedProbeId) {
        return;
      }

      const latest = await getLatestNodeSnapshot(selectedProbeId);
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
          timestamp: latest.lastUpdated ?? formatNowLocal(),
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

  function selectProbe(probeId) {
    setSelectedProbeId(probeId);
    setSearchValue(probeId);
    setFocusTrigger((c) => c + 1);
  }

  function handleSearchChange(event) {
    setSearchValue(event.target.value.toUpperCase());
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    const match = probes.find((probe) => probe.id.toLowerCase() === searchValue.trim().toLowerCase());

    if (match) {
      selectProbe(match.id);
    }
  }

  async function addProbe({ id, hwSerial, latitude, longitude }) {
    try {
      await createNode({ id, hwSerial, latitude, longitude });
      const nextProbe = createProbeRecord({ id, hwSerial, latitude, longitude });
      setProbes((current) => [...current, nextProbe]);
      selectProbe(nextProbe.id);
    } catch (err) {
      console.error(err);
      alert('Failed to add probe: ' + err.message);
    }
  }

  function updateProbeCoordinate(probeId, field, value) {
    const nextValue = Number(value);
    if (!Number.isFinite(nextValue)) {
      return;
    }

    setProbes((current) => current.map((probe) => (probe.id === probeId ? { ...probe, [field]: nextValue } : probe)));
  }

  async function removeProbe(probeId) {
    try {
      await deleteNode(probeId);
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
    } catch (err) {
      console.error(err);
      alert('Failed to remove probe: ' + err.message);
    }
  }

  return {
    probes,
    selectedProbe,
    selectedProbeId,
    searchValue,
    focusTrigger,
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
    setSelectedProbeId,
    setSearchValue,
    dateRange,
    setDateRange,
  };
}