-- V4__add_test_data.sql

-- Insert Users (Password: password123)
-- Admin
INSERT INTO users (id, email, full_name, phone_number, password_hash, role, registration_status, created_at)
VALUES (
    '11111111-1111-1111-1111-111111111111', 
    'admin@test.com', 
    'Admin User', 
    '555-0100', 
    '$2b$12$DeYCYwlP7EP7IhtRWhmKfOzMpnmSh6V8Kmgsf2wdR3HbW1STOTnRO', 
    'ADMIN', 
    'APPROVED', 
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Resident
INSERT INTO users (id, email, full_name, phone_number, password_hash, role, registration_status, created_at)
VALUES (
    '22222222-2222-2222-2222-222222222222', 
    'resident@test.com', 
    'Resident User', 
    '555-0200', 
    '$2b$12$DeYCYwlP7EP7IhtRWhmKfOzMpnmSh6V8Kmgsf2wdR3HbW1STOTnRO', 
    'RESIDENT', 
    'APPROVED', 
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Insert Probes
INSERT INTO probes (id, probe_id, hw_serial, firmware_ver, latitude, longitude, status, installed_at)
VALUES (
    '33333333-3333-3333-3333-333333333333',
    'P-TEST-01',
    'SN-TEST-01',
    '1.0.0',
    7.2906,
    80.6337,
    'ONLINE',
    NOW()
) ON CONFLICT (probe_id) DO NOTHING;

INSERT INTO probes (id, probe_id, hw_serial, firmware_ver, latitude, longitude, status, installed_at)
VALUES (
    '44444444-4444-4444-4444-444444444444',
    'P-TEST-02',
    'SN-TEST-02',
    '1.0.0',
    7.2910,
    80.6340,
    'ONLINE',
    NOW()
) ON CONFLICT (probe_id) DO NOTHING;

-- Grant access to Resident for P-TEST-01
INSERT INTO probe_access_grants (id, user_id, probe_id, granted_by, granted_at)
VALUES (
    gen_random_uuid(),
    '22222222-2222-2222-2222-222222222222',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    NOW()
) ON CONFLICT (user_id, probe_id) DO NOTHING;

-- Insert Mock Sensor Readings for P-TEST-01
INSERT INTO sensor_readings (probe_id, recorded_at, moisture, tilt_angle, vibration_mag, sampling_mode)
VALUES 
    ('33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '15 minutes', 45.2, 2.1, 12.0, 'NORMAL'),
    ('33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '10 minutes', 46.5, 2.1, 13.5, 'NORMAL'),
    ('33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '5 minutes', 48.0, 2.2, 11.2, 'NORMAL'),
    ('33333333-3333-3333-3333-333333333333', NOW(), 49.1, 2.2, 14.1, 'NORMAL');

-- Insert Mock Sensor Readings for P-TEST-02 (Resident won't see these)
INSERT INTO sensor_readings (probe_id, recorded_at, moisture, tilt_angle, vibration_mag, sampling_mode)
VALUES 
    ('44444444-4444-4444-4444-444444444444', NOW() - INTERVAL '10 minutes', 60.5, 5.1, 25.5, 'NORMAL'),
    ('44444444-4444-4444-4444-444444444444', NOW(), 62.0, 5.2, 26.2, 'NORMAL');
