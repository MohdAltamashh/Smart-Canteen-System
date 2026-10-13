const mongoose = require("mongoose");
const canteenDB = require("../canteendb");

const paymentSchema = new mongoose.Schema(
  {
    // Student details
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    studentName: {
      type: String,
      required: true,
      trim: true,
    },

    studentEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // Food Court associated with this payment
    foodCourt: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FoodCourt",
      required: true,
      index: true,
    },

    // Food items included in the payment
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
        message: "Payment must contain at least one item.",
      },
    },

    // Razorpay details
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    razorpayPaymentId: {
      type: String,
      default: "",
    },

    razorpaySignature: {
      type: String,
      default: "",
    },

    // Payment details
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

    // Generated order reference
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

module.exports =
  canteenDB.models.Payment ||
  canteenDB.model("Payment", paymentSchema);