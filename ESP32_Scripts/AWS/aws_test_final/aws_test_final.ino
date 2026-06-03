#define TINY_GSM_RX_BUFFER 4096

#include <Arduino.h>
#include <SSLClient.h>
#include "trust_anchors.h"
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ==========================================
// CONFIGURATION
// ==========================================
const char apn[]  = "mobitel";
const char* AWS_IOT_ENDPOINT = "a1cvrohkom2hp3-ats.iot.ap-south-1.amazonaws.com";
const char* MQTT_PUB_TOPIC   = "probes/ls-probe-01/telemetry";

const char* AWS_CERT_CRT = R"EOF(-----BEGIN CERTIFICATE-----
MIIDWTCCAkGgAwIBAgIUUbuV/aVkBmlsOKm0xT9YOfFHtFwwDQYJKoZIhvcNAQEL
BQAwTTFLMEkGA1UECwxCQW1hem9uIFdlYiBTZXJ2aWNlcyBPPUFtYXpvbi5jb20g
SW5jLiBMPVNlYXR0bGUgU1Q9V2FzaGluZ3RvbiBDPVVTMB4XDTI2MDUyMjE5MzEx
OVoXDTQ5MTIzMTIzNTk1OVowHjEcMBoGA1UEAwwTQVdTIElvVCBDZXJ0aWZpY2F0
ZTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAN3cw2R2InaLOyaXZmbq
eFK7V7iPYq6oVRm/M/lr5Q94ddz2kvjLKoNtltmwL4ENqIkzmNx9Ogb03CqF19/6
BiGfEB5ET6CZXNTsV8Yz+uIVguHoPkCegewc0VE8LDQNa7sULSht1hD2vUC0h4ho
czpVV7gBl/sBRMowlnMwgrGN5bF3r6LtzuRWp/bPzyBJ6ZailE5aiiyldI/mtLf3
sasc+fn2TrMCppXj/vHf52WWMzh+Jtnrn/DojtyVGCvjiTajn3Nf4+/mfvGuvVft
wLYO5KF/rVPKEE1dxI4SxgfvRzdjgMwbuv5FmMaB3JxJJ45p+8cU1qg//ioq4k8/
IIcCAwEAAaNgMF4wHwYDVR0jBBgwFoAUewzrt3EjcWymnA+wxoUsIEAy65AwHQYD
VR0OBBYEFKENQ3BOASiv1WuZtEgNu1g27mhBMAwGA1UdEwEB/wQCMAAwDgYDVR0P
AQH/BAQDAgeAMA0GCSqGSIb3DQEBCwUAA4IBAQCERBKN/p5nd8EcXi7BQ/CPbDM7
hKOKmqtWgRcOgjuxWThBpMcc96sVZur9eq52PHoQpFIb6yIhYumB84roUdHF7jP3
DO+lJCPhsnhR9xtUMuAtFecEOTGT0DlRvDQnM+49yQbd7zuLxnwSPOopjqcJMqp2
eatulquYxpS/fCTtws/bH64zzuabApe14hQDvkihoF4euFBZuUxuLYQu9A2K9ey3
xDddKr+8V7RbkSEKVoP+GwI/RIGAJDhpW70yYFZ4woQwqNlo8O/x/bFJ815LZUcm
b9fVXe8QWywe5y2PszmoLRS8KpZ+z7mLIC7PJBguIsorK2RiLP+PV/kWGOvz
-----END CERTIFICATE-----)EOF";

