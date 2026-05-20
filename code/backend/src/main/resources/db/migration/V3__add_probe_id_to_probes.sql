ALTER TABLE probes ADD COLUMN probe_id VARCHAR(64);

UPDATE probes
SET probe_id = id::text
WHERE probe_id IS NULL;

ALTER TABLE probes ALTER COLUMN probe_id SET NOT NULL;

CREATE UNIQUE INDEX uk_probes_probe_id ON probes (probe_id);
