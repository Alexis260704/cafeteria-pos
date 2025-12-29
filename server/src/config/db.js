// src/config/db.js
const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10, // Cuántas conexiones simultáneas permites
    queueLimit: 0
});

// Usamos pool.promise() para poder usar async/await más adelante (más moderno)
module.exports = pool.promise();