const mongoose = require("mongoose");
const canteenDB = require("../canteendb");

const foodItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Breakfast",
        "Lunch",
        "Snacks",
        "Beverages",
        "Fast Food",
      ],
    },

    imageUrl: {
      type: String,
      default: "",
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  canteenDB.models.FoodItem ||
  canteenDB.model("FoodItem", foodItemSchema);