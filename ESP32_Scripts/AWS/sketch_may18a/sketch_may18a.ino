#define TINY_GSM_MODEM_SIM808
#define TINY_GSM_RX_BUFFER 1024
#define TINY_GSM_DEBUG Serial

#include <TinyGsmClient.h>
#define MQTT_MAX_PACKET_SIZE 1024
#define MQTT_SOCKET_TIMEOUT 60
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <SSLClient.h>
#include "trust_anchors.h"

const char apn[] = "mobitel";
const char gprsUser[] = "";
const char gprsPass[] = "";
const char* AWS_IOT_ENDPOINT = "a1cvrohkom2hp3-ats.iot.ap-south-1.amazonaws.com";
const char* MQTT_PUB_TOPIC = "probes/ls-probe-01/telemetry";

const char* AWS_CERT_CRT = R"EOF(-----BEGIN CERTIFICATE-----
... PASTE YOUR FULL DEVICE CERTIFICATE HERE ...
-----END CERTIFICATE-----)EOF";

const char* AWS_CERT_PRIVATE = R"EOF(-----BEGIN RSA PRIVATE KEY-----
... PASTE YOUR FULL PRIVATE KEY HERE ...
-----END RSA PRIVATE KEY-----)EOF";

#define SIM808_RX 32
#define SIM808_TX 33

HardwareSerial SerialAT(2);
TinyGsm modem(SerialAT);
TinyGsmClient baseClient(modem, 0);
SSLClient secureClient(baseClient, TAs, (size_t)TAs_NUM, 35, 1, SSLClient::SSL_ERROR);
PubSubClient client(secureClient);

// ==========================================
// DIAGNOSTIC HELPER
// ==========================================
void printHeap(const char* label) {
    Serial.print("[MEM] ");
    Serial.print(label);
    Serial.print(" → Free heap: ");
    Serial.print(ESP.getFreeHeap());
    Serial.print(" bytes | Min ever: ");
    Serial.print(ESP.getMinFreeHeap());
    Serial.println(" bytes");
}

void printTiming(const char* label, unsigned long startMs) {
    unsigned long elapsed = millis() - startMs;
    Serial.print("[TIME] ");
    Serial.print(label);
    Serial.print(" → ");
    Serial.print(elapsed);
    Serial.println(" ms");
}

void printSignal() {
    int signal = modem.getSignalQuality();
    Serial.print("[SIGNAL] CSQ: ");
    Serial.print(signal);
    // CSQ 0-9: poor, 10-14: ok, 15-19: good, 20-31: excellent
    if (signal < 10)       Serial.println(" (POOR - this will cause timeouts)");
    else if (signal < 15)  Serial.println(" (OK)");
    else if (signal < 20)  Serial.println(" (GOOD)");
    else                   Serial.println(" (EXCELLENT)");
}

void printDivider(const char* title) {
    Serial.println("\n========================================");
    Serial.println(title);
    Serial.println("========================================");
}