const char* AWS_CERT_PRIVATE = R"EOF(-----BEGIN RSA PRIVATE KEY-----
MIIEogIBAAKCAQEA3dzDZHYidos7JpdmZup4UrtXuI9irqhVGb8z+WvlD3h13PaS
+Msqg22W2bAvgQ2oiTOY3H06BvTcKoXX3/oGIZ8QHkRPoJlc1OxXxjP64hWC4eg+
QJ6B7BzRUTwsNA1ruxQtKG3WEPa9QLSHiGhzOlVXuAGX+wFEyjCWczCCsY3lsXev
ou3O5Fan9s/PIEnplqKUTlqKLKV0j+a0t/exqxz5+fZOswKmleP+8d/nZZYzOH4m
2euf8OiO3JUYK+OJNqOfc1/j7+Z+8a69V+3Atg7koX+tU8oQTV3EjhLGB+9HN2OA
zBu6/kWYxoHcnEknjmn7xxTWqD/+KiriTz8ghwIDAQABAoIBABOl9Xf0LmEpO3fT
eLIsmbNZ/A7QRAELz12UXVn9gC+6j1WeUK3P8FfrYKyuucZIG2DrPOJqBLWRAd6S
M+gWEGzx1U+Y5SRn8Jy6wZtABzv2g7zWAI1gfEkY1EDJf3Csr5nF06n88DRYZbJR
Sp9+AJZt8HLPUVJdbmYpn2lcJnbq2+hfwr2x+ME6aBg0BkzAfA7kuqDdSr1px5p3
jHV7pl8dsMiJpapE6fpfenz0qcXqy0ipe9TyLjj1eXVJKIrcE2rbEnuF96m4zj8d
mMJ10tJCrIt+YTCubZLZJ3kV2Hws5coCbvC0N1m/lKKhzr9WncFIpNjdvVjKpopO
gLnKYGECgYEA+Mo+Irpg/+lSsTu3/jZ4MWOaCTIpTXvIeM7wcQ01B3yF5ZyfBfkT
i5PkO0MUouyI9sW2P5iP+DYVsTe9q3EsQISoSd9dsOfWvEgEwaLUb8bPHr4rFtU/
FbxpZa8IQ5fhRrCQAHmDjHbiJAt7KP9Y/kJZ4Ds9atIwJnnjYPK6FKsCgYEA5Eq+
+HdtS8B6Sj5aCxncn1mjB2xLiugQGnETmV3VBRkQHXDRRsoNQ55Aeep2/W8lh87X
78sPpohgyQ5oXp05kLnPsnE7ZgiR95hhedo2MbPnFNVDcalupod7xDhBqbFF1/73
GSYr2e6lsEQuVmhNRKXvuhcbbPWkmj+rwqCpS5UCgYBA8uNXw5pRFMNeu31kIyor
kpoC7pJzxO3oA/YnPVBrvOljsQie0ZB1rs01X2TCx8dVzPWwEo77OHtfQXMFj80C
pt8cMfDOnyejDZYYSv70k0089F5hXphSf1ZwkkoxAzRvdOaTCSX7hImy6UBkyoyc
DAxUioKVIXwqf0WJ6LQFcwKBgE9FmTykE8K7Knu/XPr/1vlKYe8A7tZkMLtNypV1
3LNxeYQPmcvv+10ghZkQDpOAVdLrw1XT+DJGpv0J0LoR9FxJ+VIoOYz7qtwEAM0U
Nb9ajgJQ76N3RyHyZ8rCEiL/mJYhReJou89oLAaiFkkQ3MvapvzCa1aRkb+yHk1u
BntlAoGABz4otHmeK13i2NSXS8wQH/tYdvm0jX8x9+KOz1IGgDYsltYwveGnIxVQ
e0dSNFoT8VnS/VLW7MUFN3Atw59Lrx2UJBEz5gXZv6E2LVJKgmAog+rVho0ao9cs
1D+DbZvraBE0/1qyIowbvTUBRB2M5jN29E7nyOade+Ict1+2KbU=
-----END RSA PRIVATE KEY-----)EOF";

#define SIM808_RX 32
#define SIM808_TX 33
HardwareSerial SerialAT(2);

