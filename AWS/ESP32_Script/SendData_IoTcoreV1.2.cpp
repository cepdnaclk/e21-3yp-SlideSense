#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <TinyGPS++.h>
#include <ArduinoJson.h> 

// WiFi Credentials
const char* ssid = "SLT-Fiber-E49E";
const char* password = "0773918058A";

// AWS IoT Details
const char* awsEndpoint = "a1cvrohkom2hp3-ats.iot.ap-south-1.amazonaws.com";
const char* topic = "LandslideProject/Prob01";
const char* thingName = "LandslideProbe01"; 

// --- SENSOR CONFIGURATION ---
#define MOISTURE1_PIN 32
#define MOISTURE2_PIN 33
#define MOISTURE3_PIN 34
#define MIC_PIN 36

const int dry1 = 3200, wet1 = 2000;
const int dry2 = 2600, wet2 = 1000;
const int dry3 = 2600, wet3 = 1000;

const float mmPerPulse = 0.173;
const int rainPin = 14;
const int tiltPin = 25;

volatile int tipCount = 0;
volatile unsigned long lastInterruptTime = 0;
const unsigned long debounceDelay = 200;

TinyGPSPlus gps;
HardwareSerial SerialGPS(2); 

WiFiClientSecure net;
PubSubClient client(net);

// --- CERTIFICATES (Using your verified working ones) ---
const char* deviceCert = R"EOF( -----BEGIN CERTIFICATE-----
MIIDWTCCAkGgAwIBAgIUS82uTtedQYKjpkc7pA0lLgOhS7gwDQYJKoZIhvcNAQEL
BQAwTTFLMEkGA1UECwxCQW1hem9uIFdlYiBTZXJ2aWNlcyBPPUFtYXpvbi5jb20g
SW5jLiBMPVNlYXR0bGUgU1Q9V2FzaGluZ3RvbiBDPVVTMB4XDTI2MDQyNDE5Mjgz
MloXDTQ5MTIzMTIzNTk1OVowHjEcMBoGA1UEAwwTQVdTIElvVCBDZXJ0aWZpY2F0
ZTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALpos4OvSQSx767/dHiH
cMUIHtcBjuuqy3FzG8YXWtyxe5d+rlgghnCI9zZWBbxyoaZf/uOU6cHTVYuMxWS7
BDvJUTgqi0y/f6ZdkD40o0Vwf1ag+y0ujO8I/ILPQni/1RyY2CHJpfHWxMqJaA1w
GCJyTJTd2lr3uBGX3+YF0SdD8fcYva9oqqxFEn0tVDpb1t+83rtyT5T2ETaXemfo
tivGLsGPpFLlYNm1WLjjSoSKCiYb1HTmEUev7hgkqndDCh4DKtOz+9zHfmq2p77p
6mmuYdmBnvsGwPgHe7qFWd01KhVNG3oRQAT9xpoOIH5lfLpnOhjlD3zQj6Rt6sTQ
7AkCAwEAAaNgMF4wHwYDVR0jBBgwFoAUQuODMI/W5uMyoFs2tqOFn2uCONEwHQYD
VR0OBBYEFH7FMtxbMAStmA0wuw+PsKlv/RIoMAwGA1UdEwEB/wQCMAAwDgYDVR0P
AQH/BAQDAgeAMA0GCSqGSIb3DQEBCwUAA4IBAQBg0lx8+0f0a4O7XOLuPGfjqAss
CYNabrT+xTKTXTKdR6sGGCxgOQPbN9QGlXKYceTtx9BtrOqcZmn1dIDIEFGx0/Cd
I4vroWAUhgURJEHWMFBvsHLtqledR4ZypMCEnufBOAonCO6iyttCWd5nATKVbo6D
CNRTRZ0DKRcIYZjXeVtN8QU+1M00KaNyAmBrwtqFmNw/48X3eMrCqoYql3X91fMq
J1HDykOmL4dbBfScDjY+7jCAGvgLv8BgNzwz1i94sXLbuHJAKgXrNqXCE15A1yUB
TqvLN1KLiSUjksRJAowPs4yQp80YU0VbVWN+CoU6tocM1q80gN0ixWJT6AzX
-----END CERTIFICATE-----
 )EOF"; 

