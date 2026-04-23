#include <Arduino.h>
#include <TinyGPS++.h>

HardwareSerial SerialGPS(2);  // UART2 (RX=16, TX=17)
TinyGPSPlus gps;

void setup() {
  Serial.begin(9600);        // Serial Monitor
  SerialGPS.begin(9600);     // GPS module
  Serial.println("GPS Test Started...");
}

void loop() {
  while (SerialGPS.available() > 0) {
    gps.encode(SerialGPS.read());

    if (gps.location.isUpdated()) {
      Serial.print("Latitude: ");
      Serial.println(gps.location.lat(), 6);

      Serial.print("Longitude: ");
      Serial.println(gps.location.lng(), 6);

      Serial.println("-------------------");
    }
  }

  // If no data coming at all
  if (millis() > 5000 && gps.charsProcessed() < 10) {
    Serial.println("❌ No GPS detected! Check wiring or power.");
    while (true);
  }
}
