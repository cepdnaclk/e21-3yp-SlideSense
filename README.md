<p align="center">
  <img src="./docs/images/logo.png" width="160"/>
</p>


<p align="center">
  <img src="https://img.shields.io/badge/Smart%20•%20Resilient%20•%20Real--Time-2ea44f?style=for-the-badge">
</p>



<p align="center">
  <img src="./docs/images/Probe.jpeg" width="450"/>
</p>

[![Status](https://img.shields.io/badge/Status-In%20Progress-yellow)](https://github.com/yourusername/SlideSence)
[![Platform](https://img.shields.io/badge/Platform-ESP32%20%7C%20AWS%20IoT-blue)](https://aws.amazon.com/iot/)
[![Language](https://img.shields.io/badge/Language-C%2B%2B%20%7C%20Python-green)](https://github.com/yourusername/SlideSence)
[![License](https://img.shields.io/badge/License-MIT-lightgrey)](LICENSE)


## Team
- E/21/087, Shihara Dewagedara, [e21087@eng.pdn.ac.lk](mailto:e21087@eng.pdn.ac.lk)
- E/21/138, Fikry M.N.M., [e21138@eng.pdn.ac.lk](mailto:e21138@eng.pdn.ac.lk)
- E/21/302, Sahandi Perera, [e21302@eng.pdn.ac.lk](mailto:e21302@eng.pdn.ac.lk)
- E/21/452, Zaid M.R.M., [e21452@eng.pdn.ac.lk](mailto:e21452@eng.pdn.ac.lk)



#### Table of Contents

1. [Introduction](#introduction)
2. [Overall System Architecture](#overall-system-architecture)
3. [Data Flow Architecture](#data-flow-architecture)
4. [Software Architecture & Stack](#software-architecture--stack)
5. [Project Timeline](#project-timeline)
6. [Detailed Budget](#detailed-budget)
7. [Conclusion & Future Work](#conclusion--future-work)
8. [Links](#links)


## Introduction

Landslides remain a significant threat in hilly regions of Sri Lanka, often triggered by intense monsoon rainfall. **SlideSense** is an integrated IoT solution designed for real-time monitoring of high-risk slopes. 

The system moves beyond simple data logging by incorporating:
- **Redundant Communication:** Utilizing both Cloud (AWS/Firebase) and Local (Gateway) paths.
- **Edge Intelligence:** Real-time threshold analysis on the ESP32 to trigger immediate local sirens.
- **Resilience:** Designed to function even when external cellular networks fail during heavy storms.

  
## Overall System Architecture

SlideSense follows a **multi-layer IoT architecture**:

- **Perception Layer:** Distributed sensor nodes (ESP32) collect soil moisture, volumetric water content, and tilt data.
- **Network Layer:** Data is transmitted via MQTT protocol to a central Raspberry Pi gateway and subsequently to the AWS IoT Core.
- **Application Layer:** A React-based web dashboard and Firebase Cloud Messaging (FCM) provide localized alerts and historical data visualization for authorities.


## Data Flow Architecture

The system ensures reliable and redundant data transmission:

1. Sensors collect environmental data  
2. ESP32 performs edge analysis  
3. Data transmitted via LoRa / SIM900A  
4. Cloud (AWS/Firebase) processes & stores data  
5. Alerts triggered via Dashboard / SMS / FCM  

<p align="center">
  <img src="./docs/images/data_flow.png" width="750"/>
</p>


##  Core Components

- **ESP32 WROOM 32U**
- **Capacitive Soil Moisture Sensors (x4)**
- **Tipping Bucket Rain Gauge**
- **High Sensitivity Microphone Sensor**
- **LoRa RA-02 SX1278 Module**
- **SIM900A GSM Module**
- **20W Solar Panel**
- **MPPT Charge Controller**
- **3.7V Li-Po Battery**

## ⚡ Power System

- MPPT Solar Charging
- 3.3V Regulation
- Deep Sleep Power Optimization


## Software Architecture & Stack

## 🧠 Firmware
- Arduino Framework
- FreeRTOS Task Management
- MQTT Communication
- Deep Sleep Mode

## ☁️ Backend & Cloud
- AWS IoT Core / Firebase
- Mosquitto MQTT Broker
- Node.js Gateway (Optional)
- Firebase Cloud Messaging (Alerts)

## 🖥 Frontend
- React.js Dashboard
- Real-time Data Visualization
- Alert Monitoring Panel

## 🛠 Software Stack Diagram

<p align="center">
  <img src="./docs/images/Software_Stack.png" width="750"/>
</p>

##  Project Timeline

The project was executed in four structured milestones:

- Milestone 01 – Proposal & Planning  
- Milestone 02 – Hardware Setup & Testing  
- Milestone 03 – Working Prototype  
- Milestone 04 – Final Product & Documentation  

<p align="center">
  <img src="./docs/images/Time_line.png" width="900"/>
</p>


## Detailed Budget

| Item | Quantity | Unit Cost (LKR) | Total (LKR) |
| :--- | :---: | :---: | :---: |
| 20W Solar Panel | 1 | 3,350 | 3,350 |
| Li-Po Battery | 1 | 1,185 | 1,185 |
| MPPT Controller | 1 | 1,450 | 1,450 |
| Voltage Regulator | 1 | 120 | 120 |
| ESP32 | 1 | 1,860 | 1,860 |
| Soil Moisture Sensor | 4 | 290 | 1,160 |
| Tipping Bucket | 1 | 4,000 | 4,000 |
| LoRa Module | 1 | 1,500 | 1,500 |
| Microphone Sensor | 1 | 200 | 200 |
| SIM900A | 1 | 1,450 | 1,450 |
| **Total Cost** |  |  | **16,275 LKR** |


## Conclusion & Future Work

SlideSense demonstrates a **cost-effective, scalable, and resilient landslide monitoring system** integrating edge intelligence with cloud-based alerts.

### Future Enhancements
- LoRaWAN integration for extended mountainous coverage  
- Machine Learning (LSTM-based rainfall prediction)  
- IP67-rated rugged enclosure  
- Mobile application for public warning  
