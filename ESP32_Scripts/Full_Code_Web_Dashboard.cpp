#include <Arduino.h>
#include <TinyGPS++.h>
#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoJson.h>

// ===== WIFI =====
const char *ssid = "";
const char *password = "";

// ===== GPS =====
HardwareSerial SerialGPS(2);
TinyGPSPlus gps;

// ===== PINS =====
#define MOISTURE1 34
#define MOISTURE2 35
#define MOISTURE3 32
#define RAIN_PIN 14

volatile int rainCount = 0;

void IRAM_ATTR rainPulse() {
  rainCount++;
}

// ===== SERVER =====
AsyncWebServer server(80);
AsyncWebSocket ws("/ws");

// ===== HTML DASHBOARD =====
const char index_html[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Landslide Monitor</title>

  <!-- Leaflet Map -->
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <!-- Chart.js -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <!-- Google Fonts -->
  <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Exo+2:wght@300;600;800&display=swap" rel="stylesheet"/>

  <style>
    :root {
      --bg: #060d1a;
      --surface: #0b1628;
      --card: #0f1f38;
      --border: #1a3a5c;
      --accent: #00e5ff;
      --accent2: #39ff14;
      --warn: #ff9800;
      --danger: #ff1744;
      --text: #cfe8ff;
      --muted: #4a7fa5;
      --font-mono: 'Share Tech Mono', monospace;
      --font-ui: 'Exo 2', sans-serif;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background: var(--bg);
      color: var(--text);
      font-family: var(--font-ui);
      min-height: 100vh;
      overflow-x: hidden;
    }

    /* Animated grid background */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background-image:
        linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px);
      background-size: 40px 40px;
      pointer-events: none;
      z-index: 0;
    }

    .container {
      position: relative;
      z-index: 1;
      max-width: 1400px;
      margin: 0 auto;
      padding: 20px;
    }

    /* ---- HEADER ---- */
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 18px 24px;
      background: linear-gradient(135deg, #0b1628cc, #0f1f38cc);
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-bottom: 20px;
      backdrop-filter: blur(12px);
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .logo-icon {
      width: 44px; height: 44px;
      background: linear-gradient(135deg, var(--accent), #0066ff);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px;
      box-shadow: 0 0 20px rgba(0,229,255,0.4);
    }

    header h1 {
      font-size: 1.4rem;
      font-weight: 800;
      letter-spacing: 1px;
      background: linear-gradient(90deg, var(--accent), #80dfff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    header p {
      font-size: 0.75rem;
      color: var(--muted);
      font-family: var(--font-mono);
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 0.8rem;
      color: var(--accent2);
      background: rgba(57,255,20,0.08);
      border: 1px solid rgba(57,255,20,0.25);
      padding: 8px 16px;
      border-radius: 20px;
    }

    .pulse-dot {
      width: 8px; height: 8px;
      background: var(--accent2);
      border-radius: 50%;
      animation: pulse 1.5s ease-in-out infinite;
      box-shadow: 0 0 8px var(--accent2);
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.8); }
    }

    /* ---- ALERT BANNER ---- */
    #alertBanner {
      display: none;
      background: linear-gradient(90deg, rgba(255,23,68,0.15), rgba(255,152,0,0.1));
      border: 1px solid var(--danger);
      border-radius: 10px;
      padding: 12px 20px;
      margin-bottom: 20px;
      font-weight: 600;
      font-size: 0.9rem;
      color: #ff6b8a;
      animation: flashAlert 1s ease-in-out infinite;
    }

    @keyframes flashAlert {
      0%, 100% { border-color: var(--danger); }
      50% { border-color: transparent; }
    }

    /* ---- GRID ---- */
    .grid-main {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 20px;
    }

    .grid-bottom {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }

    .grid-charts {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    /* ---- CARD ---- */
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      position: relative;
      overflow: hidden;
      transition: border-color 0.3s, box-shadow 0.3s;
    }

    .card::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--accent), transparent);
      opacity: 0.5;
    }

    .card:hover {
      border-color: var(--accent);
      box-shadow: 0 0 20px rgba(0,229,255,0.1);
    }

    .card-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--muted);
      font-family: var(--font-mono);
      margin-bottom: 8px;
    }

    .card-value {
      font-size: 2rem;
      font-weight: 800;
      color: var(--accent);
      font-family: var(--font-mono);
      line-height: 1;
    }

    .card-unit {
      font-size: 0.75rem;
      color: var(--muted);
      margin-top: 4px;
    }

    .card-icon {
      position: absolute;
      top: 16px; right: 16px;
      font-size: 1.6rem;
      opacity: 0.2;
    }

    /* Moisture bars */
    .moisture-card .card-label { margin-bottom: 14px; }

    .moisture-item {
      margin-bottom: 14px;
    }

    .moisture-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.78rem;
      color: var(--muted);
      margin-bottom: 6px;
      font-family: var(--font-mono);
    }

    .moisture-val {
      color: var(--text);
      font-weight: 600;
    }

    .bar-track {
      height: 8px;
      background: rgba(255,255,255,0.05);
      border-radius: 4px;
      overflow: hidden;
    }

    .bar-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.8s cubic-bezier(0.4,0,0.2,1), background 0.5s;
      position: relative;
    }

    .bar-fill::after {
      content: '';
      position: absolute;
      top: 0; right: 0;
      width: 4px; height: 100%;
      background: rgba(255,255,255,0.5);
      border-radius: 2px;
    }

    /* Moisture level colors */
    .level-low    { background: linear-gradient(90deg, #1a8a4a, var(--accent2)); }
    .level-mid    { background: linear-gradient(90deg, #b8600a, var(--warn)); }
    .level-high   { background: linear-gradient(90deg, #8b0000, var(--danger)); }

    /* GPS card */
    .gps-coords {
      font-family: var(--font-mono);
      font-size: 1rem;
      color: var(--accent);
      margin-bottom: 4px;
    }

    .gps-fix {
      display: inline-block;
      font-size: 0.7rem;
      padding: 3px 10px;
      border-radius: 20px;
      margin-top: 8px;
      font-family: var(--font-mono);
    }

    .fix-ok   { background: rgba(57,255,20,0.1); color: var(--accent2); border: 1px solid rgba(57,255,20,0.3); }
    .fix-none { background: rgba(255,23,68,0.1);  color: #ff6b8a; border: 1px solid rgba(255,23,68,0.3); }

    /* Rain card */
    .rain-big {
      font-family: var(--font-mono);
      font-size: 2.8rem;
      font-weight: 800;
      color: var(--accent);
    }

    /* Map */
    #map {
      height: 320px;
      border-radius: 10px;
      border: 1px solid var(--border);
    }

    /* Charts */
    .chart-wrap {
      position: relative;
      height: 200px;
    }

    /* Risk gauge */
    .risk-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px 0;
    }

    .risk-label-text {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--muted);
      font-family: var(--font-mono);
      margin-bottom: 12px;
    }

    .gauge-container {
      position: relative;
      width: 160px; height: 90px;
      overflow: visible;
    }

    .gauge-svg { width: 160px; height: 100px; }

    .risk-level-text {
      font-size: 1.1rem;
      font-weight: 800;
      margin-top: 8px;
      font-family: var(--font-mono);
      letter-spacing: 2px;
    }

    /* Uptime */
    .stat-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.04);
      font-size: 0.82rem;
    }

    .stat-row:last-child { border-bottom: none; }
    .stat-key { color: var(--muted); font-family: var(--font-mono); }
    .stat-val { color: var(--text); font-weight: 600; font-family: var(--font-mono); }

    /* Responsive */
    @media (max-width: 900px) {
      .grid-main { grid-template-columns: repeat(2, 1fr); }
      .grid-bottom { grid-template-columns: 1fr; }
      .grid-charts { grid-template-columns: 1fr; }
    }

    @media (max-width: 520px) {
      .grid-main { grid-template-columns: 1fr; }
    }

    /* Glow effects on danger */
    .danger-glow {
      box-shadow: 0 0 24px rgba(255,23,68,0.3) !important;
      border-color: var(--danger) !important;
    }

    /* Scanline overlay */
    body::after {
      content: '';
      position: fixed;
      inset: 0;
      background: repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0,0,0,0.03) 2px,
        rgba(0,0,0,0.03) 4px
      );
      pointer-events: none;
      z-index: 0;
    }

    .card-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 14px;
      letter-spacing: 0.5px;
    }
  </style>