const char* rootCA = R"EOF( -----BEGIN CERTIFICATE-----
MIIDQTCCAimgAwIBAgITBmyfz5m/jAo54vB4ikPmljZbyjANBgkqhkiG9w0BAQsF
ADA5MQswCQYDVQQGEwJVUzEPMA0GA1UEChMGQW1hem9uMRkwFwYDVQQDExBBbWF6
b24gUm9vdCBDQSAxMB4XDTE1MDUyNjAwMDAwMFoXDTM4MDExNzAwMDAwMFowOTEL
MAkGA1UEBhMCVVMxDzANBgNVBAoTBkFtYXpvbjEZMBcGA1UEAxMQQW1hem9uIFJv
b3QgQ0EgMTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBALJ4gHHKeNXj
ca9HgFB0fW7Y14h29Jlo91ghYPl0hAEvrAIthtOgQ3pOsqTQNroBvo3bSMgHFzZM
9O6II8c+6zf1tRn4SWiw3te5djgdYZ6k/oI2peVKVuRF4fn9tBb6dNqcmzU5L/qw
IFAGbHrQgLKm+a/sRxmPUDgH3KKHOVj4utWp+UhnMJbulHheb4mjUcAwhmahRWa6
VOujw5H5SNz/0egwLX0tdHA114gk957EWW67c4cX8jJGKLhD+rcdqsq08p8kDi1L
93FcXmn/6pUCyziKrlA4b9v7LWIbxcceVOF34GfID5yHI9Y/QCB/IIDEgEw+OyQm
jgSubJrIqg0CAwEAAaNCMEAwDwYDVR0TAQH/BAUwAwEB/zAOBgNVHQ8BAf8EBAMC
AYYwHQYDVR0OBBYEFIQYzIU07LwMlJQuCFmcx7IQTgoIMA0GCSqGSIb3DQEBCwUA
A4IBAQCY8jdaQZChGsV2USggNiMOruYou6r4lK5IpDB/G/wkjUu0yKGX9rbxenDI
U5PMCCjjmCXPI6T53iHTfIUJrU6adTrCC2qJeHZERxhlbI1Bjjt/msv0tadQ1wUs
N+gDS63pYaACbvXy8MWy7Vu33PqUXHeeE6V/Uq2V8viTO96LXFvKWlJbYK8U90vv
o/ufQJVtMVT8QtPHRh8jrdkPSHCa2XV4cdFyQzR1bldZwgJcJmApzyMZFo6IQ6XU
5MsI+yMRQ+hDKXJioaldXgjUkK642M4UwtBV8ob2xJNDd2ZhwLnoQdeXeGADbkpy
rqXRfboQnoZsG4q5WTP468SQvvG5
-----END CERTIFICATE----- )EOF";   

const char* privateKey = R"EOF( -----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAumizg69JBLHvrv90eIdwxQge1wGO66rLcXMbxhda3LF7l36u
WCCGcIj3NlYFvHKhpl/+45TpwdNVi4zFZLsEO8lROCqLTL9/pl2QPjSjRXB/VqD7
LS6M7wj8gs9CeL/VHJjYIcml8dbEyoloDXAYInJMlN3aWve4EZff5gXRJ0Px9xi9
r2iqrEUSfS1UOlvW37zeu3JPlPYRNpd6Z+i2K8YuwY+kUuVg2bVYuONKhIoKJhvU
dOYRR6/uGCSqd0MKHgMq07P73Md+aranvunqaa5h2YGe+wbA+Ad7uoVZ3TUqFU0b
ehFABP3Gmg4gfmV8umc6GOUPfNCPpG3qxNDsCQIDAQABAoIBAC3240z1S+v8dD2S
gAW4X/Y1qmUZ3UP/OWsgFxkhaSZCHVedxR+15XCaVVrwmzl8ip+bzB4R+hHxKobe
j03nT4PugDh5RSAHmFJNf+PW1uuocb3KtCTP9bB7ZshakulzY/lJNwId1u1rJ9tJ
Rn8JxOm5hWivy8fijWDJMkxl4szraGIdemNcZqfpZk5KcP0Uc5EGFkGyXjaXhUVJ
h3VEHrqy1vs1NMNIvWB28hecKs86Y8tdesyWHgVgqAQX6Qlj627trlbkGeVi7B68
PKNHlUBQMAFkZKGEhAsVdkfN9kPM0XnAl09hGvID0FVOfgNWvtiqUpSpu4BpKF13
S71PigECgYEA3HCPLW1emAJu//sR43gMegFRYyouFmB34zQg4ROkcIH9Mj5R3q9x
NKZc8O8OwLtMFj/qQ/OsO07ap6pycZp2kE0wA4py1PbDKZMvfj6rPb9YwnA8kUJM
AirsXASo9/+ULpl1WlqKdvYaUUfjbGPQ7bIYxL9fGrAeRjD8ONoCjeUCgYEA2HrI
/DiNt1j62l7dGXKivhzfdFjcTdjmrEky+apC8QZGbNQoOln9CJHRxlqWJb2ADy6q
Hcdr2psSZsv8iG4VJNwWHJF0FgT9dseuROID/SRrKYZZPEP9knN7a0lPfHOhqL/+
AsVpug3k8R78REvuQDbMgYg4I8iRMoi9lrkzo1UCgYEA1te5I5whgmN0zXVkdN7u
wgYAzXYxnst8bOrEVLkxHhoCrHJClpdE7PxrPsKvDTY+LL00U+/sX4013A1qJsBV
Z8Ri1ECeNGMfyKhTtGXdvXt9RVvgG+6SZ9ZvsCs2hyYHxPb5ggsWQmUPN0KqK1yJ
JvDZ5P9i8H7PsrdRSxNnQ+UCgYAdLG7pjrWKf/NOenpRc6F6/WkfxNnro89yaGr2
OnvK/41+HRlOw9HV1dDvakXR0Dfx09gZK0bdrwhL0jG2MR+oWACi2PdMAGAoIcDa
h5sCAmZusixUctU5Z1a6nqaXnv2qQDV7Kh+Vc0nnNMXKbnEtNjVZP4JRUDZBGSxz
o4HSAQKBgQCDrdcUOsquwRphwV+u1VPxRSeRsbRpCGIkgW2hPO/pCIzEaCLF9IY8
duDo+jCnojKKEDsx9aNfRaWIQyijYQfGGBPrNd80WeZD00qWQUEJLet7edQIi8bd
rcqsrUdReBOdp35AB3VguxrtGVISmld9EPq7FVHguXo//ER5BI1z8Q==
-----END RSA PRIVATE KEY-----
 )EOF"; 

