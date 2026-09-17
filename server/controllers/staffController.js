const bcrypt = require('bcryptjs');
const User = require('../models/User');

// ==========================================
// CREATE STAFF ACCOUNT - ADMIN ONLY
// ==========================================
const createStaff = async (req, res) => {
    const {
        name,
        email,
        password,
        department
    } = req.body;

    try {
        // ==========================================
        // REQUIRED FIELDS
        // ==========================================
        if (
            !name ||
            !email ||
            !password ||
            !department
        ) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanDepartment = department.trim();

        // ==========================================
        // VALIDATE EMAIL
        // ==========================================
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({
                message: 'Please enter a valid email address'
            });
        }

        // ==========================================
        // VALIDATE PASSWORD
        // ==========================================
        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long'
            });
        }

        // ==========================================
        // CHECK EXISTING USER
        // ==========================================
        const existingUser = await User.findOne({
            email: cleanEmail
        });

        if (existingUser) {
            return res.status(400).json({
                message: 'User with this email already exists'
            });
        }

        // ==========================================
        // HASH PASSWORD
        // ==========================================
        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        // ==========================================
        // CREATE STAFF
        // ==========================================
        const newStaff = new User({
            name: cleanName,
            email: cleanEmail,
            password: hashedPassword,
            role: 'staff',
            department: cleanDepartment
        });

        await newStaff.save();

        console.log(
            'Staff account created by admin:',
            {
                name: newStaff.name,
                email: newStaff.email,
                department: newStaff.department
            }
        );

        return res.status(201).json({
            message: 'Staff account created successfully',
            staff: {
                id: newStaff._id,
                name: newStaff.name,
                email: newStaff.email,
                role: newStaff.role,
                department: newStaff.department
            }
        });

    } catch (error) {
        console.error(
            'Create staff error:',
            error
        );

        // Duplicate email safety
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'User with this email already exists'
            });
        }

        return res.status(500).json({
            message: 'Server error while creating staff account'
        });
    }
};

module.exports = {
    createStaff
};