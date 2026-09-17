const mongoose = require("mongoose");
const canteenDB = require("../canteendb");

const paymentSchema = new mongoose.Schema(
  {
    // =====================================================
    // STUDENT
    // =====================================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    studentName: {
      type: String,
      required: true,
    },

    studentEmail: {
      type: String,
      required: true,
    },

    // =====================================================
    // ORDER ITEMS
    // =====================================================

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

    // =====================================================
    // RAZORPAY DETAILS
    // =====================================================

    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },

    razorpayPaymentId: {
      type: String,
      default: "",
    },

    razorpaySignature: {
      type: String,
      default: "",
    },

    // =====================================================
    // PAYMENT DETAILS
    // =====================================================

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    currency: {
      type: String,
      default: "INR",
    },

    status: {
      type: String,
      enum: [
        "Created",
        "Paid",
        "Failed",
      ],
      default: "Created",
    },

    // =====================================================
    // SMART CANTEEN ORDER REFERENCE
    // =====================================================

    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      default: null,
    },
  },

  {
    timestamps: true,
  }
);


// =====================================================
// EXPORT MODEL
// =====================================================

module.exports =
  canteenDB.models.Payment ||
  canteenDB.model(
    "Payment",
    paymentSchema
  );