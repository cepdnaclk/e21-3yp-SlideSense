#include <Arduino.h>
#include <ArduinoJson.h>
#include <TinyGPS++.h>

// =========================
// TUNABLE INTERVALS
// =========================
constexpr uint32_t POLLING_INTERVAL_MS = 2000;
constexpr uint32_t PUBLISH_INTERVAL_MS = 10000;

// Each hall-effect pulse represents one bucket tip.
// Keep this configurable in case the rain gauge is recalibrated.
constexpr float RAIN_MM_PER_TIP = 0.173f;
constexpr uint32_t RAIN_DEBOUNCE_MS = 200;

// Moisture calibration values. Update after field calibration.
constexpr int MOISTURE_RAW_DRY = 3200;
constexpr int MOISTURE_RAW_WET = 1400;

// Hardware wiring.
constexpr int SIM808_RX_PIN = 17; // Updated
constexpr int SIM808_TX_PIN = 16; // Updated
constexpr int GPS_RX_PIN = 25;    // Swapped to avoid conflict
constexpr int GPS_TX_PIN = 26;    // Swapped to avoid conflict
constexpr int MOISTURE_PIN = 34;
constexpr int RAIN_PIN = 27;

// HTTP target. Replace API_HOST with the backend host or IP.
// This path matches the HTTP ingestion endpoint added to the backend.
constexpr const char* API_HOST = "3.111.133.133";
constexpr uint16_t API_PORT = 80;
constexpr const char* API_PATH = "/ingestion/http";
constexpr const char* GSM_APN = "mobitel";
constexpr const char* BRIDGE_SECRET = "278075eb4912a22ff8c6590ddc69adc4ac9f9fd47ee9fdbb31da755433c863db";
constexpr const char* PROBE_ID = "P-TEST-01";
constexpr const char* HW_SERIAL = "ESP32-WROOM-32D-01";

// =========================
// SERIAL PORTS AND GPS
// =========================
HardwareSerial SerialGsm(2);
HardwareSerial SerialGps(1);
TinyGPSPlus gps;

// =========================
// SENSOR STATE SHARED ACROSS CORES
// =========================
struct SensorSnapshot {
  uint64_t deviceTimeMs;
  float moisture;
  float tiltAngle;
  float vibrationMag;
  float rainfallMm;
  uint32_t tipCount;
  float totalRainfallMm;
  uint32_t sequence;
};

constexpr size_t HISTORY_SIZE = 16;

SensorSnapshot latestSnapshot{};
SensorSnapshot historyBuffer[HISTORY_SIZE];
size_t historyHead = 0;
size_t historyCount = 0;

SemaphoreHandle_t stateMutex = nullptr;

volatile uint32_t rainTipCount = 0;
volatile uint32_t lastRainInterruptMs = 0;

struct GpsClockState {
  bool valid = false;
  uint64_t epochMs = 0;
  uint32_t syncedAtMillis = 0;
};

GpsClockState gpsClockState;

// =========================
// HELPERS
// =========================
void IRAM_ATTR countRainTip() {
  uint32_t now = millis();
  if (now - lastRainInterruptMs >= RAIN_DEBOUNCE_MS) {
    rainTipCount++;
    lastRainInterruptMs = now;
  }
}

static int64_t daysFromCivil(int year, unsigned month, unsigned day) {
  year -= month <= 2;
  const int era = (year >= 0 ? year : year - 399) / 400;
  const unsigned yearOfEra = static_cast<unsigned>(year - era * 400);
  const unsigned dayOfYear = (153 * (month + (month > 2 ? -3 : 9)) + 2) / 5 + day - 1;
  const unsigned dayOfEra = yearOfEra * 365 + yearOfEra / 4 - yearOfEra / 100 + dayOfYear;
  return static_cast<int64_t>(era) * 146097 + static_cast<int64_t>(dayOfEra) - 719468;
}

