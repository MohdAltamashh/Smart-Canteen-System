const mongoose = require("mongoose");
const canteenDB = require("../canteendb");

const foodCourtSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  canteenDB.models.FoodCourt ||
  canteenDB.model("FoodCourt", foodCourtSchema);