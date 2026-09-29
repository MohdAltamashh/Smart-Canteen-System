
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");

const User = require("../models/User");
const RegistrationOTP = require("../models/RegistrationOTP");

// ==========================================
// GMAIL OAUTH2 CONFIGURATION
// ==========================================

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        type: "OAuth2",
        user: process.env.EMAIL_USER,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        refreshToken: process.env.GMAIL_REFRESH_TOKEN
    }
});

// ==========================================
// SEND OTP EMAIL
// ==========================================

const sendOTPEmail = async (to, name, otp, isResend = false) => {

    if (
        !process.env.EMAIL_USER ||
        !process.env.GMAIL_CLIENT_ID ||
        !process.env.GMAIL_CLIENT_SECRET ||
        !process.env.GMAIL_REFRESH_TOKEN
    ) {
        throw new Error(
            "Gmail OAuth2 environment variables are missing"
        );
    }

    const subject = isResend
        ? "Campus Bite - New Registration OTP"
        : "Campus Bite - Student Registration OTP";

    const safeName = String(name).replace(
        /[&<>"']/g,
        (char) => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        })[char]
    );

    const html = `
        <div style="
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: auto;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 10px;
        ">
            <h2 style="text-align:center;">Campus Bite</h2>

            <p>Hello <strong>${safeName}</strong>,</p>

            <p>
                Your student registration verification OTP is:
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
                please ignore this email.
            </p>

            <hr />

            <p style="
                font-size: 12px;
                color: #777;
                text-align: center;
            ">
                Campus Bite - Digital Food Ordering & Service Platform
            </p>
        </div>
    `;

    const info = await transporter.sendMail({
        from: `"Campus Bite" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: subject,
        html: html
    });

    console.log(
        "OTP email sent using Gmail OAuth2:",
        info.messageId
    );

    return info;
};

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

        if (!email || !password || !name || !department) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanName = name.trim();
        const cleanDepartment = department.trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long"
            });
        }

        const existingUser = await User.findOne({
            email: cleanEmail
        });

        if (existingUser) {
            return res.status(400).json({
                message: "User with this email already exists"
            });
        }

        const otp = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        const expiresAt = new Date(
            Date.now() + 5 * 60 * 1000
        );

        const hashedPassword = await bcrypt.hash(
            password,
            10
        );

        await RegistrationOTP.deleteMany({
            email: cleanEmail
        });

        const registrationOTP = new RegistrationOTP({
            email: cleanEmail,
            otp,
            name: cleanName,
            password: hashedPassword,
            department: cleanDepartment,
            expiresAt
        });

        await registrationOTP.save();

        // Send OTP using Gmail OAuth2

        await sendOTPEmail(
            cleanEmail,
            cleanName,
            otp
        );

        return res.status(200).json({
            message: "OTP sent successfully to your email"
        });

    } catch (error) {

        console.error(
            "Send Registration OTP Error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to send OTP. Please try again.",
            error: error.message
        });
    }
};

// ==========================================
// VERIFY STUDENT REGISTRATION OTP
// ==========================================

const verifyRegistrationOTP = async (req, res) => {

    const { email, otp } = req.body;

    try {

        if (!email || !otp) {
            return res.status(400).json({
                message: "Email and OTP are required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();
        const cleanOTP = otp.toString().trim();

        const registrationOTP = await RegistrationOTP.findOne({
            email: cleanEmail
        });

        if (!registrationOTP) {
            return res.status(400).json({
                message: "OTP not found. Please request a new OTP."
            });
        }

        if (new Date() > registrationOTP.expiresAt) {

            await RegistrationOTP.deleteOne({
                _id: registrationOTP._id
            });

            return res.status(400).json({
                message: "OTP has expired. Please request a new OTP."
            });
        }

        if (registrationOTP.otp !== cleanOTP) {
            return res.status(400).json({
                message: "Invalid OTP. Please enter the correct OTP."
            });
        }

        const existingUser = await User.findOne({
            email: cleanEmail
        });

        if (existingUser) {

            await RegistrationOTP.deleteOne({
                _id: registrationOTP._id
            });

            return res.status(400).json({
                message: "User with this email already exists"
            });
        }

        const newUser = new User({
            email: registrationOTP.email,
            password: registrationOTP.password,
            role: "student",
            name: registrationOTP.name,
            department: registrationOTP.department
        });

        await newUser.save();

        await RegistrationOTP.deleteOne({
            _id: registrationOTP._id
        });

        console.log(
            "Student registered successfully after OTP verification:",
            {
                email: newUser.email,
                name: newUser.name,
                department: newUser.department
            }
        );

        return res.status(201).json({
            message: "OTP verified successfully. Student account created."
        });

    } catch (error) {

        console.error(
            "Verify Registration OTP Error:",
            error
        );

        if (error.code === 11000) {
            return res.status(400).json({
                message: "User with this email already exists"
            });
        }

        return res.status(500).json({
            message: "Server error during OTP verification",
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
                message: "Email is required"
            });
        }

        const cleanEmail = email.trim().toLowerCase();

        const registrationOTP = await RegistrationOTP.findOne({
            email: cleanEmail
        });

        if (!registrationOTP) {
            return res.status(400).json({
                message:
                    "Registration session not found. Please start registration again."
            });
        }

        const existingUser = await User.findOne({
            email: cleanEmail
        });

        if (existingUser) {

            await RegistrationOTP.deleteMany({
                email: cleanEmail
            });

            return res.status(400).json({
                message: "User with this email already exists"
            });
        }

        // 60-second resend cooldown

        const timeSinceLastOTP =
            Date.now() -
            new Date(registrationOTP.createdAt).getTime();

        const cooldown = 60 * 1000;

        if (timeSinceLastOTP < cooldown) {

            const remainingSeconds = Math.ceil(
                (cooldown - timeSinceLastOTP) / 1000
            );

            return res.status(429).json({
                message:
                    `Please wait ${remainingSeconds} seconds before requesting a new OTP.`,
                remainingSeconds
            });
        }

        const newOTP = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        const newExpiresAt = new Date(
            Date.now() + 5 * 60 * 1000
        );

        registrationOTP.otp = newOTP;
        registrationOTP.expiresAt = newExpiresAt;
        registrationOTP.createdAt = new Date();

        await registrationOTP.save();

        // Resend OTP using Gmail OAuth2

        await sendOTPEmail(
            cleanEmail,
            registrationOTP.name,
            newOTP,
            true
        );

        return res.status(200).json({
            message: "New OTP sent successfully to your email"
        });

    } catch (error) {

        console.error(
            "Resend Registration OTP Error:",
            error.message
        );

        return res.status(500).json({
            message: "Failed to resend OTP. Please try again.",
            error: error.message
        });
    }
};

// ==========================================
// EXPORT
// ==========================================

module.exports = {
    sendRegistrationOTP,
    verifyRegistrationOTP,
    resendRegistrationOTP
};