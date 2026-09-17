const mongoose = require('mongoose');

const registrationOTPSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true
    },

    otp: {
        type: String,
        required: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    password: {
        type: String,
        required: true
    },

    department: {
        type: String,
        required: true,
        trim: true
    },

    expiresAt: {
        type: Date,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600
    }
});

const RegistrationOTP = mongoose.model(
    'RegistrationOTP',
    registrationOTPSchema
);

module.exports = RegistrationOTP;