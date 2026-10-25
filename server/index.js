require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const employeeRoutes = require('./routes/employees');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Serve the frontend static files from the project root
app.use(express.static(path.join(__dirname, '..')));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/employees', employeeRoutes);

// ── Health & Diagnostics ──────────────────────────────────────────────────────
const pool = require('./db');
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/db-test', async (req, res) => {
    try {
        const client = await pool.connect();
        const testRes = await client.query('SELECT NOW() as now');
        client.release();
        res.json({
            connected: true,
            now: testRes.rows[0].now,
            hasDbUrl: Boolean(process.env.DATABASE_URL),
            dbUrlType: process.env.DATABASE_URL ? (process.env.DATABASE_URL.includes('.render.com') ? 'external' : 'internal') : 'none'
        });
    } catch (err) {
        res.status(500).json({
            connected: false,
            error: err.message || String(err),
            hasDbUrl: Boolean(process.env.DATABASE_URL),
            dbUrlType: process.env.DATABASE_URL ? (process.env.DATABASE_URL.includes('.render.com') ? 'external' : 'internal') : 'none'
        });
    }
});

// ── Fallback: serve index.html for any non-API route ─────────────────────────
app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Pay-RAm server running at http://localhost:${PORT}`);
});
