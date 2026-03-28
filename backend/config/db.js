const mysql = require('mysql2');

// --- PURANA LOCAL DB CODE (COMMENTED) ---
/*
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'school_bus_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Connection check karne ke liye
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('MySQL Workbench Connected... ✅');
  connection.release();
});
*/
// ----------------------------------------

// --- NAYA AIVEN LIVE DB CODE ---
const pool = mysql.createPool({
  host: process.env.DB_HOST,      // Aiven ka Host yahan aayega (.env se)
  user: process.env.DB_USER,      // avnadmin
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,  // defaultdb
  port: process.env.DB_PORT,      // Aiven wala port (e.g. 12345)
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false     // Aiven live connection ke liye compulsory hai
  }
});

// Live Connection check karne ke liye
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Aiven Database connection failed: ' + err.stack);
    return;
  }
  console.log('Aiven MySQL Live Connected... 🚀 ✅');
  connection.release();
});
// ----------------------------------------

module.exports = pool.promise();


// CREATE DATABASE school_bus_db;
// USE school_bus_db;

// CREATE TABLE users (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   name VARCHAR(100),
//   email VARCHAR(100) UNIQUE,
//   password VARCHAR(100),
//   role ENUM('admin', 'driver', 'parent') DEFAULT 'parent'
// );

// select * from users;
// select* from buses;

// -- Admin user
// INSERT INTO users (name, email, password, role) VALUES ('School Admin', 'admin@test.com', 'admin123', 'admin');

// -- Driver user
// INSERT INTO users (name, email, password, role) VALUES ('Rajesh Driver', 'driver@test.com', 'driver123', 'driver');

// -- Parent user
// INSERT INTO users (name, email, password, role) VALUES ('Mohit Parent', 'parent@test.com', 'parent123', 'parent');


// CREATE TABLE buses (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   busNumber VARCHAR(50) UNIQUE,
//   driver_id INT,
//   route VARCHAR(255),
//   status VARCHAR(50) DEFAULT 'Parked',
//   lat DECIMAL(10, 8) DEFAULT 28.6139,
//   lng DECIMAL(11, 8) DEFAULT 77.2090,
//   FOREIGN KEY (driver_id) REFERENCES users(id)
// );