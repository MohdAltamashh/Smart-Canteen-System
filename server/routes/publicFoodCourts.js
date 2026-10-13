
const express = require("express");
const router = express.Router();

const FoodCourt = require("../models/FoodCourt");

// Public API: return all active food courts for students.
router.get("/", async (req, res) => {
  try {
    const foodCourts = await FoodCourt.find({
      isActive: true,
    })
      .select("_id name description isActive")
      .sort({ name: 1 })
      .lean();

    return res.status(200).json(foodCourts);
  } catch (error) {
    console.error("Public Food Courts error:", error);

    return res.status(500).json({
      message: "Failed to load Food Courts.",
    });
  }
});

module.exports = router;
