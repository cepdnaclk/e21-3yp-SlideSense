-- V6__create_thresholds_and_security_logs_tables.sql

CREATE TABLE threshold_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rainfall_threshold DOUBLE PRECISION NOT NULL,
    moisture_threshold DOUBLE PRECISION NOT NULL,
    vibration_threshold DOUBLE PRECISION NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO threshold_settings (id, rainfall_threshold, moisture_threshold, vibration_threshold)
VALUES ('00000000-0000-0000-0000-000000000000', 60.0, 70.0, 55.0);

CREATE TABLE security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event VARCHAR(255) NOT NULL,
    detail TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO security_logs (id, event, detail, created_at)
VALUES 
  (gen_random_uuid(), 'Successful admin login', 'Session established from trusted network', '2026-05-25 08:12:00+05:30'),
  (gen_random_uuid(), 'Failed login attempt', 'Unknown IP blocked after retry limit', '2026-05-25 09:04:00+05:30'),
  (gen_random_uuid(), 'Theft alert', 'Tilt sensor movement detected on probe network', '2026-05-25 09:18:00+05:30');
