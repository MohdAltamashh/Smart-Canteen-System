const bcrypt = require('bcryptjs');
const User = require('../models/User');
const FoodCourt = require('../models/FoodCourt');

// ==========================================
// CREATE STAFF ACCOUNT - ADMIN ONLY
// ==========================================
const createStaff = async (req, res) => {
    const {
        name,
        email,
        password,
        foodCourt
    } = req.body;

    try {
        // Validate required fields
        if (!name || !email || !password || !foodCourt) {
            return res.status(400).json({
                message: 'Name, email, password and Food Court are required'
            });
        }

        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();

        // Validate name
        if (!cleanName) {
            return res.status(400).json({
                message: 'Staff name is required'
            });
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({
                message: 'Please enter a valid email address'
            });
        }

        // Validate password
        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long'
            });
        }

        // Verify selected Food Court
        const selectedFoodCourt = await FoodCourt.findOne({
            _id: foodCourt,
            isActive: true
        });

        if (!selectedFoodCourt) {
            return res.status(400).json({
                message: 'Selected Food Court does not exist or is inactive'
            });
        }

        // Check duplicate email
        const existingUser = await User.findOne({
            email: cleanEmail
        });

        if (existingUser) {
            return res.status(400).json({
                message: 'User with this email already exists'
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create Staff
        // Department is kept in the database for compatibility
        // but Admin no longer needs to enter it.
        const newStaff = new User({
            name: cleanName,
            email: cleanEmail,
            password: hashedPassword,
            role: 'staff',
            department: 'Canteen',
            foodCourt: selectedFoodCourt._id
        });

        await newStaff.save();

        console.log('Staff created successfully:', {
            id: newStaff._id,
            name: newStaff.name,
            email: newStaff.email,
            foodCourt: selectedFoodCourt.name
        });

        return res.status(201).json({
            message: 'Staff account created successfully',
            staff: {
                _id: newStaff._id,
                name: newStaff.name,
                email: newStaff.email,
                role: newStaff.role,
                foodCourt: newStaff.foodCourt,
                foodCourtName: selectedFoodCourt.name
            }
        });

    } catch (error) {
        console.error('Create staff error:', error);

        if (error.code === 11000) {
            return res.status(400).json({
                message: 'User with this email already exists'
            });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({
                message: 'Invalid Food Court ID'
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