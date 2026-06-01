// New stable pins
#define SIM808_RX 32 // Wired to D32
#define SIM808_TX 33 // Wired to D33

void setup() {
  Serial.begin(115200);
  Serial2.begin(9600, SERIAL_8N1, SIM808_RX, SIM808_TX);

  Serial.println("Booting up, dude. Give the SIM808 5 seconds to find the tower...");
  delay(5000); 

  Serial.println("\n--- STEP 1: HARDWARE SERIAL TEST ---");
  Serial.println("Pinging module with AT...");
  Serial2.println("AT");
  readModemResponse();

  Serial.println("\n--- STEP 2: SIGNAL STRENGTH TEST ---");
  Serial2.println("AT+CSQ");
  readModemResponse();

  Serial.println("\n--- STEP 3: NETWORK REGISTRATION TEST ---");
  Serial.println("Looking for +CREG: 0,1 (Registered) or +CREG: 0,5 (Roaming)");
  Serial2.println("AT+CREG?");
  readModemResponse();

  Serial.println("\n--- STEP 4: SMS MODE SETUP ---");
  Serial2.println("AT+CMGF=1");
  readModemResponse();

  Serial.println("\n--- STEP 5: SENDING SMS ---");
  String phoneNumber = "+94710176659";
  String message = "Hello, We are group 3 testing our GSM MOdule, You are recieving this from our GSM nodule!, If you recieve this please send a message to Sahandi";

  Serial.print("Targeting number: ");
  Serial.println(phoneNumber);
  
  // Initiate the SMS
  Serial2.print("AT+CMGS=\"");
  Serial2.print(phoneNumber);
  Serial2.println("\"");
  
  // Wait for the '>' prompt
  delay(1000);
  readModemResponse();

  Serial.println("Injecting payload and sending CTRL+Z...");
  Serial2.print(message);
  Serial2.write(26); // Send CTRL+Z
  
  // Wait 7 seconds for the network to transmit
  delay(7000);
  readModemResponse();

  Serial.println("\n--- DIAGNOSTICS COMPLETE ---");
  Serial.println("You can now type manual AT commands below.");
}

void loop() {
  // Read from SIM808 and print to PC
  while (Serial2.available()) {
    Serial.write(Serial2.read());
  }
  
  // Read from PC and send to SIM808
  while (Serial.available()) {
    // We use a while loop here to ensure the whole command is grabbed fast
    Serial2.write(Serial.read());
  }
}

// Helper function to read the modem's reply and print it clearly
void readModemResponse() {
  delay(800); // Wait for the SIM808 to finish processing
  String response = "";
  while (Serial2.available()) {
    char c = Serial2.read();
    response += c;
  }
  
  if (response.length() > 0) {
    Serial.print("MODEM REPLIED:\n");
    Serial.print(response);
  } else {
    Serial.println("ERROR: NO RESPONSE FROM MODEM! Check your RX/TX wiring and common ground.");
  }
}