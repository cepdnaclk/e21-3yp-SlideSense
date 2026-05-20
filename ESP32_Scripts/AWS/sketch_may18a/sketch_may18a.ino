#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include "time.h"

// ==========================================
// 1. NETWORK & AWS CONFIGURATION
// ==========================================
const char* WIFI_SSID = "Hope";
const char* WIFI_PASSWORD = "#Fikry183";

// Your specific AWS IoT Endpoint (Find this in AWS IoT Core Console -> Settings)
const char* AWS_IOT_ENDPOINT = "a1cvrohkom2hp3-ats.iot.ap-south-1.amazonaws.com"; 

// This matches our IoT core configuration rule: probes/{probe_id}/telemetry
const char* MQTT_PUB_TOPIC = "probes/ls-probe-01/telemetry";

// NTP Server configurations to fetch real world epoch time
const char* NTP_SERVER = "pool.ntp.org";

// ==========================================
// 2. CERTIFICATES & PRIVATE KEYS (PEM Format)
// ==========================================

// Amazon Root CA 1 Certificate
const char* AWS_CERT_CA = R"EOF(-----BEGIN CERTIFICATE-----
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
-----END CERTIFICATE-----)EOF";

// Device Certificate (xxx-certificate.pem.crt)
const char* AWS_CERT_CRT = R"EOF(-----BEGIN CERTIFICATE-----
MIIDWTCCAkGgAwIBAgIUahZapbtT8DmHLLut9I9iZTYd8E8wDQYJKoZIhvcNAQEL
BQAwTTFLMEkGA1UECwxCQW1hem9uIFdlYiBTZXJ2aWNlcyBPPUFtYXpvbi5jb20g
SW5jLiBMPVNlYXR0bGUgU1Q9V2FzaGluZ3RvbiBDPVVTMB4XDTI2MDUxNzA3NTM0
N1oXDTQ5MTIzMTIzNTk1OVowHjEcMBoGA1UEAwwTQVdTIElvVCBDZXJ0aWZpY2F0
ZTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMir8SAOhh3GpLH42ohV
CLvTvMJ0jUInkAoG49UEeYhFeQ7OPPifcfZ79gNZFNs7u3zgkEdyQoQOULHpWig9
8HF7Du+cCXo5/P2mo8cNDo60OL9v4Glyz5WYKd48DIF5njwFKGzNqpkrPu8lB2Vn
+7YazxjSvPzAbeVZEF9wOzZzsiuuspxndG3iMN/k/RKKodX5rdBYi01kiQsmivoW
AZsXHzNQq57Dlzyx37FzycIaCQGfWLQQ/BUf3I3g+TIdGnlg+77eoOiDzqgWnkaY
X9yvDNySvR7DyJI/n0DIzeZjxtV/IYduI+IW/GXyFf9zpvXyRe1WAVjdQMFZSSAq
yYkCAwEAAaNgMF4wHwYDVR0jBBgwFoAUB2ADzqPKwsNJInlaXavYC5cIAGgwHQYD
VR0OBBYEFCgdaosgj+ZtPgcihBuNm7g3cnmMMAwGA1UdEwEB/wQCMAAwDgYDVR0P
AQH/BAQDAgeAMA0GCSqGSIb3DQEBCwUAA4IBAQAxWXyI+Jn3ojo8/qmlSl7PBTD/
DoYzCymWNO8JoI6dNq1I1HJ3QUmuxm1NaUES/PTKfsl31w/ctH5DeNYSbyQbq3RG
P6azylnNvFTav6MTKi5LMrQdIKo3T2cOHMPH7vOqq4UOmquRYDxdfx3g1eA18sgX
zemJpUryxNRheB2YuX/iXgha96T2nKZZLmssn7jYZyJ+3Upt1/zNDvY5KAu5XDkL
80TcNBAkVCxe8wLlTVAux6YYf0gPnCJ991vd7LzwVKvy/CqF5Huawq+T3xGE5hjs
PnLWdI6OfebhZ2AdUUFznZYEZuoniEYkqTCaTV6BdsI0cJ36jOMp21fp/OY+
-----END CERTIFICATE-----)EOF";

