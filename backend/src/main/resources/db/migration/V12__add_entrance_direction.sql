ALTER TABLE entrance_logs
    ADD COLUMN direction VARCHAR(10) NOT NULL DEFAULT 'IN';

ALTER TABLE entrance_logs
    ALTER COLUMN direction DROP DEFAULT;
