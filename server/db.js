const { Pool } = require('pg');
require('dotenv').config();

function createPool() {
    if (process.env.DATABASE_URL) {
        // Render Internal URLs (e.g. dpg-xxx-a) DO NOT support SSL.
        // Render External URLs (*.render.com) REQUIRE SSL.
        const requiresSsl = process.env.DATABASE_URL.includes('.render.com') ||
                            process.env.DATABASE_URL.includes('sslmode=require');

        return new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: requiresSsl ? { rejectUnauthorized: false } : false
        });
    }

    return new Pool({
        host:     process.env.DB_HOST,
        port:     process.env.DB_PORT,
        database: process.env.DB_NAME,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });
}

const pool = createPool();

// Automatically ensure tables exist on startup
async function initTables() {
    const createEmployees = `
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
    );`;

    const createHistory = `
    CREATE TABLE IF NOT EXISTS payment_history (
        id          SERIAL         PRIMARY KEY,
        employee_id VARCHAR(50)    NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        entry_date  DATE           NOT NULL DEFAULT CURRENT_DATE,
        hours       NUMERIC(10, 2) NOT NULL,
        gross_pay   NUMERIC(10, 2) NOT NULL,
        net_pay     NUMERIC(10, 2) NOT NULL,
        created_at  TIMESTAMPTZ    NOT NULL DEFAULT NOW()
    );`;

    try {
        await pool.query(createEmployees);
        await pool.query(createHistory);
        console.log('✅ Tables verified / initialized in PostgreSQL');
    } catch (err) {
        console.error('❌ Table init error:', err.message);
    }
}

// Test connection on startup and run table check
pool.connect(async (err, client, release) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        return;
    }
    console.log('✅ Connected to PostgreSQL database');
    release();
    await initTables();
});

module.exports = pool;
