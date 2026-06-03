// Define safe, general-purpose pins for the ESP32
#define MODEM_RX 32 
#define MODEM_TX 33 

void setup() {
  // Start the serial connection to your computer
  Serial.begin(115200);
  
  // Start the hardware serial connection to the SIM module
  Serial2.begin(9600, SERIAL_8N1, MODEM_RX, MODEM_TX);

  Serial.println("Booting up, dude. Give it a few seconds...");
  delay(3000); 

  Serial.println("Ready! Type your AT commands in the Serial Monitor above.");
  Serial.println("Make sure the dropdown is set to 'Both NL & CR' and '115200 baud'.");
}

void loop() {
  // Read any incoming text from the SIM module and print it to your screen
  while (Serial2.available()) {
    Serial.write(Serial2.read());
  }
  
  // Read any text you type in the Serial Monitor and send it to the SIM module
  while (Serial.available()) {
    Serial2.write(Serial.read());
  }
}