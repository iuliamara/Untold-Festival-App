CREATE TABLE persons (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(255),
    country VARCHAR(255),
    city VARCHAR(255),
    document_type VARCHAR(255),
    document_id VARCHAR(255),
    phone_number VARCHAR(255)
);

CREATE TABLE tickets (
    id BIGSERIAL PRIMARY KEY,
    ticket_type VARCHAR(255),
    price DOUBLE PRECISION,
    purchase_date TIMESTAMP(6),
    check_in_completed BOOLEAN DEFAULT FALSE,
    person_id BIGINT,
    CONSTRAINT fk_ticket_person FOREIGN KEY (person_id) REFERENCES persons (id) ON DELETE SET NULL
);

CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    ticket_id BIGINT NOT NULL,
    order_type VARCHAR(50) DEFAULT 'TICKET_PURCHASE' NOT NULL,
    amount_paid DOUBLE PRECISION,
    purchase_date TIMESTAMP(6),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_ticket FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE
);

CREATE TABLE bracelets (
    id BIGSERIAL PRIMARY KEY,
    rfid_tag VARCHAR(255),
    balance DOUBLE PRECISION DEFAULT 0.0,
    ticket_id BIGINT NOT NULL UNIQUE,
    CONSTRAINT fk_bracelet_ticket FOREIGN KEY (ticket_id) REFERENCES tickets (id) ON DELETE CASCADE
);
