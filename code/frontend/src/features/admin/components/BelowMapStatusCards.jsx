function clampPercent(value) {
  return Math.max(0, Math.min(100, Number(value) || 0));
}

const DUMMY_FALLBACK = {
  moistureSensors: [62, 58, 64],
  rainfall: 47,
  tiltDetected: false,
  powerLevel: 91,
  mode: 'normal',
  signalStrength: 83,
  vibration: 15,
};

function getMoistureValues(moistureSensors) {
  const defaults = DUMMY_FALLBACK.moistureSensors;
  if (Array.isArray(moistureSensors)) {
    return [
      clampPercent(moistureSensors[0] ?? defaults[0]),
      clampPercent(moistureSensors[1] ?? defaults[1]),
      clampPercent(moistureSensors[2] ?? defaults[2]),
    ];
  }

  if (moistureSensors && typeof moistureSensors === 'object') {
    return [
      clampPercent(moistureSensors.m1 ?? defaults[0]),
      clampPercent(moistureSensors.m2 ?? defaults[1]),
      clampPercent(moistureSensors.m3 ?? defaults[2]),
    ];
  }

  return [
    clampPercent(defaults[0]),
    clampPercent(defaults[1]),
    clampPercent(defaults[2]),
  ];
}

export default function BelowMapStatusCards({ moistureSensors, rainfall, tiltDetected, powerLevel, mode, signalStrength, vibration }) {
  const [sensorOne, sensorTwo, sensorThree] = getMoistureValues(moistureSensors);
  const averageMoisture = Math.round((sensorOne + sensorTwo + sensorThree) / 3);
  const parsedRainfall = Number(rainfall);
  const rainfallValue = Number.isFinite(parsedRainfall) ? parsedRainfall : DUMMY_FALLBACK.rainfall;
  const rainfallLabel = Number.isInteger(rainfallValue) ? String(rainfallValue) : rainfallValue.toFixed(1);
  const powerValue = clampPercent(powerLevel ?? DUMMY_FALLBACK.powerLevel);
  const signalValue = clampPercent(signalStrength ?? DUMMY_FALLBACK.signalStrength);
  const vibrationValue = Number.isFinite(Number(vibration)) ? Number(vibration) : DUMMY_FALLBACK.vibration;
  const isTiltDetected = tiltDetected ?? DUMMY_FALLBACK.tiltDetected;
  const normalizedMode = (mode ?? DUMMY_FALLBACK.mode) === 'burst' ? 'Burst Mode' : 'Normal Mode';

  return (
    <section className="below-map-section panel-card">
      <div className="panel-card__title-row">
        <div>
          <span className="section-label">Operational metrics</span>
          <h2 className="panel-card__title">Real-time sensor summary</h2>
        </div>
      </div>

      <div className="below-map-grid">
        <article className="metric-card below-map-card moisture-card">
          <div className="moisture-card__head">
            <span className="moisture-card__title">Moisture</span>
            <span className="moisture-card__subtitle">Average reading</span>
          </div>
          <div className="moisture-card__average" aria-label={`Average moisture ${averageMoisture} percent`}>
            <small>Avg</small>
            {averageMoisture}%
          </div>
          <div className="moisture-card__sensor-grid">
            <div className="moisture-sensor-box">
              <small>S1</small>
              <strong>{sensorOne}%</strong>
            </div>
            <div className="moisture-sensor-box">
              <small>S2</small>
              <strong>{sensorTwo}%</strong>
            </div>
            <div className="moisture-sensor-box">
              <small>S3</small>
              <strong>{sensorThree}%</strong>
            </div>
          </div>
          <div className="moisture-card__progress-track" aria-hidden="true">
            <span className="moisture-card__progress-fill" style={{ width: `${averageMoisture}%` }} />
          </div>
        </article>

        <article className="metric-card below-map-card rainfall-card">
          <div className="rainfall-card__head">
            <span className="rainfall-card__title">Rainfall</span>
          </div>
          <div className="rainfall-card__value" aria-label={`Current rainfall ${rainfallLabel} millimeters`}>
            {rainfallLabel} mm
          </div>
        </article>

        <article className="metric-card below-map-card tilt-card">
          <div className="tilt-card__head">
            <span className="tilt-card__title">Tilt</span>
          </div>
          <div className={`tilt-card__value ${isTiltDetected ? 'tilt-card__value--alert' : 'tilt-card__value--safe'}`}>
            {isTiltDetected ? 'Detected' : 'Not Detected'}
          </div>
        </article>

        <article className="metric-card below-map-card health-card">
          <div className="health-card__head">
            <span className="health-card__title">System Health</span>
            <span className="health-card__subtitle">Power and mode</span>
          </div>
          <div className="health-card__rows">
            <div className="health-card__row">
              <span className="health-card__row-label">Power</span>
              <span className="health-card__row-value">{Math.round(powerValue)}%</span>
            </div>
            <div className="health-card__row">
              <span className="health-card__row-label">Mode</span>
              <span className={`health-card__row-value ${(mode ?? DUMMY_FALLBACK.mode) === 'burst' ? 'health-text--alert' : 'health-text--safe'}`}>
                {normalizedMode}
              </span>
            </div>
            <div className="health-card__row">
              <span className="health-card__row-label">Signal</span>
              <span className="health-card__row-value">{Math.round(signalValue)}%</span>
            </div>
            <div className="health-card__row">
              <span className="health-card__row-label">Vibration</span>
              <span className="health-card__row-value">{Math.round(vibrationValue)} Hz</span>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}