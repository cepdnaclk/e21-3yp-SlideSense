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

For a ready-to-edit template, copy `.env.example` to `.env` and adjust values for your machine.

Notes:

- `application.properties` is not a shell env file.
- It is the Spring Boot config file, and it can read environment variables using syntax like `${SPRING_DATASOURCE_URL:defaultValue}`.
- Use `.env` for local exported variables or editor tooling, and keep `.env.example` in git as the template.

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

## 9) Frontend Support Endpoints

New endpoints have been added to fully support the dynamic interactions required by the frontend application (`frontend-new`), replacing previously mocked data sources.

- **Probe Data (`ProbeDataController`)**
  - `GET /api/v1/probes/readings` - Returns paginated comprehensive sensor reading histories for all active probes.
  - `GET /api/v1/probes/latest` - Returns the latest captured snapshot for a specific probe.

- **Alerts (`AlertController`)**
  - `GET /api/v1/alerts` - Returns dynamically generated system alerts (e.g., critical movement detection based on tilt angle thresholds).

- **Dashboard Configurations (`DashboardController`)**
  - `GET /api/v1/dashboard/admin` - Returns admin thresholds, user lists, and security logs.
  - `GET /api/v1/dashboard/researcher` - Returns researcher analytics configurations.
  - `GET /api/v1/dashboard/resident` - Returns safety content and resident guidelines.
  - `GET /api/v1/dashboard/analytics-config` - Provides default metric options and time ranges for interactive graphs.

## 10) Authentication & Role-Based Access

The backend implements a robust, stateless JWT-based authentication system using Spring Security.

- **Login Flow**: Users authenticate via `POST /auth/login` by providing their `email` and `password`. The backend verifies the credentials against BCrypt password hashes in the database.
- **JWT Tokens**: Upon successful login, the backend issues an `accessToken` and `refreshToken` inside an `AuthResponse`. The frontend must include the access token in the `Authorization: Bearer <token>` header for all subsequent protected requests. The `AuthResponse` also cleanly returns the `user` object (including their `role`) so the frontend can properly route them to their dashboard.
- **Role-Based Access Control (RBAC)**: 
  - `JwtAuthenticationFilter` intercepts requests to validate the JWT and automatically populate the `SecurityContext`.
  - Endpoints are explicitly secured based on roles. For example, `GET /api/v1/probes/readings` requires `@PreAuthorize("hasRole('ADMIN') or hasRole('RESEARCHER')")` to prevent unauthorized broad data access.
  - Residents are restricted to `GET /api/v1/probes/my-readings`, where the `FrontendDataService` dynamically filters data to ensure they only receive readings for probes they have been explicitly granted access to via the `probe_access_grants` table.
- **CORS**: The application is configured with a global CORS policy allowing credentials, ensuring smooth communication between the React frontend and Spring Boot backend.

## 11) Soft Deletion of Probes

Probes (nodes) can be safely "removed" from the active system without deleting their historical data from the database.
- **Deactivation**: `DELETE /admin/probes/{probeId}` soft-deletes a probe by updating its `status` to `DEACTIVATED`. 
- **Data Integrity**: All associated `sensor_readings`, `rainfall_readings`, and `alerts` remain intact for historical queries.
- **Frontend Filtering**: The `FrontendDataService` automatically filters out `DEACTIVATED` probes from active live queries (`/api/v1/probes/readings` and `/api/v1/probes/my-readings`), ensuring removed nodes vanish from the active dashboard immediately.
- **Database Schema**: A new Flyway migration (`V5__add_deactivated_status_to_probes.sql`) modifies the PostgreSQL `CHECK` constraint on `probes.status` to safely permit the `DEACTIVATED` value.
