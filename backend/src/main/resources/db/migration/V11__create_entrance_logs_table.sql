CREATE TABLE entrance_logs (
    id BIGSERIAL PRIMARY KEY,
    bracelet_id BIGINT NOT NULL,
    entry_timestamp TIMESTAMP(6),
    CONSTRAINT fk_entrance_log_bracelet FOREIGN KEY (bracelet_id) REFERENCES bracelets (id) ON DELETE CASCADE
);
