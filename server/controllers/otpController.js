
const bcrypt = require("bcryptjs");
const { google } = require("googleapis");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const RegistrationOTP = require("../models/RegistrationOTP");
const PasswordResetOTP = require("../models/PasswordResetOTP");

// ==========================================
// GMAIL API CONFIGURATION
// ==========================================

const createGmailClient = () => {
    const {
        GMAIL_CLIENT_ID,
        GMAIL_CLIENT_SECRET,
        GMAIL_REFRESH_TOKEN,
        EMAIL_USER
    } = process.env;

    if (
        !GMAIL_CLIENT_ID ||
        !GMAIL_CLIENT_SECRET ||
        !GMAIL_REFRESH_TOKEN ||
        !EMAIL_USER
    ) {
        throw new Error(
            "Missing Gmail API environment variables. Check Render Environment."
        );
    }

    const oauth2Client = new google.auth.OAuth2(
        GMAIL_CLIENT_ID,
        GMAIL_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
        refresh_token: GMAIL_REFRESH_TOKEN
    });

    return google.gmail({
        version: "v1",
        auth: oauth2Client
    });
};

// ==========================================
// COMMON GMAIL HTML EMAIL SENDER
// ==========================================

const sendHtmlEmail = async (to, subject, html) => {
    const gmail = createGmailClient();
    const senderEmail = process.env.EMAIL_USER;

    const encodedHtml = Buffer
        .from(html, "utf-8")
        .toString("base64");

    const messageParts = [
        `From: "Campus Bite" <${senderEmail}>`,
        `To: ${to}`,
        `Subject: ${subject}`,
        "MIME-Version: 1.0",
        'Content-Type: text/html; charset="UTF-8"',
        "Content-Transfer-Encoding: base64",
        "",
        encodedHtml
    ];

    const rawMessage = messageParts.join("\r\n");

    const encodedMessage = Buffer
        .from(rawMessage, "utf-8")
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");

    const response = await gmail.users.messages.send({
        userId: "me",
        requestBody: {
            raw: encodedMessage
        }
    });

    console.log("Gmail API email sent successfully:", response.data.id);

    return response.data;
};

// ==========================================
// SEND REGISTRATION OTP EMAIL
// ==========================================

const sendOTPEmail = async (to, name, otp, isResend = false) => {
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

    const subject = isResend
        ? "Campus Bite - New Registration OTP"
        : "Campus Bite - Student Registration OTP";

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Campus Bite OTP</title>
    </head>
    <body style="margin:0;padding:20px;background:#f4f6f9;font-family:Arial,sans-serif">
        <div style="max-width:550px;margin:auto;padding:25px;background:#fff;border:1px solid #e5e7eb;border-radius:12px">
            <h2 style="text-align:center;color:#123c69">Campus Bite</h2>
            <p>Hello <strong>${safeName}</strong>,</p>
            <p>Thank you for registering with Campus Bite. Use this OTP to verify your email address:</p>
            <div style="margin:25px 0;padding:20px;text-align:center;background:#f0f5ff;border-radius:10px">
                <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#123c69">${otp}</span>
            </div>
            <p>This OTP is valid for <strong>5 minutes</strong>.</p>
            <p>Do not share this OTP with anyone. If you did not request this registration, ignore this email.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:25px 0">
            <p style="text-align:center;font-size:12px;color:#777">
                Campus Bite - Digital Food Ordering &amp; Service Platform
            </p>
        </div>
    </body>
    </html>`;

    return sendHtmlEmail(to, subject, html);
};

// ==========================================
// SEND PASSWORD RESET OTP EMAIL
// ==========================================

const sendPasswordResetOTPEmail = async (to, name, otp) => {
    const safeName = String(name || "User").replace(
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
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Campus Bite Password Reset</title>
    </head>
    <body style="margin:0;padding:20px;background:#f4f6f9;font-family:Arial,sans-serif">
        <div style="max-width:550px;margin:auto;padding:25px;background:#fff;border:1px solid #e5e7eb;border-radius:12px">
            <h2 style="text-align:center;color:#123c69">Campus Bite</h2>
            <p>Hello <strong>${safeName}</strong>,</p>
            <p>We received a request to reset your Campus Bite password.</p>
            <div style="margin:25px 0;padding:20px;text-align:center;background:#f0f5ff;border-radius:10px">
                <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#123c69">${otp}</span>
            </div>
            <p>This OTP is valid for <strong>5 minutes</strong>.</p>
            <p>Do not share this OTP with anyone. If you did not request a password reset, ignore this email.</p>
            <hr style="border:none;border-top:1px solid #eee;margin:25px 0">
            <p style="text-align:center;font-size:12px;color:#777">
                Campus Bite - Digital Food Ordering &amp; Service Platform
            </p>
        </div>
    </body>
    </html>`;

    return sendHtmlEmail(
        to,
        "Campus Bite - Password Reset OTP",
        html
    );
};

// ==========================================
// SEND REGISTRATION OTP
// ==========================================

const sendRegistrationOTP = async (req, res) => {
    try {
        const { email, password, name, department } = req.body;

        if (!email || !password || !name || !department) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const cleanName = String(name).trim();
        const cleanDepartment = String(department).trim();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(cleanEmail)) {
            return res.status(400).json({
                message: "Please enter a valid email address"
            });
        }

        if (typeof password !== "string" || password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long"
            });
        }

        if (!cleanName || !cleanDepartment) {
            return res.status(400).json({
                message: "Name and department are required"
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

        const otp = crypto.randomInt(100000, 1000000).toString();

        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        const hashedPassword = await bcrypt.hash(password, 10);

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

        try {
            await sendOTPEmail(cleanEmail, cleanName, otp);
        } catch (emailError) {
            await RegistrationOTP.deleteOne({
                _id: registrationOTP._id
            });

            throw emailError;
        }

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

        const cleanEmail = String(email).trim().toLowerCase();
        const cleanOTP = String(otp).trim();

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

        console.log("Student registered successfully:", newUser.email);

        return res.status(201).json({
            message: "OTP verified successfully. Student account created."
        });
    } catch (error) {
        console.error("Verify Registration OTP Error:", error.message);

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

        const cleanEmail = String(email).trim().toLowerCase();

        const registrationOTP = await RegistrationOTP.findOne({
            email: cleanEmail
        });

        if (!registrationOTP) {
            return res.status(400).json({
                message: "Registration session not found. Please start registration again."
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

        const newOTP = crypto.randomInt(100000, 1000000).toString();

        registrationOTP.otp = newOTP;
        registrationOTP.expiresAt = new Date(Date.now() + 5 * 60 * 1000);
        registrationOTP.createdAt = new Date();

        await registrationOTP.save();

        try {
            await sendOTPEmail(
                cleanEmail,
                registrationOTP.name,
                newOTP,
                true
            );
        } catch (emailError) {
            await RegistrationOTP.deleteOne({
                _id: registrationOTP._id
            });

            throw emailError;
        }

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
// FORGOT PASSWORD - SEND OTP
// ==========================================

const forgotPassword = async (req, res) => {
    const genericMessage =
        "If an eligible account exists for this email, password reset instructions will be sent.";

    try {
        const email = String(req.body.email || "")
            .trim()
            .toLowerCase();

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: "Please enter a valid email address."
            });
        }

        // Admin login uses environment credentials, not a User account.
        const user = await User.findOne({
            email,
            role: { $in: ["student", "staff"] }
        });

        // Avoid disclosing whether the account exists.
        if (!user) {
            return res.status(200).json({
                message: genericMessage
            });
        }

        const existingReset = await PasswordResetOTP.findOne({ email });

        if (existingReset) {
            const elapsed =
                Date.now() - new Date(existingReset.createdAt).getTime();

            const stillValid =
                existingReset.expiresAt.getTime() > Date.now();

            if (elapsed < 60 * 1000 && stillValid) {
                return res.status(200).json({
                    message: genericMessage
                });
            }

            await PasswordResetOTP.deleteOne({
                _id: existingReset._id
            });
        }

        const otp = crypto.randomInt(100000, 1000000).toString();

        const otpHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        const resetRecord = await PasswordResetOTP.create({
            email,
            otpHash,
            expiresAt: new Date(Date.now() + 5 * 60 * 1000),
            attempts: 0,
            createdAt: new Date()
        });

        try {
            await sendPasswordResetOTPEmail(
                email,
                user.name || "User",
                otp
            );
        } catch (emailError) {
            await PasswordResetOTP.deleteOne({
                _id: resetRecord._id
            });

            throw emailError;
        }

        return res.status(200).json({
            message: genericMessage
        });
    } catch (error) {
        console.error("Forgot Password Error:", error.message);

        return res.status(500).json({
            message: "Unable to process the request right now. Please try again."
        });
    }
};

// ==========================================
// VERIFY PASSWORD RESET OTP
// ==========================================

const verifyResetOTP = async (req, res) => {
    try {
        const email = String(req.body.email || "")
            .trim()
            .toLowerCase();

        const otp = String(req.body.otp || "").trim();

        if (!email || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                message: "Please enter your email and valid 6-digit OTP."
            });
        }

        const resetRecord = await PasswordResetOTP.findOne({ email });

        if (!resetRecord) {
            return res.status(400).json({
                message: "OTP is invalid or expired. Please request a new OTP."
            });
        }

        if (resetRecord.expiresAt.getTime() <= Date.now()) {
            await PasswordResetOTP.deleteOne({
                _id: resetRecord._id
            });

            return res.status(400).json({
                message: "OTP has expired. Please request a new OTP."
            });
        }

        if (resetRecord.attempts >= 5) {
            await PasswordResetOTP.deleteOne({
                _id: resetRecord._id
            });

            return res.status(429).json({
                message: "Too many incorrect attempts. Please request a new OTP."
            });
        }

        const submittedHash = crypto
            .createHash("sha256")
            .update(otp)
            .digest("hex");

        if (submittedHash !== resetRecord.otpHash) {
            resetRecord.attempts += 1;

            if (resetRecord.attempts >= 5) {
                await PasswordResetOTP.deleteOne({
                    _id: resetRecord._id
                });
            } else {
                await resetRecord.save();
            }

            return res.status(400).json({
                message: "Incorrect OTP. Please try again."
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing from environment variables.");
        }

        const resetToken = jwt.sign(
            {
                email,
                purpose: "password-reset"
            },
            process.env.JWT_SECRET,
            { expiresIn: "10m" }
        );

        // Store the hash of the reset token to enforce single use.
        resetRecord.otpHash = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        resetRecord.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        resetRecord.createdAt = new Date();
        resetRecord.attempts = 0;

        await resetRecord.save();

        return res.status(200).json({
            message: "OTP verified successfully.",
            resetToken
        });
    } catch (error) {
        console.error("Verify Reset OTP Error:", error.message);

        return res.status(500).json({
            message: "Unable to verify OTP. Please try again."
        });
    }
};

// ==========================================
// RESET PASSWORD
// ==========================================

const resetPassword = async (req, res) => {
    try {
        const { resetToken, password } = req.body;

        if (!resetToken || !password) {
            return res.status(400).json({
                message: "Reset token and new password are required."
            });
        }

        if (typeof password !== "string" || password.length < 6) {
            return res.status(400).json({
                message: "Password must be at least 6 characters long."
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET is missing from environment variables.");
        }

        let decoded;

        try {
            decoded = jwt.verify(
                resetToken,
                process.env.JWT_SECRET
            );
        } catch {
            return res.status(400).json({
                message: "Reset session is invalid or expired. Please start again."
            });
        }

        if (
            decoded.purpose !== "password-reset" ||
            !decoded.email
        ) {
            return res.status(400).json({
                message: "Invalid password reset session."
            });
        }

        const email = String(decoded.email).trim().toLowerCase();

        const resetRecord = await PasswordResetOTP.findOne({ email });

        if (
            !resetRecord ||
            resetRecord.expiresAt.getTime() <= Date.now()
        ) {
            return res.status(400).json({
                message: "Reset session has expired. Please request a new OTP."
            });
        }

        const submittedTokenHash = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");

        if (submittedTokenHash !== resetRecord.otpHash) {
            return res.status(400).json({
                message: "Reset token is invalid or has already been used."
            });
        }

        const user = await User.findOne({
            email,
            role: { $in: ["student", "staff"] }
        });

        if (!user) {
            await PasswordResetOTP.deleteOne({ email });

            return res.status(400).json({
                message: "Unable to reset password for this account."
            });
        }

        user.password = await bcrypt.hash(password, 10);
        await user.save();

        // Delete the record so the reset token cannot be reused.
        await PasswordResetOTP.deleteOne({ email });

        return res.status(200).json({
            message: "Password reset successfully. Please log in with your new password."
        });
    } catch (error) {
        console.error("Reset Password Error:", error.message);

        return res.status(500).json({
            message: "Unable to reset password. Please try again."
        });
    }
};

// ==========================================
// EXPORT CONTROLLERS
// ==========================================

module.exports = {
    sendRegistrationOTP,
    verifyRegistrationOTP,
    resendRegistrationOTP,
    forgotPassword,
    verifyResetOTP,
    resetPassword
};