// ==========================================
// NETWORK
// ==========================================
void connectToInternet() {
    printDivider("STAGE 1: CELLULAR CONNECTION");
    unsigned long stageStart = millis();

    printHeap("Before network connect");

    Serial.print("[NET] Waiting for network...");
    unsigned long t = millis();
    if (!modem.waitForNetwork(600000L)) {
        Serial.println(" FAILED");
        return;
    }
    printTiming("Network registration", t);
    printSignal();

    Serial.print("[NET] Connecting to APN: ");
    Serial.println(apn);
    t = millis();
    if (!modem.gprsConnect(apn, gprsUser, gprsPass)) {
        Serial.println("[NET] GPRS FAILED");
        return;
    }
    printTiming("GPRS connect", t);

    Serial.print("[NET] Local IP: ");
    Serial.println(modem.localIP());

    printHeap("After GPRS connect");
    printTiming("TOTAL Stage 1", stageStart);

    // ==========================================
    // SIM808 TCP CONFIGURATION
    // ==========================================
    Serial.println("[NET] Configuring SIM808 TCP layer...");

    // Shut any existing connections cleanly
    SerialAT.println("AT+CIPSHUT");
    delay(2000);
    while(SerialAT.available()) {
        Serial.write(SerialAT.read());
    }

    // Set GPRS context
    SerialAT.println("AT+CIPCSGP=1,\"mobitel\"");
    delay(1000);
    while(SerialAT.available()) {
        Serial.write(SerialAT.read());
    }

    // Set TCP timeout to maximum 600 seconds
    SerialAT.println("AT+CIPSTO=600");
    delay(1000);
    while(SerialAT.available()) {
        Serial.write(SerialAT.read());
    }
    Serial.println("[NET] TCP timeout set to 600s");

    // Enable receive mode for large packets
    SerialAT.println("AT+CIPRXGET=1");
    delay(500);
    while(SerialAT.available()) {
        Serial.write(SerialAT.read());
    }

    // Set max packet size to 1460 bytes (maximum for SIM808)
    SerialAT.println("AT+CIPQSEND=1");
    delay(500);
    while(SerialAT.available()) {
        Serial.write(SerialAT.read());
    }
    Serial.println("[NET] Quick send mode enabled");

    // Print current TCP config for diagnostics
    Serial.println("[NET] Current TCP config:");
    SerialAT.println("AT+CIPSTO?");
    delay(500);
    while(SerialAT.available()) {
        Serial.write(SerialAT.read());
    }

    printHeap("After TCP config");
    Serial.println("[NET] Stabilizing modem (10s)...");
    delay(10000);

    Serial.println("[NET] --> INTERNET TUNNEL OPEN AND CONFIGURED <--");
}

// ==========================================
// SSL CONNECT
// ==========================================
void connectToAWS() {
   printDivider("STAGE 2: SSL + MQTT HANDSHAKE");
    unsigned long stageStart = millis();

    // Tell modem to keep TCP alive aggressively
    SerialAT.println("AT+CIPKA=1,30");  // Keepalive every 30 seconds
    delay(500);
    while(SerialAT.available()) {
        Serial.write(SerialAT.read());
    }
    printDivider("STAGE 2: SSL + MQTT HANDSHAKE");
    unsigned long stageStart = millis();

    printHeap("Before SSL handshake");
    printSignal();

    Serial.println("[SSL] Starting TCP connection to AWS endpoint...");
    unsigned long t = millis();

    // This is where SSL handshake happens internally
    bool mqttResult = client.connect("ls-probe-1");
    printTiming("SSL+MQTT handshake attempt", t);
    printHeap("After SSL handshake attempt");

    if (mqttResult) {
        Serial.println("[MQTT] ✓ Connected to AWS IoT!");
        printTiming("TOTAL Stage 2 SUCCESS", stageStart);
    } else {
        Serial.print("[MQTT] ✗ Failed. State: ");
        int state = client.state();
        Serial.println(state);

        // Decode MQTT state
        switch(state) {
            case -4: Serial.println("[MQTT] State -4: TIMEOUT - SSL handshake took too long"); break;
            case -3: Serial.println("[MQTT] State -3: LOST - connection dropped mid-handshake"); break;
            case -2: Serial.println("[MQTT] State -2: FAILED - SSL layer rejected (cert/TLS issue)"); break;
            case -1: Serial.println("[MQTT] State -1: DISCONNECTED"); break;
            case  1: Serial.println("[MQTT] State  1: BAD PROTOCOL"); break;
            case  2: Serial.println("[MQTT] State  2: BAD CLIENT ID"); break;
            case  3: Serial.println("[MQTT] State  3: UNAVAILABLE"); break;
            case  4: Serial.println("[MQTT] State  4: BAD CREDENTIALS"); break;
            case  5: Serial.println("[MQTT] State  5: UNAUTHORIZED"); break;
        }

        printTiming("TOTAL Stage 2 FAILED", stageStart);

        Serial.println("[SSL] Resetting SSL layer...");
        secureClient.stop();
        delay(10000);
    }
}

// ==========================================
// SETUP
// ==========================================
void setup() {
    Serial.begin(115200);
    delay(1000);

    printDivider("STAGE 0: BOOT DIAGNOSTICS");

    // ESP32 chip info
    Serial.print("[HW] CPU Frequency: ");
    Serial.print(getCpuFrequencyMhz());
    Serial.println(" MHz");

    Serial.print("[HW] Flash size: ");
    Serial.print(ESP.getFlashChipSize() / 1024 / 1024);
    Serial.println(" MB");

    Serial.print("[HW] Sketch size: ");
    Serial.print(ESP.getSketchSize());
    Serial.println(" bytes");

    Serial.print("[HW] Free sketch space: ");
    Serial.print(ESP.getFreeSketchSpace());
    Serial.println(" bytes");

    printHeap("Boot");

    // Modem init
    Serial.println("[MODEM] Starting SerialAT at 9600...");
    SerialAT.begin(9600, SERIAL_8N1, SIM808_RX, SIM808_TX);
    delay(3000);

    Serial.println("[MODEM] Restarting modem...");
    unsigned long t = millis();
    modem.restart();
    printTiming("Modem restart", t);

    Serial.print("[MODEM] Firmware: ");
    Serial.println(modem.getModemInfo());

    // Baud bump
    Serial.println("[MODEM] Bumping baud to 57600...");
    modem.setBaud(57600);
    SerialAT.begin(57600, SERIAL_8N1, SIM808_RX, SIM808_TX);
    delay(1000);
    Serial.println("[MODEM] Baud set to 57600");

    printHeap("Before SSL param setup");

    // SSL setup timing
    Serial.println("[SSL] Building SSLClientParameters from PEM...");
    t = millis();
    SSLClientParameters mTLS = SSLClientParameters::fromPEM(
        AWS_CERT_CRT, strlen(AWS_CERT_CRT),
        AWS_CERT_PRIVATE, strlen(AWS_CERT_PRIVATE)
    );
    printTiming("SSLClientParameters::fromPEM()", t);
    printHeap("After fromPEM");

    Serial.println("[SSL] Setting mutual auth params...");
    t = millis();
    secureClient.setMutualAuthParams(mTLS);
    printTiming("setMutualAuthParams()", t);
    printHeap("After setMutualAuthParams");

    secureClient.setTimeout(60000);
    client.setServer(AWS_IOT_ENDPOINT, 8883);
    client.setSocketTimeout(60);

    Serial.println("[SSL] SSL layer configured.");
    printHeap("SSL fully configured");

    connectToInternet();
    connectToAWS();
}

// ==========================================
// LOOP
// ==========================================
void loop() {
    if (!modem.isGprsConnected()) {
        Serial.println("[LOOP] GPRS dropped!");
        connectToInternet();
        connectToAWS();
        return;
    }

    if (!client.connected()) {
        Serial.println("[LOOP] MQTT dropped!");
        connectToAWS();
        return;
    }

    client.loop();

    unsigned long deviceTimeMs = millis();
    float moisture = random(300, 650) / 10.0;
    float tiltAngle = random(0, 150) / 10.0;
    float vibrationMag = random(0, 50) / 100.0;
    const char* samplingMode = "Normal";
    float rainfallMm = 4.2;
    const char* hwSerial = "2134324";

    JsonDocument doc;
    doc["deviceTimeMs"] = deviceTimeMs;
    doc["moisture"] = moisture;
    doc["tiltAngle"] = tiltAngle;
    doc["vibrationMag"] = vibrationMag;
    doc["samplingMode"] = samplingMode;
    doc["rainfallMm"] = rainfallMm;
    doc["hwSerial"] = hwSerial;

    char jsonBuffer[512];
    serializeJson(doc, jsonBuffer);

    Serial.print("[MQTT] Publishing: ");
    Serial.println(jsonBuffer);

    unsigned long t = millis();
    if (client.publish(MQTT_PUB_TOPIC, jsonBuffer)) {
        Serial.print("[MQTT] Publish successful! ");
        printTiming("Publish time", t);
    } else {
        Serial.println("[MQTT] Publish FAILED");
    }

    delay(10000);
}