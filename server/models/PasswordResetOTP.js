
const mongoose = require("mongoose");

const passwordResetOTPSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    // Store a hash of the OTP, not the plain OTP.
    otpHash: {
      type: String,
      required: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600,
    },
  },
  {
    versionKey: false,
  }
);

passwordResetOTPSchema.index({ email: 1 }, { unique: true });

module.exports =
  mongoose.models.PasswordResetOTP ||
  mongoose.model("PasswordResetOTP", passwordResetOTPSchema);