uint64_t gpsToEpochMs() {
  if (!gps.date.isValid() || !gps.time.isValid()) {
    return 0;
  }

  int year = gps.date.year();
  unsigned month = gps.date.month();
  unsigned day = gps.date.day();
  int hour = gps.time.hour();
  int minute = gps.time.minute();
  int second = gps.time.second();
  int centisecond = gps.time.centisecond();

  int64_t days = daysFromCivil(year, month, day);
  int64_t seconds = days * 86400LL + hour * 3600LL + minute * 60LL + second;
  return static_cast<uint64_t>(seconds) * 1000ULL + static_cast<uint64_t>(centisecond) * 10ULL;
}

uint64_t currentDeviceTimeMs() {
  if (gpsClockState.valid) {
    return gpsClockState.epochMs + (static_cast<uint64_t>(millis()) - gpsClockState.syncedAtMillis);
  }
  return static_cast<uint64_t>(millis());
}

float readMoisturePercent() {
  int raw = analogRead(MOISTURE_PIN);
  float percent = (static_cast<float>(MOISTURE_RAW_DRY - raw) * 100.0f) /
                  static_cast<float>(MOISTURE_RAW_DRY - MOISTURE_RAW_WET);
  if (percent < 0.0f) percent = 0.0f;
  if (percent > 100.0f) percent = 100.0f;
  return percent;
}

void pushSnapshotToHistory(const SensorSnapshot& snapshot) {
  if (historyCount < HISTORY_SIZE) {
    historyCount++;
  }
  historyBuffer[historyHead] = snapshot;
  historyHead = (historyHead + 1) % HISTORY_SIZE;
}

void updateGpsClock() {
  uint64_t epochMs = gpsToEpochMs();
  if (epochMs != 0) {
    gpsClockState.valid = true;
    gpsClockState.epochMs = epochMs;
    gpsClockState.syncedAtMillis = millis();
  }
}

void drainSerial(HardwareSerial& serialPort) {
  while (serialPort.available()) {
    serialPort.read();
  }
}

bool waitForToken(HardwareSerial& serialPort, const char* token, uint32_t timeoutMs) {
  String response;
  uint32_t start = millis();

  while (millis() - start < timeoutMs) {
    while (serialPort.available()) {
      response += static_cast<char>(serialPort.read());
      if (response.indexOf(token) >= 0) {
        return true;
      }
      if (response.indexOf("ERROR") >= 0) {
        return false;
      }
    }
    delay(10);
  }

  return response.indexOf(token) >= 0;
}

bool sendAT(const String& command, const char* expected, uint32_t timeoutMs) {
  drainSerial(SerialGsm);
  Serial.print("[MODEM] AT -> ");
  Serial.println(command);
  SerialGsm.println(command);
  bool ok = waitForToken(SerialGsm, expected, timeoutMs);
  Serial.print("[MODEM] Result: ");
  Serial.println(ok ? "OK" : "FAIL");
  return ok;
}

bool gsmInit() {
  Serial.println("[MODEM] Initializing SIM808 data session...");
  if (!sendAT("AT", "OK", 2000)) {
    Serial.println("[MODEM] SIM808 not responding");
    return false;
  }
  sendAT("ATE0", "OK", 2000);
  sendAT("AT+CMEE=2", "OK", 2000);
  sendAT("AT+SAPBR=3,1,\"Contype\",\"GPRS\"", "OK", 3000);

  String apnCommand = "AT+SAPBR=3,1,\"APN\",\"";
  apnCommand += GSM_APN;
  apnCommand += "\"";
  sendAT(apnCommand, "OK", 3000);

  sendAT("AT+SAPBR=1,1", "OK", 15000);
  sendAT("AT+SAPBR=2,1", "OK", 5000);
  Serial.println("[MODEM] SIM808 ready for HTTP publish");
  return true;
}

