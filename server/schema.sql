-- Run this script once to set up the database schema.
-- psql -U postgres -d payram_db -f server/schema.sql

CREATE TABLE IF NOT EXISTS employees (
    id              VARCHAR(50)    PRIMARY KEY,
    name            VARCHAR(100)   NOT NULL,
    position        VARCHAR(100)   NOT NULL,
    department      VARCHAR(100)   NOT NULL,
    hourly_rate     NUMERIC(10, 2) NOT NULL,
    tax_rate        NUMERIC(5, 2)  NOT NULL DEFAULT 20,
    bonus           NUMERIC(10, 2) NOT NULL DEFAULT 0,
    hours_worked    NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payment_history (
    id          SERIAL         PRIMARY KEY,
    employee_id VARCHAR(50)    NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    entry_date  DATE           NOT NULL DEFAULT CURRENT_DATE,
    hours       NUMERIC(10, 2) NOT NULL,
    gross_pay   NUMERIC(10, 2) NOT NULL,
    net_pay     NUMERIC(10, 2) NOT NULL,
    created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on employee row changes
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS employees_updated_at ON employees;
CREATE TRIGGER employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
