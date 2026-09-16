CREATE TABLE personal_schedule (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    artist_name VARCHAR(255) NOT NULL,
    stage_name VARCHAR(255) NOT NULL,
    start_time VARCHAR(5) NOT NULL,
    end_time VARCHAR(5) NOT NULL,
    alarm_offset INT NOT NULL DEFAULT 10,
    CONSTRAINT fk_personal_schedule_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_personal_schedule_user_id ON personal_schedule (user_id);
