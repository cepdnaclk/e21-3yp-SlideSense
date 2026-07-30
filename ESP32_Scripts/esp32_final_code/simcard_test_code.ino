#include <Arduino.h>

constexpr int SIM808_RX_PIN = 17;
constexpr int SIM808_TX_PIN = 16;
constexpr const char* GSM_APN = "mobitel";

HardwareSerial SerialGsm(2);

void drainSerial() {
  while (SerialGsm.available()) {
    SerialGsm.read();
  }
}

bool waitForToken(const char* token, uint32_t timeoutMs) {
  String response;
  uint32_t start = millis();

  while (millis() - start < timeoutMs) {
    while (SerialGsm.available()) {
      response += static_cast<char>(SerialGsm.read());
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
  drainSerial();
  Serial.print("AT -> ");
  Serial.println(command);
  SerialGsm.println(command);
  bool result = waitForToken(expected, timeoutMs);
  Serial.println(result ? "OK" : "FAIL");
  return result;
}

bool sendSMS(const char* phoneNumber, const char* message) {
  Serial.print("Sending SMS to ");
  Serial.println(phoneNumber);
  
  if (!sendAT("AT+CMGF=1", "OK", 2000)) {
    return false;
  }
  
  String cmd = "AT+CMGS=\"";
  cmd += phoneNumber;
  cmd += "\"";
  
  drainSerial();
  SerialGsm.println(cmd);
  
  if (waitForToken(">", 2000)) {
    SerialGsm.print(message);
    SerialGsm.write(26); // Ctrl+Z
    return waitForToken("OK", 20000);
  }
  
  return false;
}

void setup() {
  // Built-in LED for visual feedback since Serial won't be available
  pinMode(2, OUTPUT);
  digitalWrite(2, LOW);
  
  Serial.begin(115200);
  SerialGsm.begin(9600, SERIAL_8N1, SIM808_RX_PIN, SIM808_TX_PIN);
  
  Serial.println("Starting SIM module test...");
  
  // Give the module some time to boot up and find network
  for (int i = 0; i < 15; i++) {
    digitalWrite(2, HIGH);
    delay(500);
    digitalWrite(2, LOW);
    delay(500);
  }

  // Basic check
  sendAT("AT", "OK", 2000);
  sendAT("ATE0", "OK", 2000);
  
  // Setup GPRS connection
  sendAT("AT+SAPBR=3,1,\"Contype\",\"GPRS\"", "OK", 3000);
  String apnCommand = "AT+SAPBR=3,1,\"APN\",\"";
  apnCommand += GSM_APN;
  apnCommand += "\"";
  sendAT(apnCommand, "OK", 3000);

  // Try to connect to GPRS
  Serial.println("Connecting to GPRS...");
  bool gprsConnected = sendAT("AT+SAPBR=1,1", "OK", 15000);

  if (gprsConnected) {
    Serial.println("GPRS Connected Successfully!");
    
    // First number
    bool smsSent = sendSMS("+94742933946", "module is working");
    
    // If first fails, try second number
    if (!smsSent) {
      Serial.println("First SMS failed. Trying second number...");
      sendSMS("+94771119097", "module is working");
    } else {
      Serial.println("First SMS sent successfully.");
    }
  } else {
    Serial.println("Failed to connect to GPRS.");
  }
  
  // Test complete, turn on LED solid to indicate finished
  digitalWrite(2, HIGH);
}

void loop() {
  // Nothing to do
  delay(1000);
}