// ==========================================
// RAW AT COMMAND HELPERS
// ==========================================
String waitForResponse(unsigned long timeoutMs = 2000) {
    unsigned long start = millis();
    String response = "";
    while (millis() - start < timeoutMs) {
        while (SerialAT.available()) {
            char c = SerialAT.read();
            response += c;
        }
        if (response.indexOf("OK") >= 0 ||
            response.indexOf("ERROR") >= 0 ||
            response.indexOf("CONNECT") >= 0 ||
            response.indexOf("CLOSED") >= 0) {
            break;
        }
        delay(10);
    }
    Serial.print("[AT RESP]: ");
    Serial.println(response);
    return response;
}

bool sendAT(const char* cmd, const char* expected = "OK", unsigned long timeoutMs = 5000) {
    Serial.print("[AT CMD]: ");
    Serial.println(cmd);
    SerialAT.println(cmd);
    String resp = waitForResponse(timeoutMs);
    return resp.indexOf(expected) >= 0;
}

void flushAT() {
    delay(100);
    while (SerialAT.available()) SerialAT.read();
}

// ==========================================
// CUSTOM SIM808 TCP CLIENT FOR SSLCLIENT
// ==========================================
class SIM808Client : public Client {
public:
    bool _connected = false;
    
    int connect(IPAddress ip, uint16_t port) override {
        return connect(ip.toString().c_str(), port);
    }

    int connect(const char* host, uint16_t port) override {
        Serial.println("[SIM808Client] Opening TCP connection...");
        
        // Close any existing connection
        SerialAT.println("AT+CIPCLOSE");
        delay(1000);
        flushAT();

        // Build CIPSTART command for CIPMUX=0
        String cmd = "AT+CIPSTART=\"TCP\",\"";
        cmd += host;
        cmd += "\",";
        cmd += port;
        
        Serial.print("[AT CMD]: ");
        Serial.println(cmd);
        SerialAT.println(cmd);
        
        // Wait for CONNECT OK — can take up to 10 seconds
        unsigned long start = millis();
        String resp = "";
        while (millis() - start < 15000) {
            while (SerialAT.available()) {
                resp += (char)SerialAT.read();
            }
            if (resp.indexOf("CONNECT OK") >= 0) {
                Serial.println("[SIM808Client] TCP CONNECT OK");
                _connected = true;
                return 1;
            }
            if (resp.indexOf("ERROR") >= 0 || 
                resp.indexOf("CLOSED") >= 0) {
                Serial.println("[SIM808Client] TCP CONNECT FAILED");
                Serial.println(resp);
                _connected = false;
                return 0;
            }
            delay(100);
        }
        Serial.println("[SIM808Client] TCP CONNECT TIMEOUT");
        _connected = false;
        return 0;
    }

    size_t write(uint8_t b) override {
        return write(&b, 1);
    }
   size_t write(const uint8_t* buf, size_t size) override {
        // In transparent mode just write raw bytes directly
        size_t written = SerialAT.write(buf, size);
        Serial.print("[WRITE] Sent ");
        Serial.print(written);
        Serial.println(" raw bytes");
        return written;
    }

    int available() override {
        SerialAT.println("AT+CIPRXGET=4");
        unsigned long start = millis();
        String resp = "";
        while (millis() - start < 1000) {
            while (SerialAT.available()) {
                resp += (char)SerialAT.read();
            }
            if (resp.indexOf("+CIPRXGET:") >= 0) break;
            delay(10);
        }
        int idx = resp.indexOf("+CIPRXGET:4,");
        if (idx >= 0) {
            int avail = resp.substring(idx + 12).toInt();
            if (avail > 0) {
                Serial.print("[AVAIL] Bytes waiting in modem: ");
                Serial.println(avail);
            }
            return avail;
        }
        return 0;
    }

    int read() override {
        return SerialAT.read();
    }