// Device Private Key (xxx-private.pem.key)
const char* AWS_CERT_PRIVATE = R"EOF(-----BEGIN RSA PRIVATE KEY-----
MIIEpQIBAAKCAQEAyKvxIA6GHcaksfjaiFUIu9O8wnSNQieQCgbj1QR5iEV5Ds48
+J9x9nv2A1kU2zu7fOCQR3JChA5QselaKD3wcXsO75wJejn8/aajxw0OjrQ4v2/g
aXLPlZgp3jwMgXmePAUobM2qmSs+7yUHZWf7thrPGNK8/MBt5VkQX3A7NnOyK66y
nGd0beIw3+T9Eoqh1fmt0FiLTWSJCyaK+hYBmxcfM1CrnsOXPLHfsXPJwhoJAZ9Y
tBD8FR/cjeD5Mh0aeWD7vt6g6IPOqBaeRphf3K8M3JK9HsPIkj+fQMjN5mPG1X8h
h24j4hb8ZfIV/3Om9fJF7VYBWN1AwVlJICrJiQIDAQABAoIBAATb/QvMrjy8WbKh
lxEkFgEOYIzI677FXHyRrCS1ZggBvqu4HMvceJMCb3OnTZT9fk3I1lWUk73E5vlX
8EH3NgJZe4Qb4DLggprV1TN1wnt8K7+fAu0qxZIWzDTAeYENI+LKMS9pT49D99Ms
r2AqQ3MmdQth1we71S1vmbDl89keqxqGa+DrgazXkSt4GlHmLOfT8R7x+HpvkiqT
CINzn8DpVaRuvPsNMkplZnX6WiU1LzZV1V0YCKXS8f7/waMEytQ3gDvp4pakeMPo
rzNdWlqWkdZGpI9+2C+8C+0OXZ6GU+nmcRPFygX+gBdBCeqU/2/a0XeHTtVpNDwa
qUqP540CgYEA8i6qx0H1qD9TkOkEFEH9+UsuX5OaowOxj7OQv72SEiQFnG0IDtZD
r9lKJ+UwwiUDJ90beLJSZydimJaeIAo9fmdmZ+7+4SlmN2JU74K3RBo0HvmixA3o
x/qSgpG2GJUs47kW0lJOS4BYr/f4JOYhfn0/KOhX9mXhPbs8fWcu2esCgYEA1B73
mDknA8ceMH4smSB6yM3DP5ODHzqwdQtAxN33E/8KAE/R+4Gn2oyW1//ABo4yEr4T
VCmGKin5TVSzLeFPvsAkH3Cud+DR3tVAIe7cJzjlAMjjlBAlGF+ApSLY2aE7p9+J
OG2ay/7vzqWbjC37h/29YqZW3dPYa1eXU/56OVsCgYEA6kJr3TwXRLykt7o9wN6o
rZikbb0YSnDLM4ZtEJttjPCdINdygO+PH60ehwKyLEmjCM9ewFw1SySUwaaHo9Rj
8T5Rl11d3CywfAg4wkj9vvldy0yLvfr6XV4qk/QgYR0DA+/IfH8yzuOCZgyFUiPs
6C58hrRgSa34tz7C30aM0isCgYEAmUF+ddblH0+fuj2PD1tuGuK/LJHxbIDEuOvW
ceZE+4eKvErvVZ2JntdwrMK1BId8GhqGcIpHyvLkkkCd7IobSaAc+TI6e5ZNS4gb
e+jN2vC6U+TQuEsp4gAuPCF/N03Mgi95PvHBo52fuVfhmFgooUpsqHexzzed54Az
b5YuzH0CgYEA1mDShikZShpEqAAH0LmeE9KW8NFKLsWizpvARGmUETvfzxJC1q4d
xoitFsdfrHm8E359wPGK+4JVI4Z80xrd3jqMir7B6N4OVqrMWvs1jUovBZHtMEe/
Ds+0KbVKa+U9AKVTcqZ8Gvpvq7izIpFodoDnUoxUa8jmeMwvVEuwFzE=
-----END RSA PRIVATE KEY-----)EOF";

