#Send the email 1 hour

import json
import boto3
import time
from boto3.dynamodb.conditions import Key

sns = boto3.client('sns')
dynamodb = boto3.resource('dynamodb')

# CONFIGURATION
SNS_TOPIC_ARN = "arn:aws:sns:ap-south-1:314567759880:LandslideAlerts"
TABLE_NAME = "LandslideData" 
COOLDOWN_PERIOD = 3600        # 1 hour 

def lambda_handler(event, context):
    table = dynamodb.Table(TABLE_NAME)
    
    # Get sensor data
    m1 = event.get("m1", 0)
    m2 = event.get("m2", 0)
    m3 = event.get("m3", 0)
    rain = event.get("rain", 0)
    tilt = event.get("tilt", 0)
    
    # Define Danger Condition
    is_dangerous = (tilt == 0)

    if is_dangerous:
        # Check DynamoDB for the "LastAlert" timestamp
        try:
            response = table.get_item(Key={'deviceID': 'SYSTEM_STATUS', 'timestamp': 0})
            last_alert_time = response.get('Item', {}).get('last_email_sent', 0)
        except:
            last_alert_time = 0

        current_time = int(time.time())

        # Only send if enough time has passed
        if (current_time - last_alert_time) > COOLDOWN_PERIOD:
            message = f"🚨 Landslide Warning!\nMoisture: {m1}, {m2}, {m3}\nRain: {rain}mm\nTilt: {tilt}\nCheck system immediately."
            
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Message=message,
                Subject="CRITICAL: Landslide Alert"
            )
            
            # Update the "LastAlert" time in DynamoDB
            table.put_item(Item={
                'deviceID': 'SYSTEM_STATUS',
                'timestamp': 0,
                'last_email_sent': current_time
            })
            print("Alert sent and timestamp updated.")
        else:
            print("Danger detected, but email skipped due to cooldown.")

    return {'statusCode': 200, 'body': json.dumps('Process Complete')}