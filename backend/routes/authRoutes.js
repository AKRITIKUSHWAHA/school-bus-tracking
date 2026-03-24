const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const protect = require('../middleware/authMiddleware'); 

// Ek simple middleware jo sirf Admin ko allow kare
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Access Denied: Sirf Admin hi users dekh sakta hai" });
    }
};

router.post('/login', authController.login);

// Register Routes (Admin Protected)
router.post('/register-driver', protect, adminOnly, authController.registerDriver);
router.post('/register', protect, adminOnly, authController.registerUser);

// User Management (Admin Protected)
router.get('/all-users', protect, adminOnly, authController.getAllUsers);
router.delete('/user/:id', protect, adminOnly, authController.deleteUser);

// Profile & Settings
router.post('/update-password', protect, authController.updatePassword);

module.exports = router;