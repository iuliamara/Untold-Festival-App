CREATE TABLE ticket_tiers (
    id VARCHAR(255) PRIMARY KEY,
    display_name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    price DOUBLE PRECISION NOT NULL,
    capacity BIGINT NOT NULL,
    quantity INT,
    sold BIGINT NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE
);
