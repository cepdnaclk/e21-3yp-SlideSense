#include <Arduino.h>

#define SENSOR_PIN 21
#define LED_BUILTIN 2

int tipCount = 0;

void setup() {
  Serial.begin(115200);

  pinMode(SENSOR_PIN, INPUT);
  pinMode(LED_BUILTIN, OUTPUT);

  Serial.println("ESP32 Hall Sensor Started");
}

void loop() {

  int state = digitalRead(SENSOR_PIN);

  if (state == LOW) {
    tipCount++;

    Serial.print("Bucket Tipped! Count = ");
    Serial.println(tipCount);

    delay(300);  // prevent double counting
  }

  // simple blink to show it's running
  digitalWrite(LED_BUILTIN, HIGH);
  delay(200);
  digitalWrite(LED_BUILTIN, LOW);
  delay(200);
}
