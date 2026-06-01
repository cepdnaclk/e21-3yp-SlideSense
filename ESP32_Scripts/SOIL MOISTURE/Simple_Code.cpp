const int moisturePin = 32;

void setup() {
  Serial.begin(115200);
}

void loop() {
  int value = analogRead(moisturePin);
  Serial.println(value);
  delay(1000);
}