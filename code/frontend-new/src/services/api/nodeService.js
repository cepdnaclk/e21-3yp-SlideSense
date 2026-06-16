import { getMockNodeLatest, mockNodeReadings } from '../mock/nodeMockData.js';
import { fetchAllReadings, fetchLatestSimple } from '../../shared/api/landslideApi.js';

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeRisk(risk) {
  const normalized = String(risk ?? '').trim().toLowerCase();
  if (normalized === 'high') {
    return 'high';
  }
  if (normalized === 'moderate' || normalized === 'medium') {
    return 'medium';
  }
  return 'low';
}

function normalizeMode(mode) {
  const normalized = String(mode ?? '').trim().toLowerCase();
  return normalized === 'burst' ? 'burst' : 'normal';
}

function getRainValue(source, fallback = 0) {
  if (!source || typeof source !== 'object') {
    return fallback;
  }

  return toNumber(
    source.rain
      ?? source.rainfall
      ?? source.rainfallMm
      ?? source.rainfall_mm
      ?? source.totalRainfall,
    fallback,
  );
}

function getVibrationValue(source, fallback = 0) {
  if (!source || typeof source !== 'object') {
    return fallback;
  }

  return toNumber(
    source.vibration
      ?? source.vibrationMag
      ?? source.vibration_mag
      ?? source.maxVibration
      ?? source.max_vibration,
    fallback,
  );
}

function formatDateTimeLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}`;
}

function formatTimestamp(rawTimestamp) {
  const timestamp = toNumber(rawTimestamp);
  if (!timestamp) {
    return formatDateTimeLocal(new Date());
  }

  const timestampMs = timestamp > 1e12 ? timestamp : timestamp * 1000;
  const date = new Date(timestampMs);

  if (Number.isNaN(date.getTime())) {
    return formatDateTimeLocal(new Date());
  }

  return formatDateTimeLocal(date);
}

function buildHistory(rows) {
  const recentRows = [...rows].reverse();

  return recentRows.map((row, index) => {
    const m1 = toNumber(row.m1);
    const m2 = toNumber(row.m2);
    const m3 = toNumber(row.m3);
    const avgMoisture = toNumber(row.avg_moisture, (m1 + m2 + m3) / 3);
    const tilt = toNumber(row.tilt);
    const vibration = getVibrationValue(row, tilt === 1 ? 70 : 15);

    return {
      label: `T-${recentRows.length - index - 1}`,
      timestamp: parseLastUpdated(row) || formatDateTimeLocal(new Date()),
      rainfall: getRainValue(row),
      moisture: avgMoisture,
      vibration,
      power: Math.max(60, 100 - index * 3),
    };
  });
}

function parseLastUpdated(source) {
  const rawTimestamp = source?.timestamp ?? source?.time ?? source?.recordedAt ?? source?.updatedAt ?? null;

  if (rawTimestamp === null || rawTimestamp === undefined || rawTimestamp === '') {
    return null;
  }

  if (typeof rawTimestamp === 'number' || /^\d+(\.\d+)?$/.test(String(rawTimestamp).trim())) {
    return formatTimestamp(rawTimestamp);
  }

  const date = new Date(rawTimestamp);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return formatDateTimeLocal(date);
}

export function mapReadingsToNodes(readings) {
  const grouped = readings.reduce((accumulator, reading) => {
    const deviceId = String(reading?.deviceID ?? '').trim();
    if (!deviceId) {
      return accumulator;
    }

    if (!accumulator.has(deviceId)) {
      accumulator.set(deviceId, []);
    }

    accumulator.get(deviceId).push(reading);
    return accumulator;
  }, new Map());

  return [...grouped.entries()]
    .map(([deviceId, rows]) => {
      const sortedRows = [...rows].sort((left, right) => toNumber(right.timestamp) - toNumber(left.timestamp));
      const latest = sortedRows[0];
      const m1 = toNumber(latest.m1);
      const m2 = toNumber(latest.m2);
      const m3 = toNumber(latest.m3);
      const avgMoisture = toNumber(latest.avg_moisture, (m1 + m2 + m3) / 3);
      const tilt = toNumber(latest.tilt);
      const vibration = getVibrationValue(latest, tilt === 1 ? 70 : 15);
      const power = toNumber(latest.power ?? latest.battery ?? latest.batteryLevel, 100);
      const signalStrength = toNumber(latest.signalStrength ?? latest.signal ?? latest.rssi, 83);
      const mode = normalizeMode(latest.mode);

      return {
        id: deviceId,
        latitude: toNumber(latest.lat, 7.8731),
        longitude: toNumber(latest.lng, 80.7718),
        riskLevel: normalizeRisk(latest.risk),
        lastUpdated: formatTimestamp(latest.timestamp),
        metrics: {
          rainfall: getRainValue(latest),
          moisture: avgMoisture,
          moistureSensors: {
            m1,
            m2,
            m3,
            avg: avgMoisture,
          },
          vibration,
          power,
          signalStrength,
          mode,
          tilt,
          tiltDetected: tilt === 1,
        },
        history: buildHistory(sortedRows),
      };
    })
    .sort((left, right) => left.id.localeCompare(right.id));
}



const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export async function createNode(nodeData) {
  const token = localStorage.getItem('AUTH_TOKEN');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  const payload = {
    probeId: nodeData.id,
    hwSerial: nodeData.hwSerial,
    firmwareVer: '1.0.0',
    latitude: nodeData.latitude,
    longitude: nodeData.longitude,
    status: 'ONLINE'
  };

  const response = await fetch(`${API_BASE_URL}/admin/probes/create`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errMessage = 'Unknown error';
    try {
      const errPayload = await response.json();
      errMessage = errPayload.message || errPayload.error || JSON.stringify(errPayload);
    } catch {
      errMessage = await response.text() || response.statusText;
    }
    throw new Error(`Failed to create node: ${errMessage}`);
  }
  return response.json();
}

export async function deleteNode(deviceId) {
  const token = localStorage.getItem('AUTH_TOKEN');
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

  const response = await fetch(`${API_BASE_URL}/admin/probes/${deviceId}`, {
    method: 'DELETE',
    headers
  });

  if (!response.ok) {
    let errMessage = 'Unknown error';
    try {
      const errPayload = await response.json();
      errMessage = errPayload.message || errPayload.error || JSON.stringify(errPayload);
    } catch {
      errMessage = await response.text() || response.statusText;
    }
    throw new Error(`Failed to delete node: ${errMessage}`);
  }
}


export async function getNodes() {
  const role = localStorage.getItem('USER_ROLE');
  const endpoint = role === 'resident' 
    ? `${API_BASE_URL}/api/v1/probes/my-readings`
    : `${API_BASE_URL}/api/v1/probes/readings`;
    
  const readings = await fetchAllReadings(endpoint);
  return mapReadingsToNodes(readings);
}

export async function getLatestNodeSnapshot(deviceID) {
  const endpoint = `${API_BASE_URL}/api/v1/probes/latest`;
  return fetchLatestSimple(endpoint, deviceID);
}

export function createNodeRecord({ id, latitude, longitude }) {
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