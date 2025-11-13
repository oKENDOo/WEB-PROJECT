// 📄 ไฟล์: routes/equipmentRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db'); 

// --- 1. GET: ค้นหาและดึงข้อมูล Equipment ---
router.get('/equipments', (req, res) => {
    const { name, category, status } = req.query;
    
    let sql = 'SELECT * FROM Equipment WHERE 1=1';
    const params = [];

    if (name) {
        sql += ' AND Name LIKE ?';
        params.push(`%${name}%`);
    }
    if (category) {
        sql += ' AND Category LIKE ?';
        params.push(`%${category}%`);
    }
    if (status) {
        sql += ' AND Status LIKE ?';
        params.push(`%${status}%`);
    }

    sql += ' ORDER BY Equipment_ID ASC';

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error: ' + err.message });
        res.json(results);
    });
});

// --- 2. GET: ดึงข้อมูล Equipment 1 ชิ้น (By ID) ---
router.get('/equipments/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM Equipment WHERE Equipment_ID = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        if (results.length === 0) return res.status(404).json({ success: false, message: 'Not found' });
        res.json(results[0]);
    });
});

// --- 3. POST: เพิ่ม Equipment ใหม่ ---
router.post('/equipments', (req, res) => {
    const { Name, Category, QuantityAvailable, RentalPrice, Location, Status } = req.body;

    db.query('SELECT MAX(Equipment_ID) as maxId FROM Equipment', (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        let newId = 'E0000001';
        if (results[0].maxId) {
            const currentMax = parseInt(results[0].maxId.substring(1));
            const nextId = currentMax + 1;
            newId = 'E' + nextId.toString().padStart(7, '0');
        }

        const sql = `INSERT INTO Equipment (Equipment_ID, Name, Category, QuantityAvailable, RentalPrice, Location, Status) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const values = [newId, Name, Category, QuantityAvailable, RentalPrice, Location, Status];

        db.query(sql, values, (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Insert failed: ' + err.message });
            res.json({ success: true, message: 'Equipment added successfully', id: newId });
        });
    });
});

// --- 4. PUT: แก้ไขข้อมูล Equipment ---
router.put('/equipments/:id', (req, res) => {
    const id = req.params.id;
    const { Name, Category, QuantityAvailable, RentalPrice, Location, Status } = req.body;

    const sql = `UPDATE Equipment SET Name=?, Category=?, QuantityAvailable=?, RentalPrice=?, Location=?, Status=? WHERE Equipment_ID=?`;
    const values = [Name, Category, QuantityAvailable, RentalPrice, Location, Status, id];

    db.query(sql, values, (err) => {
        if (err) return res.status(500).json({ success: false, message: 'Update failed: ' + err.message });
        res.json({ success: true, message: 'Equipment updated successfully' });
    });
});

// --- 5. DELETE: ลบ Equipment ---
router.delete('/equipments/:id', (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM Equipment WHERE Equipment_ID = ?', [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Cannot delete (Foreign Key constraint)' });
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Data not found' });
        res.json({ success: true, message: 'Deleted successfully' });
    });
});

module.exports = router;