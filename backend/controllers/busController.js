const db = require('../config/db');

// Helper Function: Distance nikalne ke liye (Haversine Formula)
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
};

// 1. Saari buses fetch karna
exports.getAllBuses = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT b.*, u.name as driverName 
      FROM buses b 
      LEFT JOIN users u ON b.driver_id = u.id
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Fetch Error:", err);
    res.status(500).json({ msg: 'Error fetching buses' });
  }
};

// 2. Nayi Bus register karna
exports.registerBus = async (req, res) => {
  const { busNumber, driver_id, route, status } = req.body;
  try {
    const [driverExists] = await db.execute('SELECT id FROM users WHERE id = ?', [driver_id]);
    if (driverExists.length === 0) {
      return res.status(400).json({ success: false, msg: `❌ Driver ID ${driver_id} nahi mila!` });
    }
    await db.execute(
      'INSERT INTO buses (busNumber, driver_id, route, status) VALUES (?, ?, ?, ?)',
      [busNumber, driver_id, route, status || 'Parked']
    );
    res.status(201).json({ success: true, msg: 'Bus Registered successfully! 🚌' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, msg: 'Ye Bus Number pehle se hai!' });
    res.status(500).json({ success: false, msg: 'Database Error: ' + err.message });
  }
};

// 3. Status update
exports.updateBusStatus = async (req, res) => {
  const { busId, status } = req.body;
  try {
    // Jab trip start ho, tabhi location track shuru hogi
    await db.execute('UPDATE buses SET status = ? WHERE busNumber = ?', [status, busId]);
    res.json({ success: true, msg: `Status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ msg: 'Error updating status' });
  }
};

// 4. Location sync + Stop Detection (IMPORTANT UPDATE)
exports.updateBusLocation = async (req, res) => {
  const { busId, lat, lng } = req.body;
  try {
    // A. Pehle bus ki location update karo
    await db.execute('UPDATE buses SET lat = ?, lng = ? WHERE busNumber = ?', [lat, lng, busId]);

    // B. Is bus ke saare stops fetch karo (bus_stops table se)
    const [stops] = await db.execute('SELECT * FROM bus_stops WHERE bus_id = (SELECT id FROM buses WHERE busNumber = ?) ORDER BY stop_order', [busId]);

    let reachedStop = "In Transit"; // Default status

    // C. Check karo ki kya bus kisi stop ke 100 meters (0.1 km) ke andar hai
    for (const stop of stops) {
        const dist = getDistance(lat, lng, stop.stop_lat, stop.stop_lng);
        if (dist < 0.1) { // 100 meters
            reachedStop = stop.stop_name;
            // Database mein update karo ki abhi bus is stop par hai
            await db.execute('UPDATE buses SET current_stop = ? WHERE busNumber = ?', [reachedStop, busId]);
            break; 
        }
    }

    res.json({ 
        success: true, 
        msg: 'Location synced', 
        currentStop: reachedStop 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error updating location' });
  }
};