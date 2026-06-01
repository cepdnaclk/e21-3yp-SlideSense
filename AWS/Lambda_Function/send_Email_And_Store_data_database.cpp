import json
import boto3
import time
from decimal import Decimal

sns = boto3.client('sns')
dynamodb = boto3.resource('dynamodb')

SNS_TOPIC_ARN = "arn:aws:sns:ap-south-1:314567759880:LandslideAlerts"
TABLE_NAME = "LandslideData"
COOLDOWN_PERIOD = 3600  # 1 hour

def lambda_handler(event, context):
    table = dynamodb.Table(TABLE_NAME)

    # --- Get sensor data ---
    deviceID = event.get('deviceID', 'Prob-01')
    m1 = event.get("m1", 0)
    m2 = event.get("m2", 0)
    m3 = event.get("m3", 0)
    rain = event.get("rain", 0)
    tilt = event.get("tilt", 0)
    lat = event.get("lat", 0.0)
    lng = event.get("lng", 0.0)

    # --- Calculate average ---
    avg_moisture = Decimal(str((m1 + m2 + m3) / 3))

    # --- Risk logic ---
    if avg_moisture > 80 and rain > 5:
        risk = "HIGH"
    elif avg_moisture > 60 and rain > 2:
        risk = "MODERATE"
    else:
        risk = "LOW"

    current_time = int(time.time())

    # --- Store data in DynamoDB ---
    table.put_item(Item={
        'deviceID': deviceID,
        'timestamp': current_time,
        'm1': m1,
        'm2': m2,
        'm3': m3,
        'avg_moisture': avg_moisture,
        'rain': rain,
        'tilt': tilt,
        'risk': risk,
        'lat': Decimal(str(lat)),
        'lng': Decimal(str(lng))

    })

    # --- Alert logic (ONLY for HIGH risk) ---
    if tilt == 0:
        try:
            response = table.get_item(Key={'deviceID': 'SYSTEM_STATUS', 'timestamp': 0})
            last_alert_time = response.get('Item', {}).get('last_email_sent', 0)
        except:
            last_alert_time = 0

        if (current_time - last_alert_time) > COOLDOWN_PERIOD:

            message = f"""
                            🚨 LANDSLIDE ALERT 🚨

                            Risk Level: {risk}

                            Moisture: {m1}, {m2}, {m3}
                            Average: {avg_moisture:.2f}%

                            Rain: {rain} mm
                            Tilt: {tilt}
                        """

            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Message=message,
                Subject="CRITICAL: Landslide Alert"
            )

            # Update cooldown
            table.put_item(Item={
                'deviceID': 'SYSTEM_STATUS',
                'timestamp': 0,
                'last_email_sent': current_time
            })

            print("Alert sent!")
        else:
            print("Cooldown active, alert skipped.")

    return {
        'statusCode': 200,
        'body': json.dumps({'risk': risk})
    }