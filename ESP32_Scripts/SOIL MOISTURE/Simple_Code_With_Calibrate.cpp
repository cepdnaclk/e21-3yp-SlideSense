#include <Arduino.h>

#define MOISTURE_SENSOR_PIN 34

const int dry = 2750;  // dry value (calibrate if needed)
const int wet = 970;   // wet value (calibrate if needed)

void setup() {
  Serial.begin(115200);

  pinMode(MOISTURE_SENSOR_PIN, INPUT);

  Serial.println("Soil Moisture Sensor Started (ESP32)");
}

void loop() {

  int sensorValue = analogRead(MOISTURE_SENSOR_PIN);

  float moisturePercent = map(sensorValue, wet, dry, 100, 0);

  Serial.print("Raw Value: ");
  Serial.print(sensorValue);

  Serial.print("  | Moisture: ");
  Serial.print(moisturePercent);
  Serial.println("%");

  delay(1000);  // update every second
}
