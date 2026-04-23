#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <TinyGPS++.h>

// ===== GPS =====
HardwareSerial SerialGPS(2);
TinyGPSPlus gps;

// ===== WiFi =====
const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";

// ===== AWS IoT =====
const char* mqtt_server = "YOUR_AWS_ENDPOINT";
const int mqtt_port = 8883;

// Topics
const char* topic = "esp32/gps";

WiFiClientSecure net;
PubSubClient client(net);

// AWS Certificates (paste here)
const char* root_ca = R"EOF(
-----BEGIN CERTIFICATE-----
YOUR_ROOT_CA
-----END CERTIFICATE-----
)EOF";

const char* cert = R"EOF(
YOUR_DEVICE_CERT
)EOF";

const char* key = R"EOF(
YOUR_PRIVATE_KEY
)EOF";

// ===== Connect WiFi =====
void connectWiFi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected");
}

// ===== MQTT reconnect =====
void reconnect() {
  while (!client.connected()) {
    Serial.print("Connecting to AWS IoT...");
    if (client.connect("ESP32_GPS")) {
      Serial.println("Connected!");
    } else {
      Serial.print("Failed, rc=");
      Serial.println(client.state());
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(9600);
  SerialGPS.begin(9600);

  connectWiFi();

  net.setCACert(root_ca);
  net.setCertificate(cert);
  net.setPrivateKey(key);

  client.setServer(mqtt_server, mqtt_port);

  Serial.println("GPS + AWS IoT Started");
}

void loop() {
  if (!client.connected()) reconnect();
  client.loop();

  while (SerialGPS.available()) {
    gps.encode(SerialGPS.read());

    if (gps.location.isUpdated()) {

      // Create JSON message
      String payload = "{";
      payload += "\"lat\":";
      payload += gps.location.lat();
      payload += ",\"lng\":";
      payload += gps.location.lng();
      payload += "}";

      Serial.println(payload);

      client.publish(topic, payload.c_str());
    }
  }
}