bool postJsonPayload(const String& jsonPayload) {
  Serial.print("[PUBLISH] Payload bytes: ");
  Serial.println(jsonPayload.length());

  if (!sendAT("AT+CIPSHUT", "SHUT OK", 10000)) {
    // Some SIM808 firmwares return ERROR when no PDP context is active.
    // That is acceptable, so continue.
  }

  sendAT("AT+CIPMUX=0", "OK", 3000);
  sendAT("AT+CIPMODE=0", "OK", 3000);

  String startCommand = "AT+CIPSTART=\"TCP\",\"";
  startCommand += API_HOST;
  startCommand += "\",";
  startCommand += API_PORT;

  Serial.print("[PUBLISH] Connecting to ");
  Serial.print(API_HOST);
  Serial.print(":");
  Serial.println(API_PORT);

  if (!sendAT(startCommand, "CONNECT OK", 20000)) {
    Serial.println("[PUBLISH] TCP connection failed");
    return false;
  }

  String httpRequest;
  httpRequest.reserve(jsonPayload.length() + 256);
  httpRequest += "POST ";
  httpRequest += API_PATH;
  httpRequest += " HTTP/1.1\r\nHost: ";
  httpRequest += API_HOST;
  httpRequest += "\r\nX-Bridge-Secret: ";
  httpRequest += BRIDGE_SECRET;
  httpRequest += "\r\nContent-Type: application/json\r\nConnection: close\r\nContent-Length: ";
  httpRequest += jsonPayload.length();
  httpRequest += "\r\n\r\n";
  httpRequest += jsonPayload;

  String sendCommand = "AT+CIPSEND=";
  sendCommand += httpRequest.length();
  if (!sendAT(sendCommand, ">", 5000)) {
    Serial.println("[PUBLISH] CIPSEND prompt not received");
    sendAT("AT+CIPCLOSE", "CLOSE OK", 5000);
    return false;
  }

  Serial.println("[PUBLISH] Exact HTTP packet:");
  Serial.print(httpRequest);
  Serial.println();
  Serial.println("[PUBLISH] Sending HTTP POST request");
  SerialGsm.print(httpRequest);

  bool sent = waitForToken(SerialGsm, "SEND OK", 10000);
  Serial.println(sent ? "[PUBLISH] HTTP request sent" : "[PUBLISH] HTTP send failed");
  waitForToken(SerialGsm, "CLOSED", 3000);
  sendAT("AT+CIPCLOSE", "CLOSE OK", 5000);
  return sent;
}

String buildPayload(const SensorSnapshot& snapshot) {
  StaticJsonDocument<256> doc;
  doc["probe_id"] = PROBE_ID;
  doc["deviceTimeMs"] = snapshot.deviceTimeMs;
  doc["moisture"] = snapshot.moisture;
  doc["tiltAngle"] = snapshot.tiltAngle;
  doc["vibrationMag"] = snapshot.vibrationMag;
  doc["samplingMode"] = "Normal";
  doc["rainfallMm"] = snapshot.totalRainfallMm;
  doc["hwSerial"] = HW_SERIAL;

  String jsonPayload;
  serializeJson(doc, jsonPayload);
  return jsonPayload;
}

void sensorTask(void* parameter) {
  (void)parameter;

  uint32_t sequence = 0;
  Serial.println("[INIT] Core 1 polling task initialized");

  for (;;) {
    while (SerialGps.available()) {
      gps.encode(SerialGps.read());
      if (gps.location.isUpdated() || gps.date.isUpdated() || gps.time.isUpdated()) {
        updateGpsClock();
        Serial.println("[GPS] Time fix updated");
      }
    }

    uint32_t tipCountSnapshot;
    noInterrupts();
    tipCountSnapshot = rainTipCount;
    interrupts();

    SensorSnapshot snapshot{};
    snapshot.deviceTimeMs = currentDeviceTimeMs();
    snapshot.moisture = readMoisturePercent();
    snapshot.tiltAngle = 0.0f;
    snapshot.vibrationMag = 0.0f;
    snapshot.tipCount = tipCountSnapshot;
    snapshot.totalRainfallMm = static_cast<float>(tipCountSnapshot) * RAIN_MM_PER_TIP;
    snapshot.rainfallMm = snapshot.totalRainfallMm;
    snapshot.sequence = ++sequence;

    Serial.printf(
      "[SENSOR] seq=%lu moisture=%.2f%% tips=%lu rainfall=%.3fmm timeMs=%llu\n",
      static_cast<unsigned long>(snapshot.sequence),
      snapshot.moisture,
      static_cast<unsigned long>(snapshot.tipCount),
      snapshot.totalRainfallMm,
      static_cast<unsigned long long>(snapshot.deviceTimeMs)
    );

    if (xSemaphoreTake(stateMutex, portMAX_DELAY) == pdTRUE) {
      latestSnapshot = snapshot;
      pushSnapshotToHistory(snapshot);
      xSemaphoreGive(stateMutex);
    }

    vTaskDelay(pdMS_TO_TICKS(POLLING_INTERVAL_MS));
  }
}

void publishTask(void* parameter) {
  (void)parameter;

  Serial.println("[INIT] Core 0 publishing task initialized");
  bool gsmReady = gsmInit();
  uint8_t packetsSent = 0; // New counter to track successful transmissions

  for (;;) {
    // Check if we hit the 10 packet limit
    if (packetsSent >= 10) {
      Serial.println("[PUBLISH] Reached maximum of 10 test packets. Stopping publish task.");
      vTaskDelete(nullptr); // Safely terminates this FreeRTOS task
    }

    SensorSnapshot snapshot;
    if (xSemaphoreTake(stateMutex, portMAX_DELAY) == pdTRUE) {
      snapshot = latestSnapshot;
      xSemaphoreGive(stateMutex);
    }

    if (!gsmReady) {
      Serial.println("[PUBLISH] GSM session not ready, retrying init");
      gsmReady = gsmInit();
    }

    if (gsmReady) {
      String payload = buildPayload(snapshot);
      Serial.print("[PUBLISH] Posting seq=");
      Serial.println(snapshot.sequence);
      if (!postJsonPayload(payload)) {
        Serial.println("[PUBLISH] Publish failed, will re-init modem next cycle");
        gsmReady = false;
      } else {
        Serial.println("[PUBLISH] Publish complete");
        packetsSent++; // Increment the counter upon success
        Serial.printf("[PUBLISH] Packets sent: %d/10\n", packetsSent);
      }
    }

    vTaskDelay(pdMS_TO_TICKS(PUBLISH_INTERVAL_MS));
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("[BOOT] SlideSense ESP32 logger starting");
  Serial.printf("[BOOT] Poll interval: %lu ms, publish interval: %lu ms\n", POLLING_INTERVAL_MS, PUBLISH_INTERVAL_MS);

  pinMode(MOISTURE_PIN, INPUT);
  analogReadResolution(12);
  analogSetPinAttenuation(MOISTURE_PIN, ADC_11db);

  pinMode(RAIN_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(RAIN_PIN), countRainTip, FALLING);

  SerialGsm.begin(9600, SERIAL_8N1, SIM808_RX_PIN, SIM808_TX_PIN);
  SerialGps.begin(9600, SERIAL_8N1, GPS_RX_PIN, GPS_TX_PIN);
  Serial.println("[BOOT] Serial links for SIM808 and GPS initialized");

  stateMutex = xSemaphoreCreateMutex();
  if (stateMutex == nullptr) {
    Serial.println("[BOOT] Failed to create mutex");
    while (true) {
      delay(1000);
    }
  }

  Serial.println("[BOOT] Starting FreeRTOS tasks on separate cores");
  xTaskCreatePinnedToCore(sensorTask, "sensorTask", 8192, nullptr, 2, nullptr, 1);
  xTaskCreatePinnedToCore(publishTask, "publishTask", 12288, nullptr, 1, nullptr, 0);
  Serial.println("[BOOT] Sensor polling pinned to core 1, publishing pinned to core 0");
}

void loop() {
  vTaskDelay(portMAX_DELAY);
}