const express = require('express');

const {
    register,
    login,
    getUserStats
} = require('../controllers/authController');

const {
    sendRegistrationOTP,
    verifyRegistrationOTP,
    resendRegistrationOTP
} = require('../controllers/otpController');

const {
    createStaff
} = require('../controllers/staffController');

const router = express.Router();

const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const isAdmin = require('../middleware/isAdmin');


// =====================================================
// PUBLIC ROUTES
// =====================================================

// Get user statistics
router.get('/stats', getUserStats);


// =====================================================
// OLD PUBLIC REGISTER ROUTE
// =====================================================

// Student-only public registration
router.post('/register', register);


// =====================================================
// STUDENT OTP REGISTRATION
// =====================================================

// Send OTP
router.post('/send-otp', sendRegistrationOTP);

// Verify OTP and create student account
router.post('/verify-otp', verifyRegistrationOTP);

// Resend OTP
router.post('/resend-otp', resendRegistrationOTP);


// =====================================================
// LOGIN
// =====================================================

router.post('/login', login);


// =====================================================
// USER PROFILE
// =====================================================

router.get(
    '/profile',
    authMiddleware,
    async (req, res) => {
        try {

            const user = await User
                .findById(req.user.id)
                .select('-password');

            if (!user) {
                return res.status(404).json({
                    message: 'User not found'
                });
            }

            res.json(user);

        } catch (error) {

            console.error(
                'Profile error:',
                error
            );

            res.status(500).json({
                message: 'Server error'
            });
        }
    }
);


// =====================================================
// ADMIN - CREATE STAFF ACCOUNT
// =====================================================

router.post(
    '/create-staff',
    authMiddleware,
    isAdmin,
    createStaff
);


// =====================================================
// ADMIN - GET ALL STAFF
// =====================================================

router.get(
    '/staff',
    authMiddleware,
    isAdmin,
    async (req, res) => {

        try {

            const staff = await User
                .find({
                    role: 'staff'
                })
                .select(
                    '_id name email department'
                );

            console.log(
                'Staff found:',
                staff.length,
                'staff members'
            );

            res.json(staff);

        } catch (error) {

            console.error(
                'Error fetching staff:',
                error
            );

            res.status(500).json({
                message:
                    'Error fetching staff list'
            });
        }
    }
);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;