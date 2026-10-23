const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// ── GET /api/employees ───────────────────────────────────────────────────────
// Returns all employees with their payment history
router.get('/', async (req, res) => {
    try {
        const empResult = await pool.query(
            'SELECT * FROM employees ORDER BY created_at ASC'
        );
        const histResult = await pool.query(
            'SELECT * FROM payment_history ORDER BY created_at ASC'
        );

        // Attach payment history to each employee
        const historyMap = {};
        histResult.rows.forEach(h => {
            if (!historyMap[h.employee_id]) historyMap[h.employee_id] = [];
            historyMap[h.employee_id].push({
                id:        h.id,
                date:      new Date(h.entry_date).toLocaleDateString(),
                hours:     parseFloat(h.hours),
                grossPay:  parseFloat(h.gross_pay),
                netPay:    parseFloat(h.net_pay),
            });
        });

        const employees = empResult.rows.map(emp => ({
            id:             emp.id,
            name:           emp.name,
            position:       emp.position,
            department:     emp.department,
            hourlyRate:     parseFloat(emp.hourly_rate),
            taxRate:        parseFloat(emp.tax_rate),
            bonus:          parseFloat(emp.bonus),
            hoursWorked:    parseFloat(emp.hours_worked),
            paymentHistory: historyMap[emp.id] || [],
        }));

        res.json(employees);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

// ── POST /api/employees ──────────────────────────────────────────────────────
// Creates a new employee
router.post('/', async (req, res) => {
    const { id, name, position, department, hourlyRate, taxRate, bonus } = req.body;

    if (!id || !name || !position || !department || hourlyRate == null) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO employees (id, name, position, department, hourly_rate, tax_rate, bonus)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [id, name, position, department, hourlyRate, taxRate ?? 20, bonus ?? 0]
        );

        const emp = result.rows[0];
        res.status(201).json({
            id:          emp.id,
            name:        emp.name,
            position:    emp.position,
            department:  emp.department,
            hourlyRate:  parseFloat(emp.hourly_rate),
            taxRate:     parseFloat(emp.tax_rate),
            bonus:       parseFloat(emp.bonus),
            hoursWorked: parseFloat(emp.hours_worked),
            paymentHistory: [],
        });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ error: 'Employee ID already exists' });
        }
        console.error(err);
        res.status(500).json({ error: 'Failed to create employee' });
    }
});

// ── DELETE /api/employees/:id ────────────────────────────────────────────────
// Deletes an employee (payment_history rows cascade automatically)
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM employees WHERE id = $1 RETURNING id',
            [req.params.id]
        );
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json({ message: 'Employee deleted', id: req.params.id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
});

// ── POST /api/employees/:id/hours ────────────────────────────────────────────
// Adds hours to an employee and records a payment_history entry
router.post('/:id/hours', async (req, res) => {
    const { hours } = req.body;
    if (!hours || isNaN(hours)) {
        return res.status(400).json({ error: 'Invalid hours value' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Fetch current employee data
        const empResult = await client.query(
            'SELECT * FROM employees WHERE id = $1 FOR UPDATE',
            [req.params.id]
        );
        if (empResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Employee not found' });
        }

        const emp           = empResult.rows[0];
        const newHours      = parseFloat(emp.hours_worked) + parseFloat(hours);
        const grossPay      = (newHours * parseFloat(emp.hourly_rate)) + parseFloat(emp.bonus);
        const taxAmount     = grossPay * (parseFloat(emp.tax_rate) / 100);
        const netPay        = grossPay - taxAmount;

        // Update hours_worked
        await client.query(
            'UPDATE employees SET hours_worked = $1 WHERE id = $2',
            [newHours, req.params.id]
        );

        // Insert payment history record
        const histResult = await client.query(
            `INSERT INTO payment_history (employee_id, hours, gross_pay, net_pay)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [req.params.id, hours, grossPay, netPay]
        );

        await client.query('COMMIT');

        const h = histResult.rows[0];
        res.json({
            hoursWorked: newHours,
            historyEntry: {
                id:       h.id,
                date:     new Date(h.entry_date).toLocaleDateString(),
                hours:    parseFloat(h.hours),
                grossPay: parseFloat(h.gross_pay),
                netPay:   parseFloat(h.net_pay),
            }
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err);
        res.status(500).json({ error: 'Failed to add hours' });
    } finally {
        client.release();
    }
});

module.exports = router;