void IRAM_ATTR countTip() {
  unsigned long currentTime = millis();
  if (currentTime - lastInterruptTime > debounceDelay) {
    tipCount++;
    lastInterruptTime = currentTime;
  }
}

void connectAWS() {
  net.setCACert(rootCA);
  net.setCertificate(deviceCert);
  net.setPrivateKey(privateKey);
  client.setServer(awsEndpoint, 8883);

  Serial.println("Connecting to AWS IoT...");
  while (!client.connect(thingName)) {
    Serial.print("Failed, state=");
    Serial.print(client.state());
    Serial.println(" retrying in 5 seconds");
    delay(5000);
  }
  Serial.println("Connected to AWS!");
}

void setup() {
  Serial.begin(115200);
  SerialGPS.begin(9600, SERIAL_8N1, 16, 17);

  pinMode(MOISTURE1_PIN, INPUT);
  pinMode(MOISTURE2_PIN, INPUT);
  pinMode(MOISTURE3_PIN, INPUT);
  pinMode(rainPin, INPUT_PULLUP);
  pinMode(tiltPin, INPUT);
  attachInterrupt(digitalPinToInterrupt(rainPin), countTip, FALLING);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected");

  // Sync time (Crucial for SSL)
  configTime(0, 0, "pool.ntp.org");
  
  client.setKeepAlive(60);
  client.setSocketTimeout(15);
  connectAWS();
}

void loop() {
  if (!client.connected()) {
    connectAWS();
  }
  client.loop();

  // Read GPS
  while (SerialGPS.available()) {
    gps.encode(SerialGPS.read());
  }

  // Read Sensors and Calculate
  int m1 = constrain(map(analogRead(MOISTURE1_PIN), wet1, dry1, 100, 0), 0, 100);
  int m2 = constrain(map(analogRead(MOISTURE2_PIN), wet2, dry2, 100, 0), 0, 100);
  int m3 = constrain(map(analogRead(MOISTURE3_PIN), wet3, dry3, 100, 0), 0, 100);
  int micValue = analogRead(MIC_PIN);
  float rainfall = tipCount * mmPerPulse;
  bool tiltDetected = digitalRead(tiltPin);

  // Create JSON Payload
  StaticJsonDocument<256> doc;
  doc["deviceID"] = "Prob-05";
  doc["m1"] = m1;
  doc["m2"] = m2;
  doc["m3"] = m3;
  doc["rain"] = rainfall;
  doc["tilt"] = tiltDetected ? 1 : 0;
  doc["vibration"] = micValue;
  
  if (gps.location.isValid()) {
    doc["lat"] = gps.location.lat();
    doc["lng"] = gps.location.lng();
  } else {
    doc["lat"] = 0.0;
    doc["lng"] = 0.0;
  }

  char jsonBuffer[512];
  serializeJson(doc, jsonBuffer);

  // Publish every 10 seconds
  static unsigned long lastMsg = 0;
  if (millis() - lastMsg > 10000) {
    lastMsg = millis();
    client.publish(topic, jsonBuffer);
    Serial.print("Published: ");
    Serial.println(jsonBuffer);
  }
}
