CREATE TABLE artists (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    genre VARCHAR(255),
    biography VARCHAR(4000),
    image_url VARCHAR(1000),
    spotify_id VARCHAR(255)
);

CREATE TABLE songs (
    id BIGSERIAL PRIMARY KEY,
    artist_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    duration_seconds INTEGER,
    spotify_id VARCHAR(255),
    preview_url VARCHAR(1000),
    CONSTRAINT fk_songs_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE
);

CREATE INDEX idx_songs_artist_id ON songs(artist_id);