    int read(uint8_t* buf, size_t size) override {
        int bytesRead = 0;
        unsigned long start = millis();
        while (bytesRead < (int)size && millis() - start < 3000) {
            if (SerialAT.available()) {
                buf[bytesRead++] = SerialAT.read();
            }
        }
        Serial.print("[READ] ");
        Serial.print(bytesRead);
        Serial.println(" bytes");
        return bytesRead;
    }
    int peek() override { return -1; }
    
    void flush() override { SerialAT.flush(); }
    
    void stop() override {
        // In transparent mode, +++ escapes back to command mode
        delay(1000);
        SerialAT.print("+++");
        delay(1000);
        sendAT("AT+CIPCLOSE");
        _connected = false;
        Serial.println("[SIM808Client] TCP closed");
    }
    
    uint8_t connected() override {
        return _connected ? 1 : 0;
    }

    operator bool() override { return _connected; }
};

// ==========================================
// INSTANCES
// ==========================================
SIM808Client rawClient;
SSLClient secureClient(rawClient, TAs, (size_t)TAs_NUM, 35, 1, SSLClient::SSL_ERROR);
PubSubClient client(secureClient);

// ==========================================
// MODEM INIT
// ==========================================
void initModem() {
    Serial.println("[MODEM] Initializing...");

    sendAT("AT");
    sendAT("ATE0");
    sendAT("AT+CMEE=2");

    // Wait for network
    Serial.println("[MODEM] Waiting for network...");
    unsigned long start = millis();
    while (millis() - start < 60000) {
        SerialAT.println("AT+CREG?");
        String resp = waitForResponse(2000);
        if (resp.indexOf("+CREG: 0,1") >= 0 ||
            resp.indexOf("+CREG: 0,5") >= 0 ||
            resp.indexOf("+CREG: 1,1") >= 0 ||
            resp.indexOf("+CREG: 1,5") >= 0) {
            Serial.println("[MODEM] Network registered!");
            break;
        }
        Serial.println("[MODEM] Waiting...");
        delay(3000);
    }

    // Signal
    SerialAT.println("AT+CSQ");
    waitForResponse(1000);

    // Check GPRS attach status first
    Serial.println("[MODEM] Checking GPRS attach status...");
    SerialAT.println("AT+CGATT?");
    String attachResp = waitForResponse(3000);
    Serial.print("[GPRS STATUS]: ");
    Serial.println(attachResp);

    // Only attach if not already attached
    if (attachResp.indexOf("+CGATT: 0") >= 0) {
        Serial.println("[MODEM] Not attached, attaching...");
        sendAT("AT+CGATT=1", "OK", 10000);
    } else {
        Serial.println("[MODEM] Already attached to GPRS");
    }

    // Single connection mode
    Serial.println("[MODEM] Setting CIPMUX=0...");
    sendAT("AT+CIPMUX=0");
    sendAT("AT+CIPMODE=1");

    // Verify
    SerialAT.println("AT+CIPMUX?");
    String cipmux = waitForResponse(1000);
    Serial.print("[CIPMUX STATUS]: ");
    Serial.println(cipmux);

    // Set APN
    Serial.println("[MODEM] Setting APN...");
    String cstt = "AT+CSTT=\"";
    cstt += apn;
    cstt += "\",\"\",\"\"";
    sendAT(cstt.c_str(), "OK", 10000);

    // Bring up wireless connection
    Serial.println("[MODEM] Bringing up wireless connection...");
    SerialAT.println("AT+CIICR");
    unsigned long cicrStart = millis();
    String cicrResp = "";
    while (millis() - cicrStart < 15000) {
        while (SerialAT.available()) cicrResp += (char)SerialAT.read();
        if (cicrResp.indexOf("OK") >= 0) {
            Serial.println("[MODEM] CIICR OK!");
            break;
        }
        if (cicrResp.indexOf("ERROR") >= 0) {
            Serial.print("[MODEM] CIICR ERROR: ");
            Serial.println(cicrResp);
            break;
        }
        delay(500);
    }

    // Get IP
    Serial.println("[MODEM] Getting IP...");
    SerialAT.println("AT+CIFSR");
    String ip = waitForResponse(5000);
    Serial.print("[MODEM] IP: ");
    Serial.println(ip);

    // Verify IP is valid
    if (ip.indexOf("ERROR") >= 0 || ip.length() < 7) {
        Serial.println("[MODEM] No valid IP — GPRS failed!");
        Serial.println("[MODEM] Trying deactivate and reactivate...");
        sendAT("AT+CIPSHUT", "SHUT OK", 5000);
        delay(2000);
        sendAT("AT+CIPMUX=0");
        String cstt2 = "AT+CSTT=\"";
        cstt2 += apn;
        cstt2 += "\",\"\",\"\"";
        sendAT(cstt2.c_str(), "OK", 10000);
        sendAT("AT+CIICR", "OK", 15000);
        SerialAT.println("AT+CIFSR");
        ip = waitForResponse(5000);
        Serial.print("[MODEM] IP after retry: ");
        Serial.println(ip);
    }

    // Enable manual receive
    sendAT("AT+CIPRXGET=1");

    Serial.println("[MODEM] --> INTERNET READY <--");
    delay(3000);
}