// ==========================================
// 3. HARDWARE & INSTANCE ARCHITECTURE
// ==========================================
WiFiClientSecure net = WiFiClientSecure();
PubSubClient client(net);

// Helper function to fetch real-world millisecond timestamps
unsigned long long getEpochTimeMs() {
    struct timeval tv;
    if (gettimeofday(&tv, NULL) != 0) {
        Serial.println("Failed to obtain system time");
        return 0;
    }
    // Convert seconds to ms and add microseconds converted to ms
    return (unsigned long long)(tv.tv_sec) * 1000ll + (unsigned long long)(tv.tv_usec) / 1000ll;
}

void connectToWiFi() {
    Serial.print("Connecting to Wi-Fi...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWi-Fi Connected!");
}

void connectToAWS() {
    // Configure WiFiClientSecure with the matching credentials
    net.setCACert(AWS_CERT_CA);
    net.setCertificate(AWS_CERT_CRT);
    net.setPrivateKey(AWS_CERT_PRIVATE);

    client.setServer(AWS_IOT_ENDPOINT, 8883);

    Serial.print("Connecting to AWS IoT Core...");
    // Create a unique client ID based on ESP32 MAC to avoid collisions
    String clientId = "ls-probe-1";
    
    while (!client.connected()) {
        if (client.connect(clientId.c_str())) {
            Serial.println("Connected to AWS IoT!");
        } else {
            Serial.print("Failed, MQTT State: ");
            Serial.print(client.state());
            Serial.println(" - Retrying in 5 seconds...");
            delay(5000);
        }
    }
}

void setup() {
    Serial.begin(115200);
    
    connectToWiFi();

    // Sync system clock using NTP so our epoch calculation is accurate
    configTime(0, 0, NTP_SERVER); // We use 0 offset because we want absolute UTC time
    Serial.print("Synchronizing time via NTP");
    while (time(nullptr) < 86400) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nTime Synchronized!");

    connectToAWS();
}

void loop() {
    // Reconnect logic if connections drop
    if (WiFi.status() != WL_CONNECTED) {
        connectToWiFi();
    }
    if (!client.connected()) {
        connectToAWS();
    }
    client.loop();

    // Generate simulated land stability telemetry data
    unsigned long long deviceTimeMs = getEpochTimeMs();
    float moisture = random(300, 650) / 10.0;     // Simulated 30.0% to 65.0%
    float tiltAngle = random(0, 150) / 10.0;       // Simulated 0.0° to 15.0°
    float vibrationMag = random(0, 50) / 100.0;    // Simulated 0.00g to 0.50g
    const char* samplingMode = "Normal";
    float rainfallMm = 4.2;
    const char* hwSerial = "2134324";

    // Structure the JSON Document
    JsonDocument doc;
    doc["deviceTimeMs"] = deviceTimeMs;
    doc["moisture"] = moisture;
    doc["tiltAngle"] = tiltAngle;
    doc["vibrationMag"] = vibrationMag;
    doc["samplingMode"] = samplingMode;
    doc["rainfallMm"] = rainfallMm;
    doc["2134324"] = hwSerial;

    // Serialize payload to string array buffer
    char jsonBuffer[512];
    serializeJson(doc, jsonBuffer);

    // Publish payload to the telemetry channel
    Serial.print("Publishing payload: ");
    Serial.println(jsonBuffer);
    
    if(client.publish(MQTT_PUB_TOPIC, jsonBuffer)) {
        Serial.println("Publish Successful!");
    } else {
        Serial.println("Publish Failed.");
    }

    // Wait 10 seconds before transmitting the next record package
    delay(10000);
}