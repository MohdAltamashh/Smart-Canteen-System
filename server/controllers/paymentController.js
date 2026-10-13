const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");

const User = require("../models/User");
const FoodItem = require("../models/FoodItem");
const FoodCourt = require("../models/FoodCourt");
const Order = require("../models/Order");
const Payment = require("../models/Payment");

// =====================================================
// RAZORPAY INSTANCE
// =====================================================

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// =====================================================
// HELPER: SEND ORDER EMAIL SAFELY
// =====================================================

const sendOrderEmailSafely = (order) => {
  try {
    const {
      sendOrderConfirmationEmail,
    } = require("../services/emailService");

    Promise.resolve(
      sendOrderConfirmationEmail(order)
    ).catch((error) => {
      console.error(
        "Order confirmation email failed:",
        error.message
      );
    });
  } catch (error) {
    console.error(
      "Order confirmation email error:",
      error.message
    );
  }
};

// =====================================================
// HELPER: NOTIFY STUDENT USING SOCKET.IO
// =====================================================

const notifyStudent = (req, order) => {
  try {
    const io = req.app.get("io");

    if (io && order.user) {
      io.to(`user_${order.user}`).emit(
        "orderStatusUpdated",
        {
          orderId: order.orderId,
          tokenNumber: order.tokenNumber,
          previousStatus: null,
          status: order.status,
          totalAmount: order.totalAmount,
          message:
            `Payment successful. Order ${order.orderId} has been placed.`,
          updatedAt: order.updatedAt,
        }
      );
    }
  } catch (error) {
    console.error(
      "Socket notification error:",
      error.message
    );
  }
};

// =====================================================
// CREATE RAZORPAY PAYMENT ORDER
// =====================================================

const createPaymentOrder = async (req, res) => {
  try {
    const { items } = req.body;

    // -------------------------------------------------
    // VALIDATE CART
    // -------------------------------------------------

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Cart is empty.",
      });
    }

    // -------------------------------------------------
    // VALIDATE STUDENT
    // -------------------------------------------------

    if (
      !req.user ||
      !mongoose.Types.ObjectId.isValid(
        String(req.user.id)
      )
    ) {
      return res.status(401).json({
        message: "Please login again.",
      });
    }

    const student = await User.findById(req.user.id);

    if (!student) {
      return res.status(404).json({
        message: "Student account not found.",
      });
    }

    // -------------------------------------------------
    // VALIDATE ITEM IDs AND QUANTITIES
    // -------------------------------------------------

    const quantityById = new Map();

    for (const item of items) {
      const itemId = item && (item._id || item.foodItem);
      const quantity = Number(item && item.quantity);

      if (
        !itemId ||
        !mongoose.Types.ObjectId.isValid(
          String(itemId)
        ) ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        quantity > 100
      ) {
        return res.status(400).json({
          message: "Invalid food item or quantity.",
        });
      }

      const id = String(itemId);

      quantityById.set(
        id,
        (quantityById.get(id) || 0) + quantity
      );

      if (quantityById.get(id) > 100) {
        return res.status(400).json({
          message:
            "Maximum quantity per food item is 100.",
        });
      }
    }

    // -------------------------------------------------
    // LOAD FOOD ITEMS FROM DATABASE
    // -------------------------------------------------

    const requestedItems = Array.from(
      quantityById.entries()
    ).map(([id, quantity]) => ({
      _id: id,
      quantity,
    }));

    const foodIds = requestedItems.map(
      (item) => item._id
    );

    const foods = await FoodItem.find({
      _id: { $in: foodIds },
    });

    if (foods.length !== foodIds.length) {
      return res.status(400).json({
        message:
          "One or more food items no longer exist.",
      });
    }

    const foodById = new Map(
      foods.map((food) => [
        String(food._id),
        food,
      ])
    );

    // -------------------------------------------------
    // VALIDATE AVAILABILITY AND FOOD COURT
    // -------------------------------------------------

    for (const requested of requestedItems) {
      const food = foodById.get(
        String(requested._id)
      );

      if (!food) {
        return res.status(400).json({
          message: "Food item not found.",
        });
      }

      if (food.isAvailable === false) {
        return res.status(400).json({
          message:
            `${food.name} is currently unavailable.`,
        });
      }

      if (!food.foodCourt) {
        return res.status(400).json({
          message:
            `${food.name} is not assigned to a food court.`,
        });
      }

      const price = Number(food.price);

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          message:
            `Invalid price configured for ${food.name}.`,
        });
      }
    }

    // -------------------------------------------------
    // ENSURE ALL ITEMS BELONG TO ONE FOOD COURT
    // -------------------------------------------------

    const courtIds = [
      ...new Set(
        foods.map((food) =>
          String(food.foodCourt)
        )
      ),
    ];

    if (courtIds.length !== 1) {
      return res.status(400).json({
        message:
          "Your cart contains items from different food courts. Please clear your cart and select items from one food court.",
        code: "MULTIPLE_FOOD_COURTS",
      });
    }

    const foodCourtId = courtIds[0];

    const foodCourt = await FoodCourt.findById(
      foodCourtId
    );
    console.log("Food Court IDs:", courtIds);
    console.log("Selected Food Court ID:", foodCourtId);
    console.log("Selected Food Court:", foodCourt);
    console.log("Payment Model DB:", Payment.db.name);
    console.log("FoodCourt Model DB:", FoodCourt.db.name);

    if (
      !foodCourt ||
      foodCourt.isActive === false
    ) {
      return res.status(400).json({
        message:
          "The selected food court is unavailable.",
      });
    }

    // -------------------------------------------------
    // BUILD ORDER ITEMS USING DATABASE PRICES
    // -------------------------------------------------

    const orderItems = requestedItems.map(
      (requested) => {
        const food = foodById.get(
          String(requested._id)
        );

        const price = Number(food.price);
        const quantity = requested.quantity;

        const subtotal = Number(
          (price * quantity).toFixed(2)
        );

        return {
          foodItem: food._id,
          name: food.name,
          price,
          quantity,
          subtotal,
        };
      }
    );

    const totalAmount = Number(
      orderItems
        .reduce(
          (sum, item) => sum + item.subtotal,
          0
        )
        .toFixed(2)
    );

    if (
      !Number.isFinite(totalAmount) ||
      totalAmount <= 0
    ) {
      return res.status(400).json({
        message: "Invalid order amount.",
      });
    }

    // -------------------------------------------------
    // CHECK RAZORPAY CONFIGURATION
    // -------------------------------------------------

    if (
      !process.env.RAZORPAY_KEY_ID ||
      !process.env.RAZORPAY_KEY_SECRET
    ) {
      return res.status(500).json({
        message:
          "Payment gateway is not configured correctly.",
      });
    }

    // -------------------------------------------------
    // CREATE RAZORPAY ORDER
    // -------------------------------------------------

    const amountInPaise = Math.round(
      totalAmount * 100
    );

    const razorpayOrder =
      await razorpay.orders.create({
        amount: amountInPaise,
        currency: "INR",
        receipt: `canteen_${Date.now()}`,
        notes: {
          userId: String(student._id),
          studentEmail: student.email,
          foodCourtId: String(foodCourt._id),
        },
      });

    // DEBUG: Check payment data before saving

    console.log("========== PAYMENT DEBUG ==========");
    console.log("Student ID:", student?._id);
    console.log("Food Court ID:", foodCourt?._id);
    console.log("Food Court Object:", foodCourt);
    console.log("Razorpay Order ID:", razorpayOrder?.id);
    console.log("Payment Model:", Payment.modelName);
    console.log("Payment Database:", Payment.db.name);

    const payment = new Payment({
      user: student._id,
      studentName: student.name,
      studentEmail: student.email,
      foodCourt: foodCourt._id,
      items: orderItems,
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
      currency: "INR",
      status: "Created",
    });

    console.log(
      "Payment foodCourt before save:",
      payment.foodCourt
    );

    await payment.save();

    console.log("Payment saved successfully:", payment._id);
    console.log("==================================");

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    return res.status(201).json({
      message:
        "Payment order created successfully.",
      payment: {
        paymentId: payment._id,
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmount,
        amountInPaise,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
        studentName: student.name,
        studentEmail: student.email,
        foodCourt: {
          _id: foodCourt._id,
          name: foodCourt.name,
        },
        items: orderItems,
      },
    });
  } catch (error) {
    console.error(
      "Create payment order error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to create payment order.",
      error: error.message,
    });
  }
};

// =====================================================
// VERIFY RAZORPAY PAYMENT
// =====================================================

const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    // -------------------------------------------------
    // VALIDATE PAYMENT RESPONSE
    // -------------------------------------------------

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message:
          "Payment verification data is incomplete.",
      });
    }

    // -------------------------------------------------
    // FIND PAYMENT
    // -------------------------------------------------

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment record not found.",
      });
    }

    // -------------------------------------------------
    // VERIFY PAYMENT OWNER
    // -------------------------------------------------

    if (
      String(payment.user) !==
      String(req.user.id)
    ) {
      return res.status(403).json({
        message:
          "You are not allowed to verify this payment.",
      });
    }

    // -------------------------------------------------
    // DUPLICATE VERIFICATION
    // -------------------------------------------------

    if (payment.status === "Paid") {
      const existingOrder = payment.order
        ? await Order.findById(payment.order)
        : null;

      if (!existingOrder) {
        return res.status(409).json({
          message:
            "Payment is marked as paid, but its order could not be found. Please contact support.",
          paymentStatus: "Paid",
        });
      }

      return res.status(200).json({
        message: "Payment already verified.",
        paymentStatus: "Paid",
        payment: {
          paymentId: payment._id,
          razorpayOrderId:
            payment.razorpayOrderId,
          razorpayPaymentId:
            payment.razorpayPaymentId,
          amount: payment.amount,
          status: payment.status,
        },
        order: existingOrder,
      });
    }

    // -------------------------------------------------
    // VERIFY RAZORPAY SIGNATURE
    // -------------------------------------------------

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        message:
          "Payment gateway is not configured correctly.",
      });
    }

    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    const expectedBuffer = Buffer.from(
      generatedSignature,
      "hex"
    );

    const receivedBuffer = Buffer.from(
      razorpay_signature,
      "hex"
    );

    const validSignature =
      expectedBuffer.length ===
      receivedBuffer.length &&
      crypto.timingSafeEqual(
        expectedBuffer,
        receivedBuffer
      );

    if (!validSignature) {
      payment.status = "Failed";
      await payment.save();

      return res.status(400).json({
        message:
          "Payment signature verification failed.",
      });
    }

    // -------------------------------------------------
    // VALIDATE FOOD COURT AND ITEMS AGAIN
    // -------------------------------------------------

    if (!payment.foodCourt) {
      return res.status(400).json({
        message:
          "Food Court information is missing from this payment. Please contact support.",
      });
    }

    const foodCourt = await FoodCourt.findById(
      payment.foodCourt
    );

    if (
      !foodCourt ||
      foodCourt.isActive === false
    ) {
      return res.status(400).json({
        message:
          "The selected food court is unavailable.",
      });
    }

    const paymentFoodIds = payment.items.map(
      (item) => String(item.foodItem)
    );

    const currentFoods = await FoodItem.find({
      _id: { $in: paymentFoodIds },
    });

    if (
      currentFoods.length !==
      new Set(paymentFoodIds).size
    ) {
      return res.status(400).json({
        message:
          "One or more ordered food items no longer exist.",
      });
    }

    const allItemsMatchCourt =
      currentFoods.length > 0 &&
      currentFoods.every(
        (food) =>
          food.foodCourt &&
          String(food.foodCourt) ===
          String(payment.foodCourt)
      );

    if (!allItemsMatchCourt) {
      return res.status(400).json({
        message:
          "The food items do not match the selected food court.",
      });
    }

    // -------------------------------------------------
    // FIND STUDENT
    // -------------------------------------------------

    const student = await User.findById(
      req.user.id
    );

    if (!student) {
      return res.status(404).json({
        message: "Student account not found.",
      });
    }

    // -------------------------------------------------
    // GENERATE ORDER ID AND TOKEN
    // -------------------------------------------------

    const orderId = `ORD-${Date.now()}`;

    const lastOrder = await Order.findOne().sort({
      tokenNumber: -1,
    });

    const tokenNumber = lastOrder
      ? lastOrder.tokenNumber + 1
      : 1;

    // -------------------------------------------------
    // CREATE ORDER WITH FOOD COURT
    // -------------------------------------------------

    const order = new Order({
      orderId,
      tokenNumber,
      user: student._id,
      studentName: student.name,
      studentEmail: student.email,
      foodCourt: payment.foodCourt,
      items: payment.items,
      totalAmount: payment.amount,
      status: "Pending",
    });

    await order.save();

    // -------------------------------------------------
    // UPDATE PAYMENT AFTER ORDER CREATION
    // -------------------------------------------------

    payment.razorpayPaymentId =
      razorpay_payment_id;

    payment.razorpaySignature =
      razorpay_signature;

    payment.status = "Paid";
    payment.order = order._id;

    await payment.save();

    // -------------------------------------------------
    // SEND EMAIL WITHOUT BLOCKING RESPONSE
    // -------------------------------------------------

    sendOrderEmailSafely(order);

    // -------------------------------------------------
    // SOCKET.IO NOTIFICATION
    // -------------------------------------------------

    notifyStudent(req, order);

    // -------------------------------------------------
    // FINAL RESPONSE
    // -------------------------------------------------

    return res.status(200).json({
      message:
        "Payment verified and order created successfully.",
      payment: {
        paymentId: payment._id,
        razorpayOrderId:
          payment.razorpayOrderId,
        razorpayPaymentId:
          payment.razorpayPaymentId,
        amount: payment.amount,
        status: payment.status,
        foodCourt: payment.foodCourt,
      },
      order: {
        _id: order._id,
        orderId: order.orderId,
        tokenNumber: order.tokenNumber,
        items: order.items,
        totalAmount: order.totalAmount,
        foodCourt: order.foodCourt,
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Verify payment error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to verify payment.",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createPaymentOrder,
  verifyPayment,
};