</head>
<body>

<div class="container">

  <!-- HEADER -->
  <header>
    <div class="header-left">
      <div class="logo-icon">🌋</div>
      <div>
        <h1>LANDSLIDE MONITOR</h1>
        <p>ESP32 · Real-time Terrain Intelligence</p>
      </div>
    </div>
    <div class="status-badge">
      <div class="pulse-dot"></div>
      <span id="connStatus">CONNECTING…</span>
    </div>
  </header>

  <!-- ALERT BANNER -->
  <div id="alertBanner">⚠️ HIGH RISK ALERT — Moisture levels critical. Immediate inspection recommended.</div>

  <!-- STAT CARDS -->
  <div class="grid-main">

    <!-- GPS -->
    <div class="card" id="gpsCard">
      <div class="card-icon">📡</div>
      <div class="card-label">GPS Location</div>
      <div class="gps-coords" id="latVal">—</div>
      <div class="gps-coords" id="lngVal">—</div>
      <span class="gps-fix fix-none" id="gpsFix">NO FIX</span>
    </div>

    <!-- Rain -->
    <div class="card" id="rainCard">
      <div class="card-icon">🌧️</div>
      <div class="card-label">Rain Pulses</div>
      <div class="rain-big" id="rainVal">0</div>
      <div class="card-unit">tip bucket events</div>
    </div>

    <!-- Uptime + Stats -->
    <div class="card">
      <div class="card-icon">⏱️</div>
      <div class="card-label">System Status</div>
      <div class="stat-row"><span class="stat-key">UPTIME</span><span class="stat-val" id="uptimeVal">0s</span></div>
      <div class="stat-row"><span class="stat-key">PACKETS</span><span class="stat-val" id="packetVal">0</span></div>
      <div class="stat-row"><span class="stat-key">GPS SAT</span><span class="stat-val" id="satVal">—</span></div>
      <div class="stat-row"><span class="stat-key">HDOP</span><span class="stat-val" id="hdopVal">—</span></div>
    </div>

    <!-- Risk Gauge -->
    <div class="card risk-wrap">
      <div class="risk-label-text">Risk Level</div>
      <div class="gauge-container">
        <svg class="gauge-svg" viewBox="0 0 160 100">
          <!-- Track -->
          <path d="M 10 90 A 70 70 0 0 1 150 90" fill="none" stroke="#1a3a5c" stroke-width="14" stroke-linecap="round"/>
          <!-- Fill -->
          <path id="gaugeFill" d="M 10 90 A 70 70 0 0 1 150 90" fill="none" stroke="#39ff14" stroke-width="14" stroke-linecap="round"
                stroke-dasharray="220" stroke-dashoffset="220" style="transition: stroke-dashoffset 1s, stroke 0.5s;"/>
          <!-- Needle -->
          <line id="gaugeNeedle" x1="80" y1="90" x2="80" y2="28" stroke="white" stroke-width="2.5"
                stroke-linecap="round" style="transform-origin: 80px 90px; transition: transform 1s;"/>
          <circle cx="80" cy="90" r="5" fill="white"/>
          <!-- Labels -->
          <text x="6" y="106" fill="#4a7fa5" font-size="10" font-family="monospace">LOW</text>
          <text x="120" y="106" fill="#4a7fa5" font-size="10" font-family="monospace">HIGH</text>
        </svg>
      </div>
      <div class="risk-level-text" id="riskText" style="color: var(--accent2);">LOW</div>
    </div>

  </div>

  <!-- MOISTURE + MAP -->
  <div class="grid-bottom">

    <!-- Map -->
    <div class="card" style="padding: 16px;">
      <div class="card-title">📍 Live GPS Map</div>
      <div id="map"></div>
    </div>

    <!-- Moisture Sensors -->
    <div class="card moisture-card">
      <div class="card-label">Soil Moisture Sensors</div>

      <div class="moisture-item">
        <div class="moisture-header">
          <span>Sensor 1</span>
          <span class="moisture-val"><span id="m1v">0</span> / 4095</span>
        </div>
        <div class="bar-track"><div class="bar-fill level-low" id="bar1" style="width:0%"></div></div>
      </div>

      <div class="moisture-item">
        <div class="moisture-header">
          <span>Sensor 2</span>
          <span class="moisture-val"><span id="m2v">0</span> / 4095</span>
        </div>
        <div class="bar-track"><div class="bar-fill level-low" id="bar2" style="width:0%"></div></div>
      </div>

      <div class="moisture-item">
        <div class="moisture-header">
          <span>Sensor 3</span>
          <span class="moisture-val"><span id="m3v">0</span> / 4095</span>
        </div>
        <div class="bar-track"><div class="bar-fill level-low" id="bar3" style="width:0%"></div></div>
      </div>

      <div style="margin-top: 18px;">
        <div class="card-label" style="margin-bottom:8px;">Average Moisture</div>
        <div class="card-value" id="avgMoisture">0</div>
        <div class="card-unit">out of 4095 (12-bit ADC)</div>
      </div>
    </div>

  </div>

  <!-- CHARTS -->
  <div class="grid-charts">

    <div class="card">
      <div class="card-title">📈 Moisture History (last 30s)</div>
      <div class="chart-wrap">
        <canvas id="moistureChart"></canvas>
      </div>
    </div>

    <div class="card">
      <div class="card-title">🌧️ Rain Accumulation</div>
      <div class="chart-wrap">
        <canvas id="rainChart"></canvas>
      </div>
    </div>

  </div>

