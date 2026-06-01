# SlideSense DynamoDB Backend (Spring Boot)

A separate lightweight backend to read latest landslide sensor readings from DynamoDB.

## 1) What this provides

- `GET /api/landslide/latest` -> full latest record (m1, m2, m3, avg_moisture, rain, tilt, risk, lat, lng)
- `GET /api/landslide/latest/simple` -> simple key/value response (`moisture`, `rain`, `tilt`)
- `GET /api/landslide/health` -> health check

Default device ID is `LandslideProject/Prob01`, but you can override with query param:

- `/api/landslide/latest?deviceID=LandslideProject/Prob01`

## 2) AWS SDK dependency

Already added in [pom.xml](pom.xml):

- `software.amazon.awssdk:dynamodb:2.20.0`

## 3) Configure AWS credentials

Use one of these common options on your machine / server:

- Environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`
- AWS profile in `~/.aws/credentials`
- IAM role (recommended for Elastic Beanstalk EC2)

The app uses region from `application.properties`:

- `app.dynamodb.region=ap-south-1`

## 4) Run locally

From this folder:

```bash
mvn clean package
mvn spring-boot:run
```

Test:

- `http://localhost:8080/api/landslide/latest`
- `http://localhost:8080/api/landslide/latest/simple`

## 5) Deploy to Elastic Beanstalk (Java platform)

1. Build JAR:
   - `mvn clean package`
2. Open AWS Elastic Beanstalk Console.
3. Create environment:
   - Tier: `Web server environment`
   - Platform: `Java`
   - Application code: upload `target/backend-dynamodb-0.0.1-SNAPSHOT.jar`
   - Preset: `Single instance (free tier eligible)`
4. IAM permissions (critical):
   - Find instance profile role used by Beanstalk (often `aws-elasticbeanstalk-ec2-role`)
   - Attach `AmazonDynamoDBReadOnlyAccess`

## 6) Optional env overrides in Beanstalk

Set these environment properties if needed:

- `APP_DYNAMODB_REGION=ap-south-1`
- `APP_DYNAMODB_TABLE_NAME=LandslideData`
- `APP_DYNAMODB_DEFAULT_DEVICE_ID=LandslideProject/Prob01`
