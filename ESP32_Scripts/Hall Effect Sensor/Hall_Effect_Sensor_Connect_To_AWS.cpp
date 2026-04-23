#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>

#define WIFI_SSID "Dialog 4G"
#define WIFI_PASSWORD "J63E5AH8Q2B"

#define SENSOR_PIN 21
#define LED_BUILTIN 2

// AWS IoT details
#define MQTT_BROKER "YOUR-ENDPOINT.iot.ap-south-1.amazonaws.com"
#define MQTT_TOPIC "rain/tipping"

// Certificates (paste from AWS)
const char* rootCA = R"EOF(
-----BEGIN CERTIFICATE-----
YOUR ROOT CA HERE
-----END CERTIFICATE-----
)EOF";

const char* deviceCert = R"EOF(
-----BEGIN CERTIFICATE-----
YOUR DEVICE CERT HERE
-----END CERTIFICATE-----
)EOF";

const char* privateKey = R"EOF(
-----BEGIN PRIVATE KEY-----
YOUR PRIVATE KEY HERE
-----END PRIVATE KEY-----
)EOF";

WiFiClientSecure secureClient;
PubSubClient client(secureClient);

int tipCount = 0;

void connectWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected");
}

void connectMQTT() {
  secureClient.setCACert(rootCA);
  secureClient.setCertificate(deviceCert);
  secureClient.setPrivateKey(privateKey);

  client.setServer(MQTT_BROKER, 8883);

  while (!client.connected()) {
    Serial.print("Connecting MQTT...");
    if (client.connect("ESP32_RainSensor")) {
      Serial.println("Connected!");
    } else {
      Serial.print("Failed, state=");
      Serial.println(client.state());
      delay(2000);
    }
  }
}

void setup() {
  Serial.begin(115200);

  pinMode(SENSOR_PIN, INPUT);
  pinMode(LED_BUILTIN, OUTPUT);

  connectWiFi();
  connectMQTT();

  Serial.println("System Ready");
}

void loop() {

  if (!client.connected()) {
    connectMQTT();
  }
  client.loop();

  int state = digitalRead(SENSOR_PIN);

  if (state == LOW) {
    tipCount++;

    Serial.print("Tip detected: ");
    Serial.println(tipCount);

    // Send MQTT message
    String payload = "{\"tips\": " + String(tipCount) + "}";

    client.publish(MQTT_TOPIC, payload.c_str());

    delay(500); // debounce
  }

  digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
  delay(300);
}
