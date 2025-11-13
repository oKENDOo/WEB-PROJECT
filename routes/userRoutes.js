// ไฟล์: routes/userRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../db'); // เรียกใช้ db.js

// --- 1. Admin Login ---
router.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM Admin WHERE username = ? AND password = ?';

    db.query(sql, [username, password], (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Server error' });
        if (results.length > 0) {
            const admin = results[0];
            res.json({ 
                success: true, 
                message: 'Login successful', 
                adminId: admin.Admin_ID,
                role: admin.Role,
                name: admin.FName + ' ' + admin.LName
            });
        } else {
            res.json({ success: false, message: 'Username หรือ Password ไม่ถูกต้อง' });
        }
    });
});

// --- 2. Get All Users & Admins (Search) ---
router.get('/users', (req, res) => {
    const { username, email, role } = req.query;
    let conditionSql = "";
    const searchParams = []; 

    if (username) { conditionSql += " AND username LIKE ?"; searchParams.push(`%${username}%`); }
    if (email) { conditionSql += " AND Email LIKE ?"; searchParams.push(`%${email}%`); }
    if (role) { conditionSql += " AND Role LIKE ?"; searchParams.push(`%${role}%`); }

    let sql = `
        SELECT User_id, username, Email, Role, DateOfBirth, CreatedAt FROM users WHERE 1=1 ${conditionSql}
        UNION
        SELECT Admin_ID as User_id, username, Email, Role, DateOfBirth, CreatedAt FROM Admin WHERE 1=1 ${conditionSql}
        ORDER BY CreatedAt DESC
    `;

    const finalParams = [...searchParams, ...searchParams]; // เบิ้ล Params สำหรับ UNION

    db.query(sql, finalParams, (err, results) => {
        if (err) return res.status(500).json({ success: false, message: 'Database error' });
        res.json(results);
    });
});

// --- 3. Get Single User/Admin by ID ---
router.get('/users/:id', (req, res) => {
    const id = req.params.id;
    let sql = '';
    
    if (id.startsWith('U')) {
        sql = 'SELECT * FROM users WHERE User_id = ?';
    } else if (id.startsWith('A')) {
        sql = 'SELECT Admin_ID as User_id, username, password, FName, LName, Email, Tel, Role, Status, Address, Gender, DateOfBirth, CreatedAt FROM Admin WHERE Admin_ID = ?';
    } else {
        return res.status(400).json({ message: 'Invalid ID format' });
    }

    db.query(sql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: 'User/Admin not found' });
        res.json(results[0]);
    });
});

// --- 4. Create User (POST) ---
router.post('/users', (req, res) => {
    const { username, password, FName, LName, Tel, Email, Gender, Address, DateOfBirth, Role, Status } = req.body;

    db.query('SELECT MAX(User_id) as maxId FROM users', (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        let newUserId = 'U0000001';
        if (results[0].maxId) {
            const currentMax = parseInt(results[0].maxId.substring(1));
            const nextId = currentMax + 1;
            newUserId = 'U' + nextId.toString().padStart(7, '0');
        }

        const sql = `INSERT INTO users (User_id, username, password, FName, LName, Email, Tel, Gender, DateOfBirth, Address, Role, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [newUserId, username, password, FName, LName, Email, Tel, Gender, DateOfBirth, Address, Role, Status];

        db.query(sql, values, (insertErr) => {
            if (insertErr) {
                if (insertErr.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Username นี้ถูกใช้งานแล้ว' });
                return res.status(500).json({ success: false, message: 'เพิ่มข้อมูลไม่สำเร็จ: ' + insertErr.message });
            }
            res.json({ success: true, message: 'เพิ่มผู้ใช้สำเร็จ' });
        });
    });
});

// --- 5. Create Admin (POST) ---
router.post('/admins', (req, res) => {
    const { username, password, FName, LName, Tel, Email, Gender, Address, DateOfBirth, Status } = req.body;

    db.query('SELECT MAX(Admin_ID) as maxId FROM Admin', (err, results) => {
        if (err) return res.status(500).json({ success: false, message: err.message });

        let newAdminId = 'A0000001';
        if (results[0].maxId) {
            const currentMax = parseInt(results[0].maxId.substring(1));
            const nextId = currentMax + 1;
            newAdminId = 'A' + nextId.toString().padStart(7, '0');
        }

        const sql = `INSERT INTO Admin (Admin_ID, username, password, FName, LName, Email, Tel, Gender, DateOfBirth, Address, Role, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Admin', ?)`;
        const values = [newAdminId, username, password, FName, LName, Email, Tel, Gender, DateOfBirth, Address, Status];

        db.query(sql, values, (insertErr) => {
            if (insertErr) {
                if (insertErr.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Username นี้ถูกใช้งานแล้ว' });
                return res.status(500).json({ success: false, message: 'เพิ่ม Admin ไม่สำเร็จ: ' + insertErr.message });
            }
            res.json({ success: true, message: 'เพิ่ม Admin สำเร็จ' });
        });
    });
});

// --- 6. Update User/Admin (PUT) ---
router.put('/users/:id', (req, res) => {
    const id = req.params.id;
    const { FName, LName, Tel, Email, Gender, Address, DateOfBirth, Role } = req.body;

    // CASE 1: Users (ID starts with U) - มี Logic Promote Admin
    if (id.startsWith('U')) {
        db.query('SELECT * FROM users WHERE User_id = ?', [id], (err, results) => {
            if (err || results.length === 0) return res.status(404).json({ message: 'User not found' });
            const currentUser = results[0];

            const updateSql = `UPDATE users SET FName=?, LName=?, Tel=?, Email=?, Gender=?, Address=?, DateOfBirth=?, Role=? WHERE User_id=?`;
            const updateValues = [FName, LName, Tel, Email, Gender, Address, DateOfBirth, Role, id];

            db.query(updateSql, updateValues, (err) => {
                if (err) return res.status(500).json({ success: false, message: 'Update failed' });

                if (Role === 'Admin') {
                     db.query('SELECT * FROM Admin WHERE username = ?', [currentUser.username], (err, adminCheck) => {
                        if (adminCheck.length === 0) {
                             db.query('SELECT MAX(Admin_ID) as maxId FROM Admin', (err, idResult) => {
                                let newAdminId = 'A0000001';
                                if (idResult[0].maxId) {
                                    const currentMax = parseInt(idResult[0].maxId.substring(1));
                                    const nextId = currentMax + 1;
                                    newAdminId = 'A' + nextId.toString().padStart(7, '0');
                                }
                                const insertAdminSql = `INSERT INTO Admin (Admin_ID, username, password, FName, LName, Email, Tel, Role, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Active')`;
                                db.query(insertAdminSql, [newAdminId, currentUser.username, currentUser.password, FName, LName, Email, Tel, 'Admin']);
                             });
                        }
                     });
                } else {
                    db.query('DELETE FROM Admin WHERE username = ?', [currentUser.username]);
                }
                res.json({ success: true, message: 'User updated successfully' });
            });
        });
    } 
    // CASE 2: Admin (ID starts with A)
    else if (id.startsWith('A')) {
        const sql = `UPDATE Admin SET FName=?, LName=?, Tel=?, Email=?, Role=?, Address=?, Gender=?, DateOfBirth=? WHERE Admin_ID=?`;
        const values = [FName, LName, Tel, Email, Role, Address, Gender, DateOfBirth, id];

        db.query(sql, values, (err) => {
            if (err) return res.status(500).json({ success: false, message: 'Update Admin failed' });
            res.json({ success: true, message: 'Admin updated successfully' });
        });
    }
});

// --- 7. Delete User/Admin (DELETE) ---
router.delete('/users/:id', (req, res) => {
    const id = req.params.id;
    let sql = '';

    if (id.startsWith('U')) {
        sql = 'DELETE FROM users WHERE User_id = ?';
    } else if (id.startsWith('A')) {
        sql = 'DELETE FROM Admin WHERE Admin_ID = ?';
    } else {
        return res.status(400).json({ success: false, message: 'Invalid ID format' });
    }

    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: 'Cannot delete (Foreign Key constraint)' });
        if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Data not found' });
        res.json({ success: true, message: 'Deleted successfully' });
    });
});

module.exports = router;