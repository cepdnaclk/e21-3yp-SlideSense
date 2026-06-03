#define TINY_GSM_MODEM_SIM808

#include <TinyGsmClient.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <SSLClient.h> 
#include "trust_anchors.h" // Your generated Amazon Root CA array

// ==========================================
// 1. NETWORK & AWS CONFIGURATION
// ==========================================
// Verified Mobitel APN
const char apn[] = "mobitel"; 
const char gprsUser[] = "";
const char gprsPass[] = "";

// Your specific AWS IoT Endpoint 
const char* AWS_IOT_ENDPOINT = "a1cvrohkom2hp3-ats.iot.ap-south-1.amazonaws.com"; 
const char* MQTT_PUB_TOPIC = "probes/ls-probe-01/telemetry";

// AWS Device Certificate (xxx-certificate.pem.crt)
const char* AWS_CERT_CRT = R"EOF(-----BEGIN CERTIFICATE-----
... PASTE YOUR FULL DEVICE CERTIFICATE HERE ...
-----END CERTIFICATE-----)EOF";

// AWS Device Private Key (xxx-private.pem.key)
const char* AWS_CERT_PRIVATE = R"EOF(-----BEGIN RSA PRIVATE KEY-----
... PASTE YOUR FULL PRIVATE KEY HERE ...
-----END RSA PRIVATE KEY-----)EOF";

// ==========================================
// 2. HARDWARE & INSTANCE ARCHITECTURE
// ==========================================
// Verified stable pins
#define SIM808_RX 32 
#define SIM808_TX 33 

HardwareSerial SerialAT(2);
TinyGsm modem(SerialAT);
TinyGsmClient baseClient(modem);

// Wrap the basic cellular client in the SSL layer
SSLClient secureClient(baseClient, TAs, (size_t)TAs_NUM, 34, 1, SSLClient::SSL_ERROR);
PubSubClient client(secureClient);

void connectToInternet() {
    Serial.print("Waiting for Cellular Network...");
    if (!modem.waitForNetwork(600000L)) {
        Serial.println(" Failed. Retrying...");
        return;
    }
    Serial.println(" Connected to Cell Tower!");

    Serial.print("Connecting to APN: ");
    Serial.print(apn);
    if (!modem.gprsConnect(apn, gprsUser, gprsPass)) {
        Serial.println(" GPRS Connection Failed. Retrying...");
        return;
    }
    
    Serial.println("\n --> INTERNET TUNNEL OPEN! <-- \n");
}

void connectToAWS() {
    secureClient.setMutualAuthParams(AWS_CERT_CRT, AWS_CERT_PRIVATE);
    
    client.setServer(AWS_IOT_ENDPOINT, 8883);
    Serial.print("Connecting to AWS IoT Core (This takes 5-15 seconds)...");
    
    String clientId = "ls-probe-1";
    
    while (!client.connected()) {
        if (client.connect(clientId.c_str())) {
            Serial.println(" Connected to AWS IoT!");
        } else {
            Serial.print(" Failed, MQTT State: ");
            Serial.print(client.state());
            Serial.println(" - Retrying in 5 seconds...");
            delay(5000);
        }
    }
}

void setup() {
    Serial.begin(115200);
    SerialAT.begin(9600, SERIAL_8N1, SIM808_RX, SIM808_TX);
    
    Serial.println("Initializing SIM808 Modem, dude...");
    modem.restart();

    connectToInternet();
    connectToAWS();
}

void loop() {
    // Reconnect logic if the GPRS drops or AWS kicks the device
    if (!modem.isGprsConnected()) {
        connectToInternet();
    }
    if (!client.connected()) {
        connectToAWS();
    }
    client.loop();

    // Simulated landslide telemetry data
    unsigned long long deviceTimeMs = millis(); 
    float moisture = random(300, 650) / 10.0;     
    float tiltAngle = random(0, 150) / 10.0;       
    float vibrationMag = random(0, 50) / 100.0;    
    const char* samplingMode = "Normal";
    float rainfallMm = 4.2;
    const char* hwSerial = "2134324";

    // Build the JSON structure
    JsonDocument doc;
    doc["deviceTimeMs"] = deviceTimeMs;
    doc["moisture"] = moisture;
    doc["tiltAngle"] = tiltAngle;
    doc["vibrationMag"] = vibrationMag;
    doc["samplingMode"] = samplingMode;
    doc["rainfallMm"] = rainfallMm;
    doc["2134324"] = hwSerial;

    char jsonBuffer[512];
    serializeJson(doc, jsonBuffer);

    Serial.print("Publishing payload: ");
    Serial.println(jsonBuffer);
    
    // Broadcast the payload
    if(client.publish(MQTT_PUB_TOPIC, jsonBuffer)) {
        Serial.println("Publish Successful!");
    } else {
        Serial.println("Publish Failed.");
    }

    // Wait 10 seconds before transmitting the next reading
    delay(10000);
}