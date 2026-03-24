const express = require('express');
const router = express.Router();
const protect = require('../middleware/authMiddleware');
const {
    getTodayAttendance,
    markAttendance,
    getChildAttendance,
    getETA,
    addStudent,
    getAllStudents,
    updateStudent,
    deleteStudent,
} = require('../controllers/attendanceController');

// Driver
router.get('/today/:busId', protect, getTodayAttendance);
router.post('/mark', protect, markAttendance);

// Parent
router.get('/my-child', protect, getChildAttendance);
router.get('/eta/:busId', protect, getETA);

// Admin
router.post('/add-student', protect, addStudent);
router.get('/students', protect, getAllStudents);
router.put('/update-student/:id', protect, updateStudent);     // ← Naya
router.delete('/delete-student/:id', protect, deleteStudent);  // ← Naya

module.exports = router;