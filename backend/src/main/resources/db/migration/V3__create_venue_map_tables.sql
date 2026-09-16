CREATE TABLE venue_maps (
    id BIGSERIAL PRIMARY KEY,
    image_url VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE map_pins (
    id BIGSERIAL PRIMARY KEY,
    map_id BIGINT NOT NULL,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(1000),
    x_pos DOUBLE PRECISION NOT NULL,
    y_pos DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_map_pins_map FOREIGN KEY (map_id) REFERENCES venue_maps (id) ON DELETE CASCADE
);

CREATE INDEX idx_map_pins_map_id ON map_pins(map_id);
