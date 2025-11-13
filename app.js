// ไฟล์: app.js
require('dotenv').config(); 
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// เรียกใช้ Routes ที่แยกไว้
const userRoutes = require('./routes/userRoutes');
const facilityRoutes = require('./routes/facilityRoutes');
const equipmentRoutes = require('./routes/equipmentRoutes');

const app = express();
const port = process.env.PORT || 3000; 

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// --- Static Files (Frontend) ---
// '../sec2_gr3_fe_src' หมายถึงโฟลเดอร์ Frontend 
const frontendPath = path.join(__dirname, '../sec2_gr3_fe_src');
app.use(express.static(frontendPath));
// บรรทัดนี้สำคัญ! เผื่อใน HTML เรียกไฟล์ด้วย /sec2_gr3_fe_src/...
app.use('/sec2_gr3_fe_src', express.static(frontendPath));

// --- Page Routes (ลิ้งค์หน้าเว็บหลัก) ---
app.get('/', (req, res) => {
    console.log("Welcome to "+req.url)
    res.sendFile(path.join(frontendPath, 'Landing.html'));
});


// --- API Routes ---
// API ทั้งหมดจะขึ้นต้นด้วย /api เช่น /api/users, /api/admin/login
app.use('/api', userRoutes); 
app.use('/api', facilityRoutes);
app.use('/api', equipmentRoutes);

// --- Start Server ---
app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});