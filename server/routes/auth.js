const express = require('express');

const FoodCourt = require('../models/FoodCourt');
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


/**
 * PUBLIC - GET ACTIVE FOOD COURTS
 * Students can view active food courts.
 * Existing admin-only routes remain unchanged.
 */
router.get('/public/food-courts', async (req, res) => {
    try {
        const foodCourts = await FoodCourt.find({
            isActive: true
        })
            .select('_id name description')
            .sort({ name: 1 })
            .lean();

        return res.json(foodCourts);
    } catch (error) {
        console.error('Public Food Courts error:', error);

        return res.status(500).json({
            message: 'Unable to fetch Food Courts'
        });
    }
});


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

// ==========================================
// ADMIN - GET ACTIVE FOOD COURTS
// ==========================================
router.get(
    '/food-courts',
    authMiddleware,
    isAdmin,
    async (req, res) => {
        try {
            const foodCourts = await FoodCourt.find({
                isActive: true
            }).sort({ name: 1 });

            res.json(foodCourts);
        } catch (error) {
            console.error('Get Food Courts error:', error);
            res.status(500).json({
                message: 'Error fetching Food Courts'
            });
        }
    }
);


// ==========================================
// ADMIN - CREATE FOOD COURT
// ==========================================
router.post(
    '/food-courts',
    authMiddleware,
    isAdmin,
    async (req, res) => {
        try {
            const name =
                typeof req.body.name === 'string'
                    ? req.body.name.trim()
                    : '';

            const description =
                typeof req.body.description === 'string'
                    ? req.body.description.trim()
                    : '';

            if (!name) {
                return res.status(400).json({
                    message: 'Food Court name is required'
                });
            }

            const existing = await FoodCourt.findOne({
                name: {
                    $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
                    $options: 'i'
                }
            });

            if (existing) {
                return res.status(409).json({
                    message: 'This Food Court already exists'
                });
            }

            const foodCourt = await FoodCourt.create({
                name,
                description,
                isActive: true
            });

            return res.status(201).json({
                message: 'Food Court created successfully',
                foodCourt
            });
        } catch (error) {
            console.error('Create Food Court error:', error);

            if (error.code === 11000) {
                return res.status(409).json({
                    message: 'This Food Court already exists'
                });
            }

            return res.status(500).json({
                message: 'Error creating Food Court'
            });
        }
    }
);

// ==========================================
// ADMIN - GET ALL STAFF
// ==========================================
router.get(
    '/staff',
    authMiddleware,
    isAdmin,
    async (req, res) => {
        try {
            const staff = await User.find({
                role: 'staff'
            })
                .select('_id name email department foodCourt')
                .lean();

            const FoodCourt = require('../models/FoodCourt');

            const foodCourtIds = staff
                .map(member => member.foodCourt)
                .filter(Boolean);

            const foodCourts = await FoodCourt.find({
                _id: { $in: foodCourtIds }
            })
                .select('_id name')
                .lean();

            const foodCourtMap = new Map(
                foodCourts.map(court => [
                    String(court._id),
                    court.name
                ])
            );

            const staffWithFoodCourt = staff.map(member => ({
                ...member,
                foodCourtName: member.foodCourt
                    ? foodCourtMap.get(String(member.foodCourt)) || 'Not assigned'
                    : 'Not assigned'
            }));

            return res.json(staffWithFoodCourt);

        } catch (error) {
            console.error('Error fetching staff:', error);

            return res.status(500).json({
                message: 'Error fetching staff list'
            });
        }
    }
);
// ==========================================
// ADMIN - DELETE STAFF ACCOUNT
// ==========================================
router.delete(
    '/staff/:id',
    authMiddleware,
    isAdmin,
    async (req, res) => {
        try {
            const { id } = req.params;

            if (!require('mongoose').isValidObjectId(id)) {
                return res.status(400).json({
                    message: 'Invalid staff ID'
                });
            }

            const staff = await User.findOne({
                _id: id,
                role: 'staff'
            });

            if (!staff) {
                return res.status(404).json({
                    message: 'Staff account not found'
                });
            }

            await User.deleteOne({
                _id: staff._id,
                role: 'staff'
            });

            return res.json({
                message: 'Staff account deleted successfully'
            });

        } catch (error) {
            console.error('Delete staff error:', error);

            return res.status(500).json({
                message: 'Error deleting staff account'
            });
        }
    }
);


// =====================================================
// EXPORT ROUTER
// =====================================================

module.exports = router;