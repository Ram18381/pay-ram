const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Render provides DATABASE_URL; local dev uses individual DB_* vars
const pool = process.env.DATABASE_URL
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    })
    : new Pool({
        host:     process.env.DB_HOST,
        port:     process.env.DB_PORT,
        database: process.env.DB_NAME,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
    });

// Test connection and auto-initialize tables on startup
pool.connect(async (err, client, release) => {
    if (err) {
        console.error('❌ Database connection failed:', err.message);
        return;
    }
    console.log('✅ Connected to PostgreSQL database');
    try {
        const schemaPath = path.join(__dirname, 'schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            await client.query(schemaSql);
            console.log('✅ Database schema initialized successfully');
        }
    } catch (schemaErr) {
        console.error('⚠️ Schema init notice/error:', schemaErr.message);
    } finally {
        release();
    }
});

module.exports = pool;
