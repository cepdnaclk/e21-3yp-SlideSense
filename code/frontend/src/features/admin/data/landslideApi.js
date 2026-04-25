const DEFAULT_PAGE_LIMIT = 200;

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

function formatTimestamp(unixSeconds) {
  const timestampMs = toNumber(unixSeconds) * 1000;
  if (!timestampMs) {
    return new Date().toISOString().slice(0, 16).replace('T', ' ');
  }

  const date = new Date(timestampMs);
  if (Number.isNaN(date.getTime())) {
    return new Date().toISOString().slice(0, 16).replace('T', ' ');
  }

  return date.toISOString().slice(0, 16).replace('T', ' ');
}

function buildHistory(rows) {
  const recentRows = rows.slice(0, 12).reverse();

  return recentRows.map((row, index) => {
    const m1 = toNumber(row.m1);
    const m2 = toNumber(row.m2);
    const m3 = toNumber(row.m3);
    const avgMoisture = toNumber(row.avg_moisture, (m1 + m2 + m3) / 3);
    const tilt = toNumber(row.tilt);

    return {
      label: `T-${recentRows.length - index - 1}`,
      rainfall: getRainValue(row),
      moisture: avgMoisture,
      vibration: tilt === 1 ? 70 : 15,
      power: Math.max(60, 100 - index * 3),
    };
  });
}

export function mapReadingsToProbes(readings) {
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
          vibration: tilt === 1 ? 70 : 15,
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

export async function fetchAllReadings(allDataUrl = '') {
  const normalizedAllDataUrl = String(allDataUrl ?? '').trim().replace(/\/$/, '');
  const collected = [];
  let nextToken = null;
  let safetyCounter = 0;

  do {
    const params = new URLSearchParams();
    params.set('limit', String(DEFAULT_PAGE_LIMIT));
    if (nextToken) {
      params.set('nextToken', nextToken);
    }

    const endpoint = `${normalizedAllDataUrl}?${params.toString()}`;
    const response = await fetch(endpoint);

    if (!response.ok) {
      const fallbackMessage = `Failed to load probes (${response.status})`;
      let details = fallbackMessage;
      try {
        const errorPayload = await response.json();
        details = errorPayload?.details || errorPayload?.error || fallbackMessage;
      } catch {
        details = fallbackMessage;
      }
      throw new Error(details);
    }

    const payload = await response.json();
    if (Array.isArray(payload)) {
      collected.push(...payload);
      nextToken = null;
    } else {
      collected.push(...(payload?.items ?? []));
      nextToken = payload?.nextToken ?? null;
    }

    safetyCounter += 1;
    if (safetyCounter > 50) {
      throw new Error('Pagination safety limit reached while loading data.');
    }
  } while (nextToken);

  return collected;
}

export async function fetchLatestSimple(latestSimpleUrl, deviceID) {
  const normalizedLatestSimpleUrl = String(latestSimpleUrl ?? '').trim().replace(/\/$/, '');
  if (!normalizedLatestSimpleUrl || !deviceID) {
    return null;
  }

  const params = new URLSearchParams();
  params.set('deviceID', deviceID);

  const response = await fetch(`${normalizedLatestSimpleUrl}?${params.toString()}`);
  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  return {
    moisture: toNumber(payload?.moisture),
    rain: getRainValue(payload),
    tilt: toNumber(payload?.tilt),
  };
}
