// ไฟล์: db.js
require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'sec2_gr3_database'
});

db.connect((err) => {
    if (err) {
        console.error('❌ เชื่อมต่อ Database ไม่ได้:', err);
    } else {
        console.log(`✅ เชื่อมต่อ Database: ${process.env.DB_NAME} สำเร็จแล้ว!`);
    }
});

module.exports = db;