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

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Fallback: serve index.html for any non-API route ─────────────────────────
app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`🚀 Pay-RAm server running at http://localhost:${PORT}`);
});
