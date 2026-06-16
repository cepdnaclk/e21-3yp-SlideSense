const int micPin = 34;

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);

  Serial.println("KY-037 Peak-to-Peak Test");
}

void loop() {
  int minVal = 4095;
  int maxVal = 0;

  unsigned long startTime = millis();

  while (millis() - startTime < 100) {
    int val = analogRead(micPin);

    if (val < minVal)
      minVal = val;

    if (val > maxVal)
      maxVal = val;
  }

  Serial.print("Min: ");
  Serial.print(minVal);

  Serial.print("  Max: ");
  Serial.print(maxVal);

  Serial.print("  Peak-to-Peak: ");
  Serial.println(maxVal - minVal);

  delay(100);
}