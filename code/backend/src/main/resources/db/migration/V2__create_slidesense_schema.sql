CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(160) NOT NULL,
    phone_number VARCHAR(30),
    address TEXT,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'RESIDENT',
    registration_status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (role IN ('RESIDENT', 'ADMIN', 'RESEARCHER')),
    CHECK (registration_status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'))
);

CREATE TABLE probes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hw_serial VARCHAR(64) UNIQUE NOT NULL,
    firmware_ver VARCHAR(20),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    status VARCHAR(20) NOT NULL DEFAULT 'ONLINE',
    installed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (status IN ('ONLINE', 'OFFLINE', 'MAINTENANCE'))
);

CREATE TABLE devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    device_token TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE registration_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    requested_role VARCHAR(20) NOT NULL DEFAULT 'RESIDENT',
    probe_id UUID REFERENCES probes(id),
    reason TEXT NOT NULL,
    verification_notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK (requested_role IN ('RESIDENT', 'RESEARCHER')),
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    CHECK (
        (requested_role = 'RESIDENT' AND probe_id IS NOT NULL) OR
        (requested_role = 'RESEARCHER' AND probe_id IS NULL)
    )
);

CREATE TABLE probe_access_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    probe_id UUID NOT NULL REFERENCES probes(id),
    granted_by UUID NOT NULL REFERENCES users(id),
    granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked_at TIMESTAMPTZ,
    UNIQUE (user_id, probe_id)
);

CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    probe_id UUID NOT NULL REFERENCES probes(id),
    level SMALLINT NOT NULL,
    triggered_at TIMESTAMPTZ NOT NULL,
    resolved_at TIMESTAMPTZ,
    details JSONB,
    CHECK (level IN (1, 2, 3))
);

CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_email VARCHAR(255) NOT NULL,
    key_hash TEXT NOT NULL,
    rate_limit INT NOT NULL DEFAULT 100,
    scopes TEXT[] NOT NULL DEFAULT ARRAY['read']::TEXT[],
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sensor_readings (
    id BIGSERIAL NOT NULL,
    probe_id UUID NOT NULL REFERENCES probes(id),
    recorded_at TIMESTAMPTZ NOT NULL,
    moisture REAL,
    tilt_angle REAL,
    vibration_mag REAL,
    sampling_mode VARCHAR(10),
    CHECK (sampling_mode IS NULL OR sampling_mode IN ('NORMAL', 'ELEVATED', 'BURST')),
    PRIMARY KEY (id, recorded_at)
);

CREATE TABLE rainfall_readings (
    id BIGSERIAL NOT NULL,
    probe_id UUID NOT NULL REFERENCES probes(id),
    recorded_at TIMESTAMPTZ NOT NULL,
    rainfall_mm REAL,
    PRIMARY KEY (id, recorded_at)
);

SELECT create_hypertable('sensor_readings', 'recorded_at', if_not_exists => TRUE);
SELECT create_hypertable('rainfall_readings', 'recorded_at', if_not_exists => TRUE);

CREATE INDEX idx_sensor_readings_probe_time ON sensor_readings (probe_id, recorded_at DESC);
CREATE INDEX idx_rainfall_readings_probe_time ON rainfall_readings (probe_id, recorded_at DESC);
CREATE INDEX idx_alerts_probe_triggered_at ON alerts (probe_id, triggered_at DESC);
CREATE INDEX idx_probe_access_grants_user_active ON probe_access_grants (user_id) WHERE revoked_at IS NULL;

CREATE MATERIALIZED VIEW sensor_aggregates
WITH (timescaledb.continuous) AS
SELECT
    probe_id,
    time_bucket('1 hour', recorded_at) AS bucket,
    AVG(moisture)::REAL AS avg_moisture,
    MAX(vibration_mag) AS max_vibration
FROM sensor_readings
GROUP BY probe_id, bucket
WITH NO DATA;

CREATE MATERIALIZED VIEW rainfall_aggregates
WITH (timescaledb.continuous) AS
SELECT
    probe_id,
    time_bucket('1 hour', recorded_at) AS bucket,
    SUM(rainfall_mm)::REAL AS total_rainfall
FROM rainfall_readings
GROUP BY probe_id, bucket
WITH NO DATA;

CREATE INDEX idx_sensor_aggregates_probe_bucket ON sensor_aggregates (probe_id, bucket DESC);
CREATE INDEX idx_rainfall_aggregates_probe_bucket ON rainfall_aggregates (probe_id, bucket DESC);
