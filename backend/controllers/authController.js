const db = require('../config/db');
const jwt = require('jsonwebtoken');

// --- 1. Pehle wala Login Logic ---
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) return res.status(401).json({ message: "Email registered nahi hai!" });
    
    const user = rows[0];
    if (user.password !== password) return res.status(401).json({ message: "Galat password!" });

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: "Database error!" });
  }
};

// --- 2. Naya Update: Register Driver ---
const registerDriver = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const [exists] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (exists.length > 0) return res.status(400).json({ msg: 'Driver already exists' });

    await db.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, 'driver']
    );
    
    res.status(201).json({ msg: 'Driver created successfully! ✅' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error creating driver' });
  }
};

// --- 3. Naya Update: Generic Register ---
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    const [exists] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    if (exists.length > 0) return res.status(400).json({ msg: 'User already exists' });

    await db.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, role || 'parent']
    );
    
    res.status(201).json({ msg: `${role} created successfully! 🚀` });
  } catch (err) {
    res.status(500).json({ msg: 'Registration failed' });
  }
};

// --- 4. Naya Update: Update Password ---
const updatePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id; 

  try {
    const [rows] = await db.execute('SELECT password FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) return res.status(404).json({ msg: "User nahi mila!" });
    if (rows[0].password !== oldPassword) {
      return res.status(400).json({ success: false, msg: "Purana password galat hai!" });
    }
    await db.execute('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);
    res.json({ success: true, msg: "Password successfully updated! ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Database update failed!" });
  }
};

// --- 5. NAYA LOGIC: Saare Users Fetch Karna (For UsersList Page) ---
const getAllUsers = async (req, res) => {
  try {
    // Ham Admin, Driver, Parent sab fetch kar rahe hain password chhod kar
    const [rows] = await db.execute('SELECT id, name, email, role FROM users ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Users fetch karne mein error!" });
  }
};

// --- 6. NAYA LOGIC: User Delete Karna ---
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    // Admin khud ko delete na kar sake uske liye check (Optional)
    if (req.user.id == id) {
      return res.status(400).json({ msg: "Aap khud ka account delete nahi kar sakte!" });
    }

    await db.execute('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, msg: "User successfully deleted! 🗑️" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "User delete nahi ho paya!" });
  }
};

// --- EXPORTS: Saare functions yahan register hain ---
module.exports = {
  login,
  registerDriver,
  registerUser,
  updatePassword,
  getAllUsers, // <--- Naya add hua
  deleteUser   // <--- Naya add hua
};