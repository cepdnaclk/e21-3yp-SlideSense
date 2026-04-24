#include <Arduino.h>
#include <TinyGPS++.h>

// -------------------- MOISTURE SENSORS --------------------
#define MOISTURE1_PIN 32
#define MOISTURE2_PIN 33
#define MOISTURE3_PIN 34

// Calibration values
const int dry1 = 3200, wet1 = 2000;
const int dry2 = 2600, wet2 = 1000;
const int dry3 = 2600, wet3 = 1000;

// -------------------- RAIN SENSOR --------------------
const float mmPerPulse = 0.173;
const int rainPin = 14;

volatile int tipCount = 0;
volatile unsigned long lastInterruptTime = 0;
const unsigned long debounceDelay = 200;

// -------------------- GPS --------------------
TinyGPSPlus gps;
HardwareSerial SerialGPS(2); // RX=16, TX=17

// -------------------- TILT SENSOR --------------------
const int tiltPin = 25;

// -------------------- INTERRUPT --------------------
void IRAM_ATTR countTip() {
  unsigned long currentTime = millis();
  if (currentTime - lastInterruptTime > debounceDelay) {
    tipCount++;
    lastInterruptTime = currentTime;
  }
}

// -------------------- SETUP --------------------
void setup() {
  Serial.begin(115200);

  // Moisture
  pinMode(MOISTURE1_PIN, INPUT);
  pinMode(MOISTURE2_PIN, INPUT);
  pinMode(MOISTURE3_PIN, INPUT);

  // Rain
  pinMode(rainPin, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(rainPin), countTip, FALLING);

  // Tilt
  pinMode(tiltPin, INPUT);

  // GPS
  SerialGPS.begin(9600, SERIAL_8N1, 16, 17);

  Serial.println("All Sensors Started...");
}

// -------------------- LOOP --------------------
void loop() {

  // -------- Moisture Sensors --------
  int val1 = analogRead(MOISTURE1_PIN);
  int val2 = analogRead(MOISTURE2_PIN);
  int val3 = analogRead(MOISTURE3_PIN);

  int m1 = constrain(map(val1, wet1, dry1, 100, 0), 0, 100);
  int m2 = constrain(map(val2, wet2, dry2, 100, 0), 0, 100);
  int m3 = constrain(map(val3, wet3, dry3, 100, 0), 0, 100);

  Serial.println("---- Moisture ----");
  Serial.printf("Sensor1: %d%% | Sensor2: %d%% | Sensor3: %d%%\n", m1, m2, m3);

  // -------- Rain Sensor --------
  float rainfall = tipCount * mmPerPulse;
  Serial.println("---- Rain ----");
  Serial.printf("Tips: %d | Rainfall: %.2f mm\n", tipCount, rainfall);

  // -------- Tilt Sensor --------
  Serial.println("---- Tilt ----");
  if (digitalRead(tiltPin) == HIGH) {
    Serial.println("Tilt Detected!");
  } else {
    Serial.println("No Tilt");
  }

  // -------- GPS --------
  while (SerialGPS.available()) {
    gps.encode(SerialGPS.read());
  }

  Serial.println("---- GPS ----");
  if (gps.location.isValid()) {
    Serial.print("Lat: ");
    Serial.println(gps.location.lat(), 6);
    Serial.print("Lng: ");
    Serial.println(gps.location.lng(), 6);
  } else {
    Serial.println("No GPS signal");
  }

  Serial.println("=========================\n");

  delay(2000);
}