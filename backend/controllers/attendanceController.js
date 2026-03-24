// controllers/attendanceController.js

const db = require('../config/db');

// Haversine formula — 2 points ke beech distance (km mein)
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ── 1. Aaj ki attendance list lao (Driver ke liye) ──────────────────
exports.getTodayAttendance = async (req, res) => {
    const { busId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    try {
        // Students fetch karo jo is bus pe registered hain
        const [students] = await db.execute(`
            SELECT 
                s.id as student_id,
                s.name as student_name,
                s.parent_id,
                COALESCE(a.is_present, FALSE) as is_present,
                a.marked_at
            FROM students s
            LEFT JOIN attendance a 
                ON a.bus_id = s.bus_id 
                AND a.student_name = s.name 
                AND a.trip_date = ?
            WHERE s.bus_id = ?
            ORDER BY s.name
        `, [today, busId]);

        res.json({ success: true, students, date: today });
    } catch (err) {
        console.error('Attendance fetch error:', err);
        res.status(500).json({ msg: 'Error fetching attendance' });
    }
};

// ── 2. Attendance mark karo (Driver) ────────────────────────────────
exports.markAttendance = async (req, res) => {
    const { busId, studentName, isPresent, parentId } = req.body;
    const today = new Date().toISOString().split('T')[0];

    try {
        // Pehle check karo ki record hai ya nahi
        const [existing] = await db.execute(
            'SELECT id FROM attendance WHERE bus_id = ? AND student_name = ? AND trip_date = ?',
            [busId, studentName, today]
        );

        if (existing.length > 0) {
            // Update karo
            await db.execute(
                'UPDATE attendance SET is_present = ?, marked_at = NOW() WHERE id = ?',
                [isPresent, existing[0].id]
            );
        } else {
            // Naya record banao
            await db.execute(
                'INSERT INTO attendance (bus_id, student_name, parent_id, trip_date, is_present, marked_at) VALUES (?, ?, ?, ?, ?, NOW())',
                [busId, studentName, parentId || null, today, isPresent]
            );
        }

        res.json({ 
            success: true, 
            msg: `${studentName} — ${isPresent ? '✅ Present' : '❌ Absent'}`
        });
    } catch (err) {
        console.error('Mark attendance error:', err);
        res.status(500).json({ msg: 'Error marking attendance' });
    }
};

// ── 3. Parent ke liye — apne bachhe ki attendance dekho ─────────────
exports.getChildAttendance = async (req, res) => {
    const parentId = req.user.id;

    try {
        const [records] = await db.execute(`
            SELECT 
                a.trip_date,
                a.student_name,
                a.is_present,
                a.marked_at,
                b.busNumber,
                b.route
            FROM attendance a
            JOIN buses b ON a.bus_id = b.id
            WHERE a.parent_id = ?
            ORDER BY a.trip_date DESC
            LIMIT 30
        `, [parentId]);

        res.json({ success: true, records });
    } catch (err) {
        console.error('Child attendance error:', err);
        res.status(500).json({ msg: 'Error fetching child attendance' });
    }
};

// ── 4. ETA Calculate karo ───────────────────────────────────────────
exports.getETA = async (req, res) => {
    const { busId } = req.params;
    const BUS_SPEED_KMH = 30; // Average school bus speed

    try {
        // Bus ki current location
        const [busRows] = await db.execute(
            'SELECT lat, lng, status FROM buses WHERE id = ?',
            [busId]
        );

        if (busRows.length === 0) {
            return res.status(404).json({ msg: 'Bus nahi mili' });
        }

        const bus = busRows[0];

        if (bus.status !== 'On Trip') {
            return res.json({ 
                success: true, 
                eta: null, 
                msg: 'Bus abhi trip pe nahi hai',
                status: bus.status
            });
        }

        // Is bus ke saare stops fetch karo order se
        const [stops] = await db.execute(
            'SELECT * FROM bus_stops WHERE bus_id = ? ORDER BY stop_order ASC',
            [busId]
        );

        if (stops.length === 0) {
            return res.json({ success: true, eta: null, msg: 'Koi stop nahi mila' });
        }

        // Har stop ka ETA calculate karo
        const stopsWithETA = stops.map(stop => {
            const distanceKm = getDistance(bus.lat, bus.lng, stop.stop_lat, stop.stop_lng);
            const etaMinutes = Math.round((distanceKm / BUS_SPEED_KMH) * 60);
            
            return {
                stop_id: stop.id,
                stop_name: stop.stop_name,
                stop_order: stop.stop_order,
                distance_km: distanceKm.toFixed(2),
                eta_minutes: etaMinutes,
                eta_text: etaMinutes <= 1 
                    ? 'Pahunch gayi!' 
                    : `${etaMinutes} minutes mein`
            };
        });

        // Sabse paas wala stop
        const nearest = stopsWithETA.reduce((prev, curr) => 
            prev.distance_km < curr.distance_km ? prev : curr
        );

        res.json({
            success: true,
            bus_status: bus.status,
            bus_location: { lat: bus.lat, lng: bus.lng },
            nearest_stop: nearest,
            all_stops_eta: stopsWithETA
        });

    } catch (err) {
        console.error('ETA error:', err);
        res.status(500).json({ msg: 'ETA calculate nahi ho paya' });
    }
};

// ── 5. Student add karo (Admin) ──────────────────────────────────────
exports.addStudent = async (req, res) => {
    const { name, parent_id, bus_id, stop_id } = req.body;

    try {
        await db.execute(
            'INSERT INTO students (name, parent_id, bus_id, stop_id) VALUES (?, ?, ?, ?)',
            [name, parent_id || null, bus_id || null, stop_id || null]
        );
        res.status(201).json({ success: true, msg: `${name} added successfully! 🎒` });
    } catch (err) {
        console.error('Add student error:', err);
        res.status(500).json({ msg: 'Student add nahi ho paya' });
    }
};

// ── 6. Saare students lao (Admin/Driver) ────────────────────────────
exports.getAllStudents = async (req, res) => {
    try {
        const [students] = await db.execute(`
            SELECT 
                s.*,
                u.name as parent_name,
                u.email as parent_email,
                b.busNumber,
                bs.stop_name
            FROM students s
            LEFT JOIN users u ON s.parent_id = u.id
            LEFT JOIN buses b ON s.bus_id = b.id
            LEFT JOIN bus_stops bs ON s.stop_id = bs.id
            ORDER BY s.name
        `);
        res.json({ success: true, students });
    } catch (err) {
        res.status(500).json({ msg: 'Error fetching students' });
    }
};

// ── 7. Student Update (Admin) ────────────────────────────────────
exports.updateStudent = async (req, res) => {
    const { id } = req.params;
    const { name, parent_id, bus_id, stop_id } = req.body;
    try {
        await db.execute(
            'UPDATE students SET name = ?, parent_id = ?, bus_id = ?, stop_id = ? WHERE id = ?',
            [name, parent_id || null, bus_id || null, stop_id || null, id]
        );
        res.json({ success: true, msg: 'Student updated successfully! ✅' });
    } catch (err) {
        console.error('Update student error:', err);
        res.status(500).json({ msg: 'Error updating student' });
    }
};

// ── 8. Student Delete (Admin) ────────────────────────────────────
exports.deleteStudent = async (req, res) => {
    const { id } = req.params;
    try {
        await db.execute('DELETE FROM students WHERE id = ?', [id]);
        res.json({ success: true, msg: 'Student deleted! 🗑️' });
    } catch (err) {
        console.error('Delete student error:', err);
        res.status(500).json({ msg: 'Error deleting student' });
    }
};