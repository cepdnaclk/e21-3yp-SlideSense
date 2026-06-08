DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT conname INTO constraint_name
    FROM pg_constraint
    WHERE conrelid = 'probes'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE 'ALTER TABLE probes DROP CONSTRAINT ' || constraint_name;
    END IF;
END $$;

ALTER TABLE probes ADD CONSTRAINT probes_status_check CHECK (status IN ('ONLINE', 'OFFLINE', 'MAINTENANCE', 'DEACTIVATED'));
