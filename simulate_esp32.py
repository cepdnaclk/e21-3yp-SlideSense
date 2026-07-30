import time
import json
import urllib.request
import urllib.error
import random

API_URL = "http://3.7.191.76:80/ingestion/http"
BRIDGE_SECRET = "278075eb4912a22ff8c6590ddc69adc4ac9f9fd47ee9fdbb31da755433c863db"
HEADERS = {
    "X-Bridge-Secret": BRIDGE_SECRET,
    "Content-Type": "application/json"
}

def send_mock_data():
    for i in range(1, 11):
        # Generate some varying realistic data based on the esp32 script
        payload = {
            "probe_id": "P-TEST-01",
            "deviceTimeMs": int(time.time() * 1000),
            "moisture": round(random.uniform(40.0, 60.0), 2),
            "tiltAngle": round(random.uniform(0.0, 2.0), 2),
            "vibrationMag": round(random.uniform(0.0, 0.5), 2),
            "samplingMode": "Normal",
            "rainfallMm": round(random.uniform(0.0, 5.0), 2),
            "hwSerial": "SN-TEST-01"
        }
        
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(API_URL, data=data, headers=HEADERS, method='POST')
        
        try:
            with urllib.request.urlopen(req, timeout=5) as response:
                resp_text = response.read().decode('utf-8')
                print(f"[{i}/10] Request sent. Status: {response.status} | Moisture: {payload['moisture']}% | SQS Res: {resp_text}")
        except urllib.error.URLError as e:
            if hasattr(e, 'code'):
                print(f"[{i}/10] Error sending request. Status: {e.code} | Reason: {e.reason}")
            else:
                print(f"[{i}/10] Error sending request: {e}")
        
        if i < 10:
            time.sleep(2) # Delay between requests

if __name__ == "__main__":
    print(f"Starting ESP32 simulation... Sending 10 requests to {API_URL}")
    send_mock_data()
    print("Simulation finished.")
