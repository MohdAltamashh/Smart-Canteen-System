const mongoose = require("mongoose");
const canteenDB = require("../canteendb");

// =====================================================
// ORDER SCHEMA
// =====================================================

const orderSchema = new mongoose.Schema(
  {
    // ===================================================
    // ORDER ID
    // ===================================================

    orderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    // ===================================================
    // TOKEN NUMBER
    // ===================================================

    tokenNumber: {
      type: Number,
      required: true,
    },

    // ===================================================
    // STUDENT USER ID
    // ===================================================

    // ===================================================
    // STUDENT USER
    // ===================================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    studentName: {
      type: String,
      default: "",
    },

    studentEmail: {
      type: String,
      default: "",
    },

    // ===================================================
    // ORDER ITEMS
    // ===================================================

    items: [
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
        },

        subtotal: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],

    // ===================================================
    // TOTAL AMOUNT
    // ===================================================

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    // ===================================================
    // ORDER STATUS
    // ===================================================

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

// =====================================================
// SMART CANTEEN DATABASE MODEL
// =====================================================

// IMPORTANT:
// Order model SmartCanteenDB connection par banega.
// Isse orders SmartCanteenDB ke "orders" collection me save honge.

module.exports = canteenDB.model(
  "Order",
  orderSchema
);