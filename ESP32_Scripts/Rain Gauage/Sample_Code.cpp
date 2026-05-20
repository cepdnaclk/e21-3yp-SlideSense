const float mmPerPulse = 0.173;

const int sensorPin = 14;

volatile int tipCount = 0;
volatile unsigned long lastInterruptTime = 0;

const unsigned long debounceDelay = 200; // milliseconds

void IRAM_ATTR countTip() {
  unsigned long currentTime = millis();

  // debounce check
  if (currentTime - lastInterruptTime > debounceDelay) {
    tipCount++;
    lastInterruptTime = currentTime;
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(sensorPin, INPUT_PULLUP);

  attachInterrupt(digitalPinToInterrupt(sensorPin), countTip, FALLING);
}

void loop() {
  static int lastCount = 0;

  if (tipCount != lastCount) {
    float totalRain = tipCount * mmPerPulse;

    Serial.print("Tips: ");
    Serial.print(tipCount);
    Serial.print("  Rainfall: ");
    Serial.print(totalRain);
    Serial.println(" mm");

    lastCount = tipCount;
  }

  delay(500);
}
