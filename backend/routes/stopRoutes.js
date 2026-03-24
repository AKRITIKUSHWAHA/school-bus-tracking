const express = require('express');
const router = express.Router();
const db = require('../config/db');
const protect = require('../middleware/authMiddleware');

// POST: /api/stops/add-stop
router.post('/add-stop', protect, async (req, res) => {
    const { bus_id, stop_name, stop_lat, stop_lng, stop_order } = req.body;
    try {
        await db.execute(
            'INSERT INTO bus_stops (bus_id, stop_name, stop_lat, stop_lng, stop_order) VALUES (?, ?, ?, ?, ?)',
            [bus_id, stop_name, stop_lat, stop_lng, stop_order]
        );
        res.status(201).json({ success: true, msg: 'Stop added successfully! 📍' });
    } catch (err) {
        console.error("Error adding stop:", err);
        res.status(500).json({ msg: 'Error adding stop', error: err.message });
    }
});

// GET: /api/stops/bus/:busId — Bus ke saare stops fetch karo
router.get('/bus/:busId', protect, async (req, res) => {
    const { busId } = req.params;
    try {
        const [stops] = await db.execute(
            'SELECT * FROM bus_stops WHERE bus_id = ? ORDER BY stop_order ASC',
            [busId]
        );
        res.json(stops);
    } catch (err) {
        console.error("Error fetching stops:", err);
        res.status(500).json({ msg: 'Error fetching stops' });
    }
});

module.exports = router;