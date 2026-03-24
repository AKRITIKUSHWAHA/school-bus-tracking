const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');
const protect = require('../middleware/authMiddleware'); // Tera chowkidar middleware

// 1. Saari buses ki list (Admin Dashboard table ke liye)
// GET: /api/buses
router.get('/', protect, busController.getAllBuses);

// 2. Nayi Bus register karna (Admin Dashboard "Add New" button ke liye)
// POST: /api/buses/register
router.post('/register', protect, busController.registerBus);

// 3. Bus ka status update karna (Driver "Start/Stop Trip" ke liye)
// PUT: /api/buses/update-status
router.put('/update-status', protect, busController.updateBusStatus);

// 4. Bus ki location MySQL mein save karna (Backup ke liye)
// PUT: /api/buses/update-location
router.put('/update-location', protect, busController.updateBusLocation);

// 5. Ek specific bus ka data (Optional: Parent View ke liye)
// GET: /api/buses/:busId
// router.get('/:busId', protect, busController.getBusById); 

module.exports = router;