# EC2 HTTP-to-SQS Telemetry Bridge

## Overview

This bridge acts as a lightweight ingestion point for IoT telemetry data sent from an ESP32 microcontroller via a SIM808 GSM module. Because the SIM808 communicates more easily over standard HTTP, this EC2 instance accepts raw HTTP POST requests, validates a shared security token, and securely forwards the payload to an AWS SQS queue for backend processing.

By using an EC2 IAM Instance Profile, the bridge avoids hardcoding AWS credentials on the server.

## Architecture Flow

1. **Hardware (ESP32 + SIM808):** Reads sensor data and constructs a JSON payload.
2. **Transmission:** Sends an HTTP POST request to the EC2 Public IP on Port 80, including an `X-Bridge-Secret` header.
3. **Ingestion (EC2 + FastAPI):** The Python web server receives the request, verifies the secret token, and accepts the JSON body.
4. **Queueing (boto3 + IAM):** The server uses its attached IAM role to securely push the JSON payload into an AWS SQS Queue.
5. **Response:** The server returns a 200 OK and the SQS Message ID back to the ESP32.

## AWS Infrastructure Setup

### 1. IAM Role

An IAM Role allows the EC2 instance to interact with SQS securely.

**Role Name:** `EC2-Telemetry-Bridge-Role`

**Attached Policy:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:YOUR_REGION:YOUR_ACCOUNT_ID:YOUR_QUEUE_NAME"
    }
  ]
}
```

### 2. Security Group

**Name:** `telemetry-bridge-sg`

**Inbound Rules:**
- **SSH (Port 22):** Allowed only from Admin's IP address.
- **HTTP (Port 80):** Allowed from `0.0.0.0/0` (Anywhere) to accept dynamic mobile IPs from the cellular network.

## Server Deployment Guide

### 1. Install Dependencies

SSH into the EC2 instance and run the following commands to install Python tools and create a virtual environment:

```bash
sudo apt update
sudo apt install python3-pip python3-venv -y
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn boto3
```

### 2. Bridge Code (`main.py`)

Create a file named `main.py` in the home directory (`/home/ubuntu/main.py`) and paste the following code. 

**Key Updates Included:**
* Uses `json.dumps()` to ensure the payload sent to SQS remains strict JSON, preventing backend parsing crashes.
* Implements the `logging` module so traffic can be monitored live using systemd logs.
* Includes the `uvicorn.run()` block to act as the ASGI server.

```python
import os
import json
import logging
from fastapi import FastAPI, HTTPException, Header, Request
import boto3
import uvicorn

# Setup standard Python logging to ensure messages reach systemd/journalctl
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configuration
SHARED_SECRET = "your_generated_hex_string"
QUEUE_URL = "https://sqs.YOUR_[REGION.amazonaws.com/YOUR_ACCOUNT_ID/YOUR_QUEUE_NAME](https://REGION.amazonaws.com/YOUR_ACCOUNT_ID/YOUR_QUEUE_NAME)"

# Initialize SQS client. Boto3 automatically uses HTTPS (TLS) for all AWS API calls.
sqs = boto3.client('sqs', region_name='YOUR_REGION')

@app.post("/ingestion/http")
async def ingest_telemetry(request: Request, x_bridge_secret: str = Header(None)):
    """
    Endpoint matching the ESP32's API_PATH.
    Expects the secret key in the 'X-Bridge-Secret' HTTP header.
    """
    # 1. Verify the secret token
    if x_bridge_secret != SHARED_SECRET:
        logger.warning("❌ [REJECTED] Unauthorized packet received.")
        raise HTTPException(status_code=401, detail="Unauthorized")

    # 2. Extract JSON payload
    try:
        body = await request.json()
        logger.info(f"📥 [ARRIVED] Raw payload from ESP32: {body}")
    except Exception:
        logger.error("🔥 [ERROR] Invalid JSON payload received.")
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    # 3. Push to SQS
    try:
        response = sqs.send_message(
            QueueUrl=QUEUE_URL,
            MessageBody=json.dumps(body) # Ensures the payload remains strict JSON
        )
        msg_id = response.get("MessageId")
        
        logger.info(f"✅ [QUEUED] Successfully pushed to SQS! Message ID: {msg_id}")
        return {"status": "success", "message_id": msg_id}
        
    except Exception as e:
        logger.error(f"🔥 [ERROR] Failed to push to SQS: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    # Run the server on port 80 to catch standard HTTP traffic
    uvicorn.run(app, host="0.0.0.0", port=80)
```

### 3. Creating a Background Service (`systemd`)

Instead of running the server manually, configure it as a background service so it boots automatically with the instance and restarts upon failure. 

1. Create a new service file:
   ```bash
   sudo nano /etc/systemd/system/telemetry.service
   ```

2. Add the following configuration. Note that `User=root` is required for Uvicorn to bind to Port 80.
   ```ini
   [Unit]
   Description=Python Telemetry Bridge Service
   After=network.target

   [Service]
   User=root
   WorkingDirectory=/home/ubuntu
   ExecStart=/home/ubuntu/venv/bin/python /home/ubuntu/main.py
   Restart=always
   RestartSec=5

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable telemetry.service
   sudo systemctl start telemetry.service
   ```

4. Verify the status and monitor live logs:
   ```bash
   sudo systemctl status telemetry.service
   sudo journalctl -u telemetry.service -f
   ```

## ESP32 Firmware Configuration

Ensure the ESP32 code is configured to match the server settings.

### Network Constants

```cpp
// Replace with the actual Public IPv4 address of your EC2 instance
constexpr const char* API_HOST = "123.45.67.89";
constexpr uint16_t API_PORT = 80;
constexpr const char* API_PATH = "/ingestion/http";
constexpr const char* GSM_APN = "mobitel"; // Sri Lanka specific APN
```

### HTTP Header Injection

Before firing the HTTP POST request, the ESP32 must inject the secret token into the request header. Make sure the secret exactly matches the string deployed to the server.

```cpp
// Example using a standard HTTP client library
http.addHeader("X-Bridge-Secret", "your_generated_hex_string");
```