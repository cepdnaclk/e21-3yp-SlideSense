#include <WiFi.h>
#include <PubSubClient.h>

const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASS";

const char* mqttServer = "YOUR_AWS_ENDPOINT";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  client.setServer(mqttServer, 1883);
}

void loop() {
  if (!client.connected()) {
    // reconnect logic
  }

  float rainfall = tipCount * 0.173;

  String payload = "{\"rainfall\": " + String(rainfall) + "}";

  client.publish("rain/data", payload.c_str());

  delay(5000); // send every 5 sec
}