</div><!-- /container -->

<script>
// ============================================================
//  STATE
// ============================================================
let packets = 0;
let startTime = Date.now();
let map, marker, circle;
let lastLat = 0, lastLng = 0;

// History buffers (30 points)
const MAX_HIST = 30;
const labels    = [];
const hist_m1   = [], hist_m2 = [], hist_m3 = [];
const hist_rain = [];
const hist_time = [];

// ============================================================
//  LEAFLET MAP
// ============================================================
map = L.map('map', {
  center: [7.2, 80.7],   // Sri Lanka default
  zoom: 10,
  zoomControl: true
});

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap',
  maxZoom: 19
}).addTo(map);

const customIcon = L.divIcon({
  html: '<div style="font-size:22px; filter: drop-shadow(0 0 6px #00e5ff);">📍</div>',
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  className: ''
});

// ============================================================
//  CHART.JS — MOISTURE
// ============================================================
const mCtx = document.getElementById('moistureChart').getContext('2d');
const moistureChart = new Chart(mCtx, {
  type: 'line',
  data: {
    labels: labels,
    datasets: [
      {
        label: 'Sensor 1',
        data: hist_m1,
        borderColor: '#00e5ff',
        backgroundColor: 'rgba(0,229,255,0.06)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true
      },
      {
        label: 'Sensor 2',
        data: hist_m2,
        borderColor: '#39ff14',
        backgroundColor: 'rgba(57,255,20,0.05)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true
      },
      {
        label: 'Sensor 3',
        data: hist_m3,
        borderColor: '#ff9800',
        backgroundColor: 'rgba(255,152,0,0.05)',
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.4,
        fill: true
      }
    ]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    scales: {
      x: { display: false },
      y: {
        min: 0, max: 4095,
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#4a7fa5', font: { family: 'Share Tech Mono', size: 11 } }
      }
    },
    plugins: {
      legend: {
        labels: { color: '#cfe8ff', font: { family: 'Share Tech Mono', size: 11 } }
      }
    }
  }
});

// ============================================================
//  CHART.JS — RAIN
// ============================================================
const rCtx = document.getElementById('rainChart').getContext('2d');
const rainChart = new Chart(rCtx, {
  type: 'bar',
  data: {
    labels: labels,
    datasets: [{
      label: 'Rain Pulses',
      data: hist_rain,
      backgroundColor: 'rgba(0,229,255,0.3)',
      borderColor: '#00e5ff',
      borderWidth: 1,
      borderRadius: 3
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    scales: {
      x: { display: false },
      y: {
        min: 0,
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: '#4a7fa5', font: { family: 'Share Tech Mono', size: 11 } }
      }
    },
    plugins: {
      legend: {
        labels: { color: '#cfe8ff', font: { family: 'Share Tech Mono', size: 11 } }
      }
    }
  }
});

// ============================================================
//  RISK GAUGE
// ============================================================
function updateGauge(riskPct) {
  // riskPct: 0–1
  const totalLen = 220;
  const offset   = totalLen - (riskPct * totalLen);

  const fill   = document.getElementById('gaugeFill');
  const needle = document.getElementById('gaugeNeedle');
  const text   = document.getElementById('riskText');

  fill.style.strokeDashoffset = offset;

  // Needle: -90deg (left=low) to +90deg (right=high)
  const deg = -90 + riskPct * 180;
  needle.style.transform = `rotate(${deg}deg)`;

  if (riskPct < 0.35) {
    fill.style.stroke = '#39ff14';
    text.textContent = 'LOW';
    text.style.color = '#39ff14';
  } else if (riskPct < 0.65) {
    fill.style.stroke = '#ff9800';
    text.textContent = 'MODERATE';
    text.style.color = '#ff9800';
  } else if (riskPct < 0.85) {
    fill.style.stroke = '#ff5722';
    text.textContent = 'HIGH';
    text.style.color = '#ff5722';
  } else {
    fill.style.stroke = '#ff1744';
    text.textContent = 'CRITICAL';
    text.style.color = '#ff1744';
  }
}

// ============================================================
//  MOISTURE BAR HELPER
// ============================================================
function updateBar(barId, value) {
  const bar = document.getElementById(barId);
  const pct = (value / 4095) * 100;
  bar.style.width = pct + '%';
  bar.className = 'bar-fill ' +
    (pct < 35 ? 'level-low' : pct < 70 ? 'level-mid' : 'level-high');
}

// ============================================================
//  UPTIME TICKER
// ============================================================
setInterval(() => {
  const sec = Math.floor((Date.now() - startTime) / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  document.getElementById('uptimeVal').textContent =
    (h ? h + 'h ' : '') + (m ? m + 'm ' : '') + s + 's';
}, 1000);

// ============================================================
//  WEBSOCKET
// ============================================================
function initWS() {
  const wsConn = new WebSocket(`ws://${location.hostname}/ws`);
  const statusEl = document.getElementById('connStatus');

  wsConn.onopen = () => {
    statusEl.textContent = 'LIVE';
  };

  wsConn.onclose = () => {
    statusEl.textContent = 'RECONNECTING…';
    setTimeout(initWS, 3000);
  };

  wsConn.onerror = () => {
    statusEl.textContent = 'ERROR';
  };

  wsConn.onmessage = function(event) {
    const d = JSON.parse(event.data);
    packets++;
    document.getElementById('packetVal').textContent = packets;

    const now = new Date().toLocaleTimeString();

    // History
    labels.push(now);
    hist_m1.push(d.m1);
    hist_m2.push(d.m2);
    hist_m3.push(d.m3);
    hist_rain.push(d.rain);

    if (labels.length > MAX_HIST) {
      labels.shift(); hist_m1.shift(); hist_m2.shift(); hist_m3.shift(); hist_rain.shift();
    }

    moistureChart.update();
    rainChart.update();

    // Moisture bars
    document.getElementById('m1v').textContent = d.m1;
    document.getElementById('m2v').textContent = d.m2;
    document.getElementById('m3v').textContent = d.m3;
    updateBar('bar1', d.m1);
    updateBar('bar2', d.m2);
    updateBar('bar3', d.m3);

    // Average
    const avg = Math.round((d.m1 + d.m2 + d.m3) / 3);
    document.getElementById('avgMoisture').textContent = avg;

    // Rain
    document.getElementById('rainVal').textContent = d.rain;

    // GPS
    if (d.lat !== 0 && d.lng !== 0) {
      document.getElementById('latVal').textContent = d.lat.toFixed(6) + '° N';
      document.getElementById('lngVal').textContent = d.lng.toFixed(6) + '° E';
      const fixEl = document.getElementById('gpsFix');
      fixEl.textContent = 'GPS FIX OK';
      fixEl.className = 'gps-fix fix-ok';

      if (!marker) {
        marker = L.marker([d.lat, d.lng], { icon: customIcon }).addTo(map)
          .bindPopup('<b>ESP32 Sensor Node</b><br>' + d.lat.toFixed(6) + ', ' + d.lng.toFixed(6));
        circle = L.circle([d.lat, d.lng], {
          radius: 50,
          color: '#00e5ff',
          fillColor: '#00e5ff',
          fillOpacity: 0.1,
          weight: 1
        }).addTo(map);
        map.setView([d.lat, d.lng], 16);
      } else {
        marker.setLatLng([d.lat, d.lng]);
        circle.setLatLng([d.lat, d.lng]);
        if (lastLat !== d.lat || lastLng !== d.lng) {
          map.panTo([d.lat, d.lng]);
        }
      }
      lastLat = d.lat; lastLng = d.lng;
    }

    // GPS extras
    if (d.sats !== undefined) document.getElementById('satVal').textContent = d.sats;
    if (d.hdop !== undefined) document.getElementById('hdopVal').textContent = d.hdop;

    // Risk calculation
    const avgPct = avg / 4095;
    const rainFactor = Math.min(d.rain / 50, 1);
    const risk = avgPct * 0.7 + rainFactor * 0.3;
    updateGauge(Math.min(risk, 1));

    // Alert
    const banner = document.getElementById('alertBanner');
    if (risk > 0.75) {
      banner.style.display = 'block';
      document.getElementById('rainCard').classList.add('danger-glow');
    } else {
      banner.style.display = 'none';
      document.getElementById('rainCard').classList.remove('danger-glow');
    }
  };
}

initWS();
</script>
</body>
</html>
)rawliteral";

// ===== SEND DATA =====
void notifyClients() {
  StaticJsonDocument<256> doc;

  float lat = gps.location.isValid() ? gps.location.lat() : 0;
  float lng = gps.location.isValid() ? gps.location.lng() : 0;

  doc["lat"]  = lat;
  doc["lng"]  = lng;
  doc["m1"]   = analogRead(MOISTURE1);
  doc["m2"]   = analogRead(MOISTURE2);
  doc["m3"]   = analogRead(MOISTURE3);
  doc["rain"] = rainCount;

  // Optional GPS extras
  if (gps.satellites.isValid()) doc["sats"] = gps.satellites.value();
  if (gps.hdop.isValid())       doc["hdop"] = gps.hdop.hdop();

  String json;
  serializeJson(doc, json);
  ws.textAll(json);
}

void setup() {
  Serial.begin(115200);

  // GPS
  SerialGPS.begin(9600, SERIAL_8N1, 16, 17);

  // Rain sensor
  pinMode(RAIN_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(RAIN_PIN), rainPulse, FALLING);

  // WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nConnected!");
  Serial.println(WiFi.localIP());

  // WebSocket
  ws.onEvent([](AsyncWebSocket *server, AsyncWebSocketClient *client,
                AwsEventType type, void *arg, uint8_t *data, size_t len) {});
  server.addHandler(&ws);

  // Serve dashboard
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    request->send_P(200, "text/html", index_html);
  });

  server.begin();
}

unsigned long lastSend = 0;

void loop() {
  ws.cleanupClients();

  while (SerialGPS.available()) {
    gps.encode(SerialGPS.read());
  }

  if (millis() - lastSend > 1000) {
    notifyClients();
    lastSend = millis();
  }
}
