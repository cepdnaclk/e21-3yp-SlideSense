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

## 5) Swagger and security

- Swagger UI: `http://localhost:8080/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8080/v3/api-docs`

Auth schemes:

- User APIs use Bearer JWT (`Authorization: Bearer <token>`)
- Public research APIs use API key header (`X-API-Key: <issued-key>`)

## 6) IntelliJ workflow

- Open the `code/backend` directory as a Maven project in IntelliJ.
- Use Maven tool window commands (`test`, `package`, `spring-boot:run`) or Run Configuration.

## 7) IntelliJ migration verification checklist

1. Start DB: `docker compose up -d`
2. Ensure schema is fresh only if needed:
  - Optional reset: `docker compose down -v` then `docker compose up -d`
3. Run app from IntelliJ (`BackendApplication`) or `./mvnw spring-boot:run`.
4. Confirm Flyway startup logs show `V1__enable_timescaledb.sql` and `V2__create_slidesense_schema.sql` applied (or already up to date).
5. Validate objects in PostgreSQL:
  - `\dt` should include relational tables and hypertables.
  - `\dm+` should show continuous aggregates.
  - `SELECT * FROM flyway_schema_history ORDER BY installed_rank;` should list V1 and V2 success.
6. Check API health: `http://localhost:8080/actuator/health`

## 8) Next for time-series schema

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
