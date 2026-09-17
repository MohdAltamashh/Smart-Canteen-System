const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');

const User = require('../models/User');
const RegistrationOTP = require('../models/RegistrationOTP');

// ==========================================
// SEND STUDENT REGISTRATION OTP
// ==========================================
const sendRegistrationOTP = async (req, res) => {
    const {
        email,
        password,
        name,
        department
    } = req.body;

    try {
        // Validate required fields
        if (
            !email ||
            !password ||
            !name ||
            !department
        ) {
            return res.status(400).json({
                message: 'All fields are required'
            });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanName = name.trim();
        const cleanDepartment = department.trim();

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

        // Check existing user
        const existingUser = await User.findOne({
            email: cleanEmail
        });

        if (existingUser) {
            return res.status(400).json({
                message: 'User with this email already exists'
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        // OTP expires after 5 minutes
        const expiresAt = new Date(
            Date.now() + 5 * 60 * 1000
        );

        // Hash password
        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        // Delete old OTP
        await RegistrationOTP.deleteMany({
            email: cleanEmail
        });

        // Save new OTP
        const registrationOTP = new RegistrationOTP({
            email: cleanEmail,
            otp,
            name: cleanName,
            password: hashedPassword,
            department: cleanDepartment,
            expiresAt
        });

        await registrationOTP.save();

        // Nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Send OTP email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: cleanEmail,
            subject: 'Smart Canteen - Student Registration OTP',

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 10px;
                ">

                    <h2 style="text-align: center;">
                        Smart Canteen
                    </h2>

                    <p>
                        Hello <strong>${cleanName}</strong>,
                    </p>

                    <p>
                        You requested to create a student
                        account on Smart Canteen.
                    </p>

                    <p>
                        Your One-Time Password (OTP) is:
                    </p>

                    <div style="
                        text-align: center;
                        font-size: 32px;
                        font-weight: bold;
                        letter-spacing: 8px;
                        padding: 15px;
                        background: #f5f5f5;
                        border-radius: 8px;
                        margin: 20px 0;
                    ">
                        ${otp}
                    </div>

                    <p>
                        This OTP is valid for
                        <strong>5 minutes</strong>.
                    </p>

                    <p>
                        If you did not request this registration,
                        you can safely ignore this email.
                    </p>

                    <hr>

                    <p style="
                        font-size: 12px;
                        color: #777;
                        text-align: center;
                    ">
                        Smart Canteen Management System
                    </p>

                </div>
            `
        });

        console.log(
            `Registration OTP sent successfully to: ${cleanEmail}`
        );

        res.status(200).json({
            message: 'OTP sent successfully to your email'
        });

    } catch (error) {
        console.error(
            'Send Registration OTP Error:',
            error
        );

        res.status(500).json({
            message: 'Failed to send OTP. Please try again.',
            error: error.message
        });
    }
};


// ==========================================
// VERIFY STUDENT REGISTRATION OTP
// ==========================================
const verifyRegistrationOTP = async (req, res) => {
    const {
        email,
        otp
    } = req.body;

    try {
        // Validate fields
        if (!email || !otp) {
            return res.status(400).json({
                message: 'Email and OTP are required'
            });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanOTP = otp.toString().trim();

        // Find OTP record
        const registrationOTP = await RegistrationOTP.findOne({
            email: cleanEmail
        });

        if (!registrationOTP) {
            return res.status(400).json({
                message: 'OTP not found. Please request a new OTP.'
            });
        }

        // Check expiry
        if (new Date() > registrationOTP.expiresAt) {

            await RegistrationOTP.deleteOne({
                _id: registrationOTP._id
            });

            return res.status(400).json({
                message: 'OTP has expired. Please request a new OTP.'
            });
        }

        // Check OTP
        if (registrationOTP.otp !== cleanOTP) {
            return res.status(400).json({
                message: 'Invalid OTP. Please enter the correct OTP.'
            });
        }

        // Check duplicate user again
        const existingUser = await User.findOne({
            email: cleanEmail
        });

        if (existingUser) {

            await RegistrationOTP.deleteOne({
                _id: registrationOTP._id
            });

            return res.status(400).json({
                message: 'User with this email already exists'
            });
        }

        // Create student account
        const newUser = new User({
            email: registrationOTP.email,
            password: registrationOTP.password,
            role: 'student',
            name: registrationOTP.name,
            department: registrationOTP.department
        });

        await newUser.save();

        // Delete OTP after successful verification
        await RegistrationOTP.deleteOne({
            _id: registrationOTP._id
        });

        console.log(
            'Student registered successfully after OTP verification:',
            {
                email: newUser.email,
                name: newUser.name,
                department: newUser.department
            }
        );

        res.status(201).json({
            message: 'OTP verified successfully. Student account created.'
        });

    } catch (error) {
        console.error(
            'Verify Registration OTP Error:',
            error
        );

        // Duplicate email safety
        if (error.code === 11000) {
            return res.status(400).json({
                message: 'User with this email already exists'
            });
        }

        res.status(500).json({
            message: 'Server error during OTP verification',
            error: error.message
        });
    }
};

// ==========================================
// RESEND STUDENT REGISTRATION OTP
// ==========================================
const resendRegistrationOTP = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({
                message: 'Email is required'
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        // Find existing pending registration
        const registrationOTP = await RegistrationOTP.findOne({
            email: cleanEmail
        });

        if (!registrationOTP) {
            return res.status(400).json({
                message: 'Registration session not found. Please start registration again.'
            });
        }

        // Check whether user was already created
        const existingUser = await User.findOne({
            email: cleanEmail
        });

        if (existingUser) {
            await RegistrationOTP.deleteMany({
                email: cleanEmail
            });

            return res.status(400).json({
                message: 'User with this email already exists'
            });
        }

        // ------------------------------------------
        // 60-second resend cooldown
        // ------------------------------------------
        const timeSinceLastOTP =
            Date.now() - new Date(registrationOTP.createdAt).getTime();

        const cooldown = 60 * 1000;

        if (timeSinceLastOTP < cooldown) {
            const remainingSeconds = Math.ceil(
                (cooldown - timeSinceLastOTP) / 1000
            );

            return res.status(429).json({
                message: `Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
                remainingSeconds
            });
        }

        // ------------------------------------------
        // Generate new OTP
        // ------------------------------------------
        const newOTP = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        const newExpiresAt = new Date(
            Date.now() + 5 * 60 * 1000
        );

        // Update existing registration
        registrationOTP.otp = newOTP;
        registrationOTP.expiresAt = newExpiresAt;
        registrationOTP.createdAt = new Date();

        await registrationOTP.save();

        // ------------------------------------------
        // Nodemailer
        // ------------------------------------------
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // ------------------------------------------
        // Send new OTP
        // ------------------------------------------
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: cleanEmail,
            subject: 'Smart Canteen - New Registration OTP',

            html: `
                <div style="
                    font-family: Arial, sans-serif;
                    max-width: 600px;
                    margin: auto;
                    padding: 20px;
                    border: 1px solid #ddd;
                    border-radius: 10px;
                ">

                    <h2 style="text-align: center;">
                        Smart Canteen
                    </h2>

                    <p>
                        Hello <strong>${registrationOTP.name}</strong>,
                    </p>

                    <p>
                        Here is your new registration OTP:
                    </p>

                    <div style="
                        text-align: center;
                        font-size: 32px;
                        font-weight: bold;
                        letter-spacing: 8px;
                        padding: 15px;
                        background: #f5f5f5;
                        border-radius: 8px;
                        margin: 20px 0;
                    ">
                        ${newOTP}
                    </div>

                    <p>
                        This OTP is valid for
                        <strong>5 minutes</strong>.
                    </p>

                    <p>
                        Your previous OTP is no longer valid.
                    </p>

                    <hr>

                    <p style="
                        font-size: 12px;
                        color: #777;
                        text-align: center;
                    ">
                        Smart Canteen Management System
                    </p>

                </div>
            `
        });

        console.log(
            `Registration OTP resent successfully to: ${cleanEmail}`
        );

        res.status(200).json({
            message: 'New OTP sent successfully to your email'
        });

    } catch (error) {
        console.error(
            'Resend Registration OTP Error:',
            error
        );

        res.status(500).json({
            message: 'Failed to resend OTP. Please try again.',
            error: error.message
        });
    }
};


module.exports = {
    sendRegistrationOTP,
    verifyRegistrationOTP,
    resendRegistrationOTP
};