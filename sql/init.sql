-- ========================================
-- EXTENSIONS & ENUM TYPES
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role_enum AS ENUM ('user', 'admin');
CREATE TYPE created_by_type_enum AS ENUM ('user', 'admin');
CREATE TYPE reservation_status_enum AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- ========================================
-- TABLE: CUISINES
-- ========================================
CREATE TABLE cuisines (
    id   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE
);

-- ========================================
-- TABLE: RESTAURANTS
-- ========================================
CREATE TABLE restaurants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            TEXT NOT NULL,
    cuisine_id      UUID NOT NULL REFERENCES cuisines(id),
    address         TEXT NOT NULL,
    rating_value    NUMERIC(2,1) NOT NULL DEFAULT 0.0,
    rating_count    INTEGER NOT NULL DEFAULT 0,
    work_time_from  TIME NOT NULL,
    work_time_to    TIME NOT NULL,
    image_url       TEXT NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT rating_value_range CHECK (rating_value >= 0.0 AND rating_value <= 5.0),
    CONSTRAINT rating_count_nonneg CHECK (rating_count >= 0)
);
CREATE INDEX idx_restaurants_cuisine ON restaurants(cuisine_id);
CREATE INDEX idx_restaurants_active ON restaurants(is_active);

-- ========================================
-- TABLE: USERS
-- ========================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    telegram_id     BIGINT UNIQUE,
    full_name       TEXT NOT NULL,
    phone           TEXT NOT NULL UNIQUE,
    role            user_role_enum NOT NULL,
    restaurant_id   UUID REFERENCES restaurants(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_restaurant ON users(restaurant_id);

-- ========================================
-- TABLE: HALLS
-- ========================================
CREATE TABLE halls (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id   UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    color_code      TEXT NOT NULL,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_halls_restaurant ON halls(restaurant_id);
CREATE INDEX idx_halls_sort_order ON halls(restaurant_id, sort_order);

-- ========================================
-- TABLE: TABLES (STOLY)
-- ========================================
CREATE TABLE tables (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hall_id         UUID NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
    table_number    INTEGER NOT NULL,
    seats           INTEGER NOT NULL,
    position_index  INTEGER NOT NULL DEFAULT 0,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT seats_positive CHECK (seats > 0)
);
CREATE UNIQUE INDEX uq_tables_hall_table_number ON tables(hall_id, table_number);
CREATE INDEX idx_tables_hall_position ON tables(hall_id, position_index);

-- ========================================
-- TABLE: RESERVATIONS
-- ========================================
CREATE TABLE reservations (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id       UUID NOT NULL REFERENCES restaurants(id),
    hall_id             UUID NOT NULL REFERENCES halls(id),
    table_id            UUID NOT NULL REFERENCES tables(id),
    user_id             UUID REFERENCES users(id),
    created_by_type     created_by_type_enum NOT NULL,
    created_by_admin_id UUID REFERENCES users(id),
    guest_name          TEXT,
    guest_phone         TEXT,
    date                DATE NOT NULL,
    time_from           TIME NOT NULL,
    time_to             TIME NOT NULL,
    guests_count        INTEGER NOT NULL,
    status              reservation_status_enum NOT NULL DEFAULT 'pending',
    cancel_reason       TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT guests_positive CHECK (guests_count > 0),
    CONSTRAINT time_interval_valid CHECK (time_to > time_from),
    CONSTRAINT creator_present CHECK (
        user_id IS NOT NULL
        OR (guest_phone IS NOT NULL AND guest_phone <> '')
    )
);
CREATE INDEX idx_reservations_restaurant_date ON reservations(restaurant_id, date);
CREATE INDEX idx_reservations_user_date ON reservations(user_id, date DESC);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_table_date_time ON reservations(table_id, date, time_from, time_to);

-- Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION set_reservations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_reservations_set_updated_at
BEFORE UPDATE ON reservations
FOR EACH ROW
EXECUTE FUNCTION set_reservations_updated_at();

-- ========================================
-- TABLE: RESERVATION STATUS HISTORY
-- ========================================
CREATE TABLE reservation_status_history (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id      UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    from_status         reservation_status_enum,
    to_status           reservation_status_enum NOT NULL,
    changed_by_admin_id UUID REFERENCES users(id),
    changed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_status_history_reservation ON reservation_status_history(reservation_id);
CREATE INDEX idx_status_history_changed_at ON reservation_status_history(changed_at DESC);

-- ========================================
-- ANALYTICS: DAILY
-- ========================================
CREATE TABLE analytics_daily (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id           UUID NOT NULL REFERENCES restaurants(id),
    date                    DATE NOT NULL,
    total_reservations      INTEGER NOT NULL DEFAULT 0,
    confirmed_reservations  INTEGER NOT NULL DEFAULT 0,
    pending_reservations    INTEGER NOT NULL DEFAULT 0,
    cancelled_reservations  INTEGER NOT NULL DEFAULT 0,
    completed_reservations  INTEGER NOT NULL DEFAULT 0,
    total_guests            INTEGER NOT NULL DEFAULT 0,
    peak_hour               SMALLINT NOT NULL DEFAULT 0,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_peak_hour_range CHECK (peak_hour BETWEEN 0 AND 23),
    CONSTRAINT analytics_daily_nonneg CHECK (
        total_reservations >= 0 AND
        confirmed_reservations >= 0 AND
        pending_reservations >= 0 AND
        cancelled_reservations >= 0 AND
        completed_reservations >= 0 AND
        total_guests >= 0
    )
);
CREATE UNIQUE INDEX uq_analytics_daily_restaurant_date ON analytics_daily(restaurant_id, date);

-- ========================================
-- ANALYTICS: HOURLY
-- ========================================
CREATE TABLE analytics_hourly (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id       UUID NOT NULL REFERENCES restaurants(id),
    date                DATE NOT NULL,
    hour                SMALLINT NOT NULL,
    reservations_count  INTEGER NOT NULL DEFAULT 0,
    guests_count        INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_hour_range CHECK (hour BETWEEN 0 AND 23),
    CONSTRAINT analytics_hourly_nonneg CHECK (
        reservations_count >= 0 AND
        guests_count >= 0
    )
);
CREATE UNIQUE INDEX uq_analytics_hourly_restaurant_date_hour
ON analytics_hourly(restaurant_id, date, hour);

-- ========================================
-- ANALYTICS: HALL POPULARITY
-- ========================================
CREATE TABLE analytics_hall_popularity (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id       UUID NOT NULL REFERENCES restaurants(id),
    hall_id             UUID NOT NULL REFERENCES halls(id),
    period_from         DATE NOT NULL,
    period_to           DATE NOT NULL,
    reservations_count  INTEGER NOT NULL DEFAULT 0,
    guests_count        INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_period_valid CHECK (period_to >= period_from),
    CONSTRAINT analytics_hall_pop_nonneg CHECK (
        reservations_count >= 0 AND
        guests_count >= 0
    )
);
CREATE INDEX idx_analytics_hall_restaurant
ON analytics_hall_popularity(restaurant_id, hall_id);

-- ========================================
-- ROLES
-- ========================================
CREATE ROLE app_read NOLOGIN;
CREATE ROLE app_write NOLOGIN;
CREATE ROLE app_admin NOLOGIN;

GRANT SELECT ON
    cuisines, restaurants, users, halls, tables,
    reservations, reservation_status_history,
    analytics_daily, analytics_hourly, analytics_hall_popularity
TO app_read;

GRANT SELECT, INSERT, UPDATE, DELETE ON
    cuisines, restaurants, users, halls, tables,
    reservations, reservation_status_history,
    analytics_daily, analytics_hourly, analytics_hall_popularity
TO app_write;

GRANT ALL PRIVILEGES ON
    cuisines, restaurants, users, halls, tables,
    reservations, reservation_status_history,
    analytics_daily, analytics_hourly, analytics_hall_popularity
TO app_admin;

-- ========================================
-- TEST DATA
-- ========================================

-- 1. CUISINES
INSERT INTO cuisines (id, name) VALUES
('aaa11111-1111-1111-1111-111111111111', 'Italian'),
('aaa11111-1111-1111-1111-222222222222', 'Japanese'),
('aaa11111-1111-1111-1111-333333333333', 'American');

-- 2. RESTAURANT
INSERT INTO restaurants (
    id, name, cuisine_id, address,
    rating_value, rating_count,
    work_time_from, work_time_to, image_url
)
VALUES (
    'bbb22222-2222-2222-2222-222222222222',
    'La Bella Vista',
    'aaa11111-1111-1111-1111-111111111111',
    'Via Roma 24, Milano',
    4.8, 540,
    '10:00', '23:00',
    'https://picsum.photos/400/300'
);

-- 3. USERS
INSERT INTO users (id, telegram_id, full_name, phone, role)
VALUES (
    'ccc33333-3333-3333-3333-333333333333',
    987654321,
    'Anna Litvinova',
    '+37060010001',
    'user'
);

INSERT INTO users (id, full_name, phone, role, restaurant_id)
VALUES (
    'ccc44444-4444-4444-4444-444444444444',
    'Admin Bella',
    '+37060020002',
    'admin',
    'bbb22222-2222-2222-2222-222222222222'
);

-- 4. HALLS
INSERT INTO halls (id, restaurant_id, name, color_code, sort_order)
VALUES
('ddd55555-5555-5555-5555-555555555555',
 'bbb22222-2222-2222-2222-222222222222',
 'Main Hall', '#72A2FF', 1),
('ddd66666-6666-6666-6666-666666666666',
 'bbb22222-2222-2222-2222-222222222222',
 'Terrace', '#FFB8B8', 2);

-- 5. TABLES
INSERT INTO tables (id, hall_id, table_number, seats, position_index)
VALUES
('eee77777-7777-7777-7777-777777777777', 'ddd55555-5555-5555-5555-555555555555', 1, 2, 1),
('eee88888-8888-8888-8888-888888888888', 'ddd55555-5555-5555-5555-555555555555', 2, 4, 2),
('eee99999-9999-9999-9999-999999999999', 'ddd55555-5555-5555-5555-555555555555', 3, 4, 3),
('eee10101-1010-1010-1010-101010101010', 'ddd55555-5555-5555-5555-555555555555', 4, 6, 4),
('eee12121-1212-1212-1212-121212121212', 'ddd66666-6666-6666-6666-666666666666', 1, 4, 1),
('eee13131-1313-1313-1313-131313131313', 'ddd66666-6666-6666-6666-666666666666', 2, 2, 2);

-- 6. RESERVATIONS
INSERT INTO reservations (
    id, restaurant_id, hall_id, table_id,
    user_id, created_by_type,
    date, time_from, time_to, guests_count,
    status
) VALUES (
    'fff14141-1414-1414-1414-141414141414',
    'bbb22222-2222-2222-2222-222222222222',
    'ddd55555-5555-5555-5555-555555555555',
    'eee77777-7777-7777-7777-777777777777',
    'ccc33333-3333-3333-3333-333333333333',
    'user',
    '2025-12-05', '18:00', '20:00',
    2, 'pending'
);

INSERT INTO reservations (
    id, restaurant_id, hall_id, table_id,
    created_by_type, created_by_admin_id,
    guest_name, guest_phone,
    date, time_from, time_to, guests_count,
    status
) VALUES (
    'fff15151-1515-1515-1515-151515151515',
    'bbb22222-2222-2222-2222-222222222222',
    'ddd66666-6666-6666-6666-666666666666',
    'eee12121-1212-1212-1212-121212121212',
    'admin',
    'ccc44444-4444-4444-4444-444444444444',
    'Julia Markova',
    '+37060030003',
    '2025-12-05', '19:00', '21:00',
    3, 'confirmed'
);

-- 7. STATUS HISTORY
INSERT INTO reservation_status_history (id, reservation_id, from_status, to_status, changed_by_admin_id)
VALUES
(uuid_generate_v4(), 'fff14141-1414-1414-1414-141414141414', NULL, 'pending', NULL),
(uuid_generate_v4(), 'fff15151-1515-1515-1515-151515151515', 'pending', 'confirmed', 'ccc44444-4444-4444-4444-444444444444');

-- 8. ANALYTICS
INSERT INTO analytics_daily (
    id, restaurant_id, date,
    total_reservations, confirmed_reservations,
    pending_reservations, cancelled_reservations,
    completed_reservations, total_guests, peak_hour
)
VALUES (
    uuid_generate_v4(),
    'bbb22222-2222-2222-2222-222222222222',
    '2025-12-05',
    2, 1, 1, 0, 0,
    5, 19
);

-- DONE

