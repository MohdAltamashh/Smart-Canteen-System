const mongoose = require("mongoose");
const canteenDB = require("../canteendb");

const orderSchema = new mongoose.Schema(
  {
    // Unique order ID
    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // Token displayed to the student and staff
    tokenNumber: {
      type: Number,
      required: true,
    },

    // Student who placed the order
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Food Court responsible for this entire order
    foodCourt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodCourt",
      required: true,
      index: true,
    },

    studentName: {
      type: String,
      default: "",
      trim: true,
    },

    studentEmail: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    // Items belonging to the same Food Court
    items: {
      type: [
        {
          foodItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FoodItem",
            required: true,
          },

          name: {
            type: String,
            required: true,
            trim: true,
          },

          price: {
            type: Number,
            required: true,
            min: 0,
          },

          quantity: {
            type: Number,
            required: true,
            min: 1,
            validate: {
              validator: Number.isInteger,
              message: "Quantity must be a whole number.",
            },
          },

          subtotal: {
            type: Number,
            required: true,
            min: 0,
          },
        },
      ],
      validate: {
        validator: function (items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: "An order must contain at least one item.",
      },
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Preparing",
        "Ready",
        "Completed",
        "Cancelled",
      ],
      default: "Pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  canteenDB.models.Order ||
  canteenDB.model("Order", orderSchema);