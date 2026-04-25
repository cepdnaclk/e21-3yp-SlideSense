function buildHistory(seed) {
  return Array.from({ length: 12 }, (_, index) => {
    const phase = seed + index;
    return {
      label: `T-${11 - index}`,
      rainfall: Math.max(12, Math.min(100, Math.round(28 + Math.sin(phase / 2.8) * 18 + index * 1.7))),
      moisture: Math.max(15, Math.min(100, Math.round(42 + Math.cos(phase / 3) * 14 + index * 1.2))),
      vibration: Math.max(8, Math.min(100, Math.round(18 + Math.sin(phase / 2.2) * 12 + index * 1.1))),
      power: Math.max(20, Math.min(100, Math.round(96 - index * 3 - Math.abs(Math.sin(phase / 2.5) * 8)))),
    };
  });
}

function createProbe(index, overrides) {
  const baseLat = 7.05 + index * 0.08;
  const baseLng = 80.55 + index * 0.07;
  const defaultMoisture = 44;
  const defaultMetrics = {
    rainfall: 32,
    moisture: defaultMoisture,
    moistureSensors: {
      m1: defaultMoisture,
      m2: defaultMoisture,
      m3: defaultMoisture,
      avg: defaultMoisture,
    },
    vibration: 16,
    power: 94,
    tilt: 0,
  };
  const { metrics: overrideMetrics = {}, ...restOverrides } = overrides ?? {};
  const mergedMetrics = {
    ...defaultMetrics,
    ...overrideMetrics,
  };

  const m1 = Number(mergedMetrics.moistureSensors?.m1 ?? mergedMetrics.m1 ?? mergedMetrics.moisture ?? 0);
  const m2 = Number(mergedMetrics.moistureSensors?.m2 ?? mergedMetrics.m2 ?? mergedMetrics.moisture ?? 0);
  const m3 = Number(mergedMetrics.moistureSensors?.m3 ?? mergedMetrics.m3 ?? mergedMetrics.moisture ?? 0);
  const avg = Number((((m1 + m2 + m3) / 3) || 0).toFixed(1));

  mergedMetrics.moistureSensors = {
    m1,
    m2,
    m3,
    avg: Number(mergedMetrics.moistureSensors?.avg ?? mergedMetrics.avg_moisture ?? avg),
  };
  mergedMetrics.moisture = Number(mergedMetrics.moistureSensors.avg);
  mergedMetrics.tilt = Number(mergedMetrics.tilt ?? 0);

  return {
    id: `PRB-${100 + index}`,
    latitude: Number((baseLat + (index % 2 === 0 ? 0.012 : -0.014)).toFixed(4)),
    longitude: Number((baseLng + (index % 3 === 0 ? -0.011 : 0.016)).toFixed(4)),
    riskLevel: 'low',
    lastUpdated: '2026-04-23 09:30',
    metrics: mergedMetrics,
    history: buildHistory(index),
    ...restOverrides,
  };
}

export const dummyProbes = [
  createProbe(1, {
    riskLevel: 'high',
    lastUpdated: '2026-04-23 09:44',
    metrics: { rainfall: 86, moistureSensors: { m1: 82, m2: 78, m3: 85, avg: 81.6 }, vibration: 74, power: 63, tilt: 1 },
  }),
  createProbe(2, {
    riskLevel: 'medium',
    lastUpdated: '2026-04-23 09:41',
    metrics: { rainfall: 58, moistureSensors: { m1: 65, m2: 60, m3: 70, avg: 65.0 }, vibration: 38, power: 79, tilt: 0 },
  }),
  createProbe(3, {
    riskLevel: 'low',
    lastUpdated: '2026-04-23 09:38',
    metrics: { rainfall: 29, moistureSensors: { m1: 30, m2: 40, m3: 35, avg: 35.0 }, vibration: 14, power: 97, tilt: 0 },
  }),
  createProbe(4, {
    riskLevel: 'high',
    lastUpdated: '2026-04-23 09:46',
    metrics: { rainfall: 78, moistureSensors: { m1: 88, m2: 90, m3: 86, avg: 88.0 }, vibration: 69, power: 57, tilt: 1 },
  }),
  createProbe(5, {
    riskLevel: 'medium',
    lastUpdated: '2026-04-23 09:35',
    metrics: { rainfall: 46, moistureSensors: { m1: 62, m2: 57, m3: 64, avg: 61.0 }, vibration: 28, power: 84, tilt: 0 },
  }),
  createProbe(6, {
    riskLevel: 'low',
    lastUpdated: '2026-04-23 09:33',
    metrics: { rainfall: 24, moistureSensors: { m1: 34, m2: 36, m3: 35, avg: 35.0 }, vibration: 11, power: 92, tilt: 0 },
  }),
];

export function createProbeRecord({ id, latitude, longitude }) {
  const moisture = 38;
  return {
    id: String(id).trim().toUpperCase(),
    latitude: Number(latitude),
    longitude: Number(longitude),
    riskLevel: 'low',
    lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' '),
    metrics: {
      rainfall: 26,
      moisture,
      moistureSensors: {
        m1: moisture,
        m2: moisture,
        m3: moisture,
        avg: moisture,
      },
      vibration: 12,
      power: 95,
      tilt: 0,
    },
    history: buildHistory(Number(String(id).replace(/\D/g, '')) || 10),
  };
}