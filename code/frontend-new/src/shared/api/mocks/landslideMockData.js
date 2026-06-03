export const MOCK_READINGS = [
  {
    deviceID: 'PRB-001',
    timestamp: Math.floor(Date.now() / 1000),
    lat: 7.8760,
    lng: 80.7710,
    m1: 62,
    m2: 58,
    m3: 64,
    avg_moisture: 61,
    rain: 47,
    vibration: 15,
    tilt: 0,
    power: 91,
    signalStrength: 83,
    mode: 'normal',
    risk: 'low',
  },
  {
    deviceID: 'PRB-102',
    timestamp: Math.floor(Date.now() / 1000) - 60 * 5,
    lat: 7.8800,
    lng: 80.7800,
    m1: 72,
    m2: 70,
    m3: 75,
    avg_moisture: 72,
    rain: 120,
    vibration: 45,
    tilt: 1,
    power: 76,
    signalStrength: 66,
    mode: 'burst',
    risk: 'high',
  },
  {
    deviceID: 'PRB-203',
    timestamp: Math.floor(Date.now() / 1000) - 60 * 30,
    lat: 7.8600,
    lng: 80.7600,
    m1: 45,
    m2: 43,
    m3: 47,
    avg_moisture: 45,
    rain: 8,
    vibration: 12,
    tilt: 0,
    power: 88,
    signalStrength: 90,
    mode: 'normal',
    risk: 'medium',
  },
];

export function getMockLatest(deviceID) {
  const row = MOCK_READINGS.find((r) => String(r.deviceID).toUpperCase() === String(deviceID).toUpperCase());
  if (!row) {
    return {
      moisture: 50,
      rain: 5,
      tilt: 0,
      vibration: 10,
      lastUpdated: null,
    };
  }

  return {
    moisture: row.avg_moisture,
    rain: row.rain,
    tilt: row.tilt,
    vibration: row.vibration,
    lastUpdated: new Date(row.timestamp * 1000).toISOString().slice(0, 16).replace('T', ' '),
  };
}
