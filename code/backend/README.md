# SlideSense Backend (Spring Boot)

This backend is initialized with:

- Java 21
- Spring Boot 3.5.13
- Maven wrapper
- Spring Web, Spring Data JPA, Validation, Actuator
- PostgreSQL + Flyway
- TimescaleDB-ready setup

## 1) Start local TimescaleDB

From this folder, run:

```bash
docker compose up -d
```

This creates:

- DB: `slidesense`
- User: `slidesense`
- Password: `slidesense`
- Port: `5432`

## 2) Build and test

```bash
./mvnw test
./mvnw -DskipTests package
```

The test profile excludes DB auto-configuration, so build checks run even if the DB is not running.

## 3) Run the app

```bash
./mvnw spring-boot:run
```

Defaults in `src/main/resources/application.properties` point to local TimescaleDB. Override via env vars if needed:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `SERVER_PORT`

## 4) Verify health

Open:

- `http://localhost:8080/actuator/health`

## 5) IntelliJ workflow

- Open the `code/backend` directory as a Maven project in IntelliJ.
- Use Maven tool window commands (`test`, `package`, `spring-boot:run`) or Run Configuration.

## 6) Next for time-series schema

TimescaleDB extension is enabled through Flyway migration `V1__enable_timescaledb.sql`.
When you start defining your models, add a new migration to create hypertables, for example:

```sql
CREATE TABLE sensor_reading (
  id BIGSERIAL PRIMARY KEY,
  sensor_id TEXT NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL,
  value DOUBLE PRECISION NOT NULL
);

SELECT create_hypertable('sensor_reading', 'captured_at', if_not_exists => TRUE);
```
