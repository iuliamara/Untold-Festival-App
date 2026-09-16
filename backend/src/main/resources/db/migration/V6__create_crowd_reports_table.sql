CREATE TABLE crowd_reports (
    id BIGSERIAL PRIMARY KEY,
    map_pin_id BIGINT NOT NULL,
    density_level VARCHAR(20) NOT NULL,
    reported_by VARCHAR(255) NOT NULL,
    notes VARCHAR(1000),
    reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_crowd_reports_map_pin FOREIGN KEY (map_pin_id) REFERENCES map_pins(id) ON DELETE CASCADE
);

CREATE INDEX idx_crowd_reports_map_pin_id ON crowd_reports(map_pin_id);
CREATE INDEX idx_crowd_reports_reported_at ON crowd_reports(reported_at);
