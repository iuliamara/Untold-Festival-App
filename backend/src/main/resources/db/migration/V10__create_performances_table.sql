CREATE TABLE performances (
    id BIGSERIAL PRIMARY KEY,
    artist_id BIGINT NOT NULL,
    stage_id BIGINT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    CONSTRAINT fk_performances_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE RESTRICT,
    CONSTRAINT fk_performances_stage FOREIGN KEY (stage_id) REFERENCES map_pins(id) ON DELETE RESTRICT
);

CREATE INDEX idx_performances_artist ON performances(artist_id);
CREATE INDEX idx_performances_stage ON performances(stage_id);
CREATE INDEX idx_performances_start ON performances(start_time);