// ==========================================
// SETUP
// ==========================================
void setup() {
    Serial.begin(115200);
    delay(1000);

    Serial.println("[HW] Starting...");
    SerialAT.setRxBufferSize(4096);
    SerialAT.begin(9600, SERIAL_8N1, SIM808_RX, SIM808_TX);
    delay(3000);

    // Hard reset modem
    Serial.println("[MODEM] Restarting...");
    SerialAT.println("AT+CFUN=1,1");
    delay(10000);
    flushAT();

    initModem();

    // SSL setup
    SSLClientParameters mTLS = SSLClientParameters::fromPEM(
        AWS_CERT_CRT, strlen(AWS_CERT_CRT),
        AWS_CERT_PRIVATE, strlen(AWS_CERT_PRIVATE)
    );
    secureClient.setMutualAuthParams(mTLS);
    secureClient.setTimeout(60000);
    client.setServer(AWS_IOT_ENDPOINT, 8883);
    client.setSocketTimeout(60);

    Serial.println("[SSL] Connecting to AWS...");
    while (!client.connect("ls-probe-1")) {
        Serial.print("[MQTT] Failed, state: ");
        Serial.println(client.state());
        delay(5000);
    }
    Serial.println("[MQTT] Connected to AWS IoT!");
}

// ==========================================
// LOOP
// ==========================================
void loop() {
    if (!client.connected()) {
        Serial.println("[MQTT] Reconnecting...");
        secureClient.stop();
        rawClient.stop();
        delay(3000);
        initModem();
        while (!client.connect("ls-probe-1")) {
            delay(5000);
        }
    }
    client.loop();

    unsigned long deviceTimeMs = millis();
    float moisture      = random(300, 650) / 10.0;
    float tiltAngle     = random(0, 150) / 10.0;
    float vibrationMag  = random(0, 50) / 100.0;
    const char* hwSerial = "2134324";

    JsonDocument doc;
    doc["deviceTimeMs"] = deviceTimeMs;
    doc["moisture"]     = moisture;
    doc["tiltAngle"]    = tiltAngle;
    doc["vibrationMag"] = vibrationMag;
    doc["samplingMode"] = "Normal";
    doc["rainfallMm"]   = 4.2;
    doc["hwSerial"]     = hwSerial;

    char jsonBuffer[512];
    serializeJson(doc, jsonBuffer);

    Serial.print("[MQTT] Publishing: ");
    Serial.println(jsonBuffer);

    if (client.publish(MQTT_PUB_TOPIC, jsonBuffer)) {
        Serial.println("[MQTT] Publish successful!");
    } else {
        Serial.println("[MQTT] Publish FAILED");
    }

    delay(10000);
}