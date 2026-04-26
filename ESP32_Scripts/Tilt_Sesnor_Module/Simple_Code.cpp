const int tiltPin = 25; 

void setup() {
  Serial.begin(115200);
  pinMode(tiltPin, INPUT);
}

void loop() {
  int state = digitalRead(tiltPin);

  if (state == HIGH) {
    Serial.println("Tilt Detected!");
  } else {
    Serial.println("No Tilt");
  }

  delay(500);
}
