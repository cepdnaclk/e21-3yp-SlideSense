---
layout: home
permalink: index.html
repository-name: e21-3yp-SlideSense
title: SlideSense
---

# SlideSense: AI-Powered IoT Landslide Monitoring System



## Team
- E/21/087, Shihara Dewagedara, [e21087@eng.pdn.ac.lk](mailto:e21087@eng.pdn.ac.lk)
- E/21/138, Fikry M.N.M., [e21138@eng.pdn.ac.lk](mailto:e21138@eng.pdn.ac.lk)
- E/21/302, Sahandi Perera, [e21302@eng.pdn.ac.lk](mailto:e21302@eng.pdn.ac.lk)
- E/21/452, Zaid M.R.M., [e21452@eng.pdn.ac.lk](mailto:e21452@eng.pdn.ac.lk)

![SlideSense Final Hardware Prototype](./images/Probe.png)

#### Table of Contents
1. [Introduction](#introduction)
2. [Solution Architecture](#solution-architecture)
3. [Hardware & Software Designs](#hardware-and-software-designs)
4. [Testing](#testing)
5. [Detailed Budget](#detailed-budget)
6. [Conclusion](#conclusion)
7. [Links](#links)


## Introduction

Landslides remain a significant threat in hilly regions of Sri Lanka, often triggered by intense monsoon rainfall. **SlideSense** is an integrated IoT solution designed for real-time monitoring of high-risk slopes. 

The system moves beyond simple data logging by incorporating:
- **Redundant Communication:** Utilizing both Cloud (AWS/Firebase) and Local (Gateway) paths.
- **Edge Intelligence:** Real-time threshold analysis on the ESP32 to trigger immediate local sirens.
- **Resilience:** Designed to function even when external cellular networks fail during heavy storms.


## Solution Architecture

SlideSense follows a multi-tier IoT architecture to ensure data integrity and low-latency alerting.



- **Perception Layer:** Distributed sensor nodes (ESP32) collect soil moisture, volumetric water content, and tilt data.
- **Network Layer:** Data is transmitted via MQTT protocol to a central Raspberry Pi gateway and subsequently to the AWS IoT Core.
- **Application Layer:** A React-based web dashboard and Firebase Cloud Messaging (FCM) provide localized alerts and historical data visualization for authorities.



## Hardware and Software Designs

### 1. Hardware Design
The core node consists of an **ESP32 Microcontroller** interfaced with:
- **Capacitive Soil Moisture Sensors:** To measure saturation levels without electrode corrosion.
- **MPU6050 Accelerometer/Gyroscope:** To detect micro-movements or sudden shifts in soil strata.
- **Tipping Bucket Rain Gauge:** To calculate rainfall intensity ($mm/hr$).
- **Power Management:** A 3.7V Li-ion battery system integrated with a TP4056 charging module and a 5V solar panel.

### 2. Software Design
- **Firmware:** Developed using the Arduino framework with FreeRTOS to manage concurrent tasks like sensor sampling and MQTT publishing.
- **Edge Analytics:** The ESP32 implements a "Burst Mode" logic—if moisture levels exceed a critical threshold ($>75\%$), the data sampling rate increases automatically.
- **Backend:** A Node.js environment on the Raspberry Pi manages a local Mosquitto MQTT broker, ensuring data is logged locally even if the internet connection is lost.



## Testing

### Hardware Testing
- **Sensor Calibration:** Capacitive moisture sensors were calibrated using dry and saturated soil samples to map voltage levels to percentage values.
- **Battery Life:** Power consumption analysis showed that in "Deep Sleep" mode, the node can operate for over 30 days on a single 2500mAh charge.

### Software & Connectivity Testing
- **Latency Test:** Measured average MQTT publish-to-alert time of $<2$ seconds under stable network conditions.
- **Failover Test:** Verified that the Raspberry Pi gateway successfully hosted a local Wi-Fi hotspot to broadcast alerts to nearby mobile devices when the WAN link was disconnected.


## Detailed Budget

| Item | Quantity | Unit Cost (LKR) | Total (LKR) |
| :--- | :---: | :---: | :---: |
| ESP32 Development Board | 2 | 1,850 | 3,700 |
| Raspberry Pi 4 (4GB) | 1 | 24,000 | 24,000 |
| Capacitive Soil Moisture Sensor | 3 | 450 | 1,350 |
| MPU6050 Gyro/Accel Sensor | 2 | 850 | 1,700 |
| Rain Gauge Module | 1 | 2,500 | 2,500 |
| Solar Panel (5V/2W) | 2 | 1,200 | 2,400 |
| Li-ion Battery (18650) | 2 | 950 | 1,900 |
| Enclosures & Misc (PVC, Wires) | - | 3,000 | 3,000 |
| **Total Cost** | | | **40,550 LKR** |



## Conclusion

SlideSense successfully demonstrates a cost-effective, scalable solution for landslide disaster mitigation. We achieved a stable integration between low-power hardware and cloud-based notification services. 

**Future Work:**
- Integration of **LoRaWAN** for better range in mountainous terrain.
- Implementing **Machine Learning** (LSTM networks) on the cloud to predict landslide probability based on historical rainfall patterns.
- Developing a ruggedized, 3D-printed IP67-rated enclosure for long-term field deployment.


## Links

- [Project Repository](https://github.com/cepdnaclk/{{ page.repository-name }}){:target="_blank"}
- [Project Page](https://cepdnaclk.github.io/{{ page.repository-name}}){:target="_blank"}
- [Department of Computer Engineering](http://www.ce.pdn.ac.lk/)
- [University of Peradeniya](https://eng.pdn.ac.lk/)
