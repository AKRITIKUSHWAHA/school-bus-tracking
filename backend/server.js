require('dotenv').config(); 
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const pool = require('./config/db');
const socketHandler = require('./sockets/socketHandler'); 

const app = express();
const server = http.createServer(app);

// ✅ FIX 1: Socket.io CORS ko specific allow karo
const io = new Server(server, {
    cors: { 
        origin: "http://localhost:5173", // Vite ka default port
        methods: ["GET", "POST"]
    }
});

// ✅ FIX 2: Express CORS Middleware ko configure karo
app.use(cors({
    origin: "http://localhost:5173", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());

// Test Route
app.get('/test', (req, res) => {
    res.send("Backend is Running! 🚀");
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/buses', require('./routes/busRoutes'));
app.use('/api/stops', require('./routes/stopRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes')); 

// Socket.io logic
socketHandler(io, pool); 

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📅 Date: ${new Date().toLocaleString()}`);
});