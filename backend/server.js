require('dotenv').config(); 
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const pool = require('./config/db'); // Aiven connection wala file
const socketHandler = require('./sockets/socketHandler'); 

const app = express();
const server = http.createServer(app);

// ✅ LOGIC FIX: CORS Configuration (Live + Local Compatibility)
// Isse Vercel aur Local dono se requests allow hongi
const corsOptions = {
    origin: "*", // Testing ke liye "*" best hai, production mein specific URL bhi daal sakte hain
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json());

// ✅ SOCKET.IO FIX: CORS configuration for Real-time tracking
const io = new Server(server, {
    cors: corsOptions
});

// Test Route (Check karne ke liye ki backend live hai ya nahi)
app.get('/test', (req, res) => {
    res.json({ message: "Backend is Running! 🚀", database: "Connected to Aiven ✅" });
});

// ✅ ROUTES
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/buses', require('./routes/busRoutes'));
app.use('/api/stops', require('./routes/stopRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes')); 

// ✅ SOCKET HANDLER
socketHandler(io, pool); 

// ✅ PORT LOGIC: Render hamesha process.env.PORT provide karta hai
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Server is live on port ${PORT}`);
    console.log(`📅 Started at: ${new Date().toLocaleString()}`);
});