const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// SECURITY_ACCESS_KEY (In a real app, this should be in .env)
const SECURITY_ACCESS_KEY = 'TRUSTATE_ADMIN_2025';

// @route   POST api/admin/auth/signup
// @desc    Register an admin
// @access  Public
router.post('/signup', async (req, res) => {
    const { fullName, email, password, accessKey } = req.body;

    // Check access key
    if (accessKey !== SECURITY_ACCESS_KEY) {
        return res.status(401).json({ message: 'Invalid security access key' });
    }

    try {
        let admin = await Admin.findOne({ email });
        if (admin) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        admin = new Admin({ fullName, email, password });

        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(password, salt);

        await admin.save();

        res.status(201).json({ message: 'Admin registered successfully' });
    } catch (err) {
        console.error('Admin Signup Error:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/admin/auth/login
// @desc    Admin login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const payload = {
            adminId: admin._id,
            role: admin.role
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'trustate_secure_token_key_2025',
            { expiresIn: '12h' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    admin: {
                        id: admin._id,
                        fullName: admin.fullName,
                        email: admin.email,
                        role: admin.role
                    }
                });
            }
        );
    } catch (err) {
        console.error('Admin Login Error:', err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
