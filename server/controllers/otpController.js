const bcrypt = require("bcryptjs");
const { google } = require("googleapis");
const crypto = require("crypto");

const User = require("../models/User");
const RegistrationOTP = require("../models/RegistrationOTP");

// ==========================================
// GMAIL API CONFIGURATION (NO SMTP)
// ==========================================

const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
);

oauth2Client.setCredentials({
    refresh_token: process.env.GMAIL_REFRESH_TOKEN
});

const gmail = google.gmail({
    version: "v1",
    auth: oauth2Client
});

// ==========================================
// SEND EMAIL USING GMAIL API
// ==========================================

const sendOTPEmail = async (
    to,
    name,
    otp,
    isResend = false
) => {
    if (
        !process.env.GMAIL_CLIENT_ID ||
        !process.env.GMAIL_CLIENT_SECRET ||
        !process.env.GMAIL_REFRESH_TOKEN ||
        !process.env.EMAIL_USER
    ) {
        throw new Error(
            "Missing Gmail API environment variables in Render"
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

    // Build an email message for the Gmail API
    const messageParts = [
        `From: "Campus Bite" <${process.env.EMAIL_USER}>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        Buffer.from(html, "utf-8").toString("base64")
    ];

    const rawMessage = messageParts.join("\r\n");

    const encodedMessage = Buffer
        .from(rawMessage, "utf-8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

    // Send email using Gmail HTTPS API, not SMTP
    const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
            raw: encodedMessage
        }
    });

    console.log(
        "Gmail API email sent successfully:",
        response.data.id
    );

    return response.data;
};

// ==========================================
// SEND REGISTRATION OTP
// ==========================================

const sendRegistrationOTP = async (req, res) => {
    try {
        const {
            email,
            password,
            name,
            department
        } = req.body;

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

        const otp = crypto
            .randomInt(100000, 1000000)
            .toString();

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

        // Send OTP through Gmail API
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
            error.response?.data || error.message
        );

        return res.status(500).json({
            message: "Failed to send OTP. Please try again.",
            error:
                error.response?.data?.error?.message ||
                error.message
        });
    }
};

// ==========================================
// VERIFY REGISTRATION OTP
// ==========================================

const verifyRegistrationOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

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
                message:
                    "OTP not found. Please request a new OTP."
            });
        }

        if (new Date() > registrationOTP.expiresAt) {
            await RegistrationOTP.deleteOne({
                _id: registrationOTP._id
            });

            return res.status(400).json({
                message:
                    "OTP has expired. Please request a new OTP."
            });
        }

        if (registrationOTP.otp !== cleanOTP) {
            return res.status(400).json({
                message:
                    "Invalid OTP. Please enter the correct OTP."
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
            "Student registered successfully:",
            newUser.email
        );

        return res.status(201).json({
            message:
                "OTP verified successfully. Student account created."
        });

    } catch (error) {
        console.error(
            "Verify Registration OTP Error:",
            error.message
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
// RESEND REGISTRATION OTP
// ==========================================

const resendRegistrationOTP = async (req, res) => {
    try {
        const { email } = req.body;

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

        const newOTP = crypto
            .randomInt(100000, 1000000)
            .toString();

        registrationOTP.otp = newOTP;
        registrationOTP.expiresAt = new Date(
            Date.now() + 5 * 60 * 1000
        );
        registrationOTP.createdAt = new Date();

        await registrationOTP.save();

        // Send new OTP through Gmail API
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
            error.response?.data || error.message
        );

        return res.status(500).json({
            message: "Failed to resend OTP. Please try again.",
            error:
                error.response?.data?.error?.message ||
                error.message
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