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

  return {
    id: `PRB-${100 + index}`,
    latitude: Number((baseLat + (index % 2 === 0 ? 0.012 : -0.014)).toFixed(4)),
    longitude: Number((baseLng + (index % 3 === 0 ? -0.011 : 0.016)).toFixed(4)),
    riskLevel: 'low',
    lastUpdated: '2026-04-23 09:30',
    metrics: {
      rainfall: 32,
      moisture: 44,
      vibration: 16,
      power: 94,
    },
    history: buildHistory(index),
    ...overrides,
  };
}

export const dummyProbes = [
  createProbe(1, {
    riskLevel: 'high',
    lastUpdated: '2026-04-23 09:44',
    metrics: { rainfall: 86, moisture: 92, vibration: 74, power: 63 },
  }),
  createProbe(2, {
    riskLevel: 'medium',
    lastUpdated: '2026-04-23 09:41',
    metrics: { rainfall: 58, moisture: 63, vibration: 38, power: 79 },
  }),
  createProbe(3, {
    riskLevel: 'low',
    lastUpdated: '2026-04-23 09:38',
    metrics: { rainfall: 29, moisture: 41, vibration: 14, power: 97 },
  }),
  createProbe(4, {
    riskLevel: 'high',
    lastUpdated: '2026-04-23 09:46',
    metrics: { rainfall: 78, moisture: 88, vibration: 69, power: 57 },
  }),
  createProbe(5, {
    riskLevel: 'medium',
    lastUpdated: '2026-04-23 09:35',
    metrics: { rainfall: 46, moisture: 61, vibration: 28, power: 84 },
  }),
  createProbe(6, {
    riskLevel: 'low',
    lastUpdated: '2026-04-23 09:33',
    metrics: { rainfall: 24, moisture: 35, vibration: 11, power: 92 },
  }),
];

export function createProbeRecord({ id, latitude, longitude }) {
  return {
    id: String(id).trim().toUpperCase(),
    latitude: Number(latitude),
    longitude: Number(longitude),
    riskLevel: 'low',
    lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' '),
    metrics: {
      rainfall: 26,
      moisture: 38,
      vibration: 12,
      power: 95,
    },
    history: buildHistory(Number(String(id).replace(/\D/g, '')) || 10),
  };
}