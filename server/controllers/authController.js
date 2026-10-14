
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ==========================================
// REGISTER A NEW USER
// ==========================================

const register = async (req, res) => {
  const { email, password, role, name, department } = req.body;

  try {
    if (!email || !password || !role || !name || !department) {
      return res.status(400).json({
        message: "All fields are required: email, password, role, name, department",
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanDepartment = department.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({
        message: "Please enter a valid email address",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    // Only students can register publicly.
    if (role !== "student") {
      return res.status(403).json({
        message: "Public registration is only available for students",
      });
    }

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email: cleanEmail,
      password: hashedPassword,
      role,
      name: cleanName,
      department: cleanDepartment,
    });

    await newUser.save();

    return res.status(201).json({
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "User with this email already exists",
      });
    }

    return res.status(500).json({
      message: "Server error during registration",
    });
  }
};

// ==========================================
// LOGIN A USER
// ==========================================

const login = async (req, res) => {
  const { email, password, role } = req.body;

  try {
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password ||
      !["student", "staff", "admin"].includes(role)
    ) {
      return res.status(400).json({
        message: "Please provide valid login credentials and role",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is missing.");

      return res.status(500).json({
        message: "Server authentication configuration error.",
      });
    }

    // ADMIN LOGIN
    if (role === "admin") {
      const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (
        !adminEmail ||
        !adminPassword ||
        cleanEmail !== adminEmail ||
        password !== adminPassword
      ) {
        return res.status(400).json({
          message: "Invalid admin credentials",
        });
      }

      const user = {
        id: "admin",
        email: adminEmail,
        role: "admin",
        name: "Admin",
      };

      const token = jwt.sign(user, process.env.JWT_SECRET, {
        expiresIn: "48h",
      });

      return res.status(200).json({
        token,
        user,
      });
    }

    // STUDENT / STAFF LOGIN
    const user = await User.findOne({
      email: cleanEmail,
      role,
    });

    if (!user) {
      return res.status(400).json({
        message: "Email not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        message: "Incorrect password",
      });
    }

    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        name: user.name,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "48h",
      }
    );

    return res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Server error during login",
    });
  }
};

// ==========================================
// GET USER STATISTICS
// ==========================================

const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const studentCount = await User.countDocuments({
      role: "student",
    });
    const staffCount = await User.countDocuments({
      role: "staff",
    });

    return res.json({
      total: totalUsers,
      students: studentCount,
      staff: staffCount,
    });
  } catch (error) {
    console.error("Error in getUserStats:", error.message);

    return res.status(500).json({
      message: "Server error",
    });
  }
};

module.exports = {
  register,
  login,
  getUserStats,
};
