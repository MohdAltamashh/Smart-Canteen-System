const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    enum: ["student", "staff", "admin"],
    default: "student",
  },

  name: {
    type: String,
    required: true,
  },

  department: {
    type: String,
    required: true,
  },

  // Food Corner assigned to staff
  // Existing users ke liye initially null rahega.
  foodCourt: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const User = mongoose.model("User", userSchema);

module.exports = User;