ALTER TABLE personal_schedule
    ADD COLUMN client_request_id VARCHAR(36);

CREATE UNIQUE INDEX uq_personal_schedule_user_request
    ON personal_schedule(user_id, client_request_id)
    WHERE client_request_id IS NOT NULL;
