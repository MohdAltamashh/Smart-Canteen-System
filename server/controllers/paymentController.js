const Razorpay = require("razorpay");
const crypto = require("crypto");

const User = require("../models/User");
const FoodItem = require("../models/FoodItem");
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
// CREATE RAZORPAY PAYMENT ORDER
// =====================================================

const createPaymentOrder = async (req, res) => {
  try {

    const { items } = req.body;


    // =================================================
    // VALIDATE CART
    // =================================================

    if (
      !items ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }


    // =================================================
    // FIND STUDENT
    // =================================================

    const student =
      await User.findById(req.user.id);

    if (!student) {
      return res.status(404).json({
        message:
          "Student account not found",
      });
    }


    // =================================================
    // CALCULATE TOTAL FROM DATABASE
    // =================================================

    const orderItems = [];

    let totalAmount = 0;


    for (const item of items) {

      // -----------------------------------------------
      // CHECK FOOD ID
      // -----------------------------------------------

      if (!item._id) {
        return res.status(400).json({
          message:
            "Invalid food item",
        });
      }


      // -----------------------------------------------
      // FIND FOOD FROM DATABASE
      // -----------------------------------------------

      const foodItem =
        await FoodItem.findById(
          item._id
        );

      if (!foodItem) {
        return res.status(404).json({
          message:
            `Food item not found: ${item._id}`,
        });
      }


      // -----------------------------------------------
      // CHECK AVAILABILITY
      // -----------------------------------------------

      if (!foodItem.isAvailable) {
        return res.status(400).json({
          message:
            `${foodItem.name} is currently unavailable`,
        });
      }


      // -----------------------------------------------
      // VALIDATE QUANTITY
      // -----------------------------------------------

      const quantity =
        Number(item.quantity);

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          message:
            `Invalid quantity for ${foodItem.name}`,
        });
      }


      // -----------------------------------------------
      // CALCULATE SUBTOTAL
      // -----------------------------------------------

      const subtotal =
        foodItem.price * quantity;


      totalAmount += subtotal;


      // -----------------------------------------------
      // SAVE ITEM
      // -----------------------------------------------

      orderItems.push({
        foodItem:
          foodItem._id,

        name:
          foodItem.name,

        price:
          foodItem.price,

        quantity:
          quantity,

        subtotal:
          subtotal,
      });
    }


    // =================================================
    // VALIDATE TOTAL
    // =================================================

    if (totalAmount <= 0) {
      return res.status(400).json({
        message:
          "Invalid order amount",
      });
    }


    // =================================================
    // CONVERT RUPEES TO PAISE
    // =================================================

    const amountInPaise =
      Math.round(
        totalAmount * 100
      );


    // =================================================
    // CREATE RAZORPAY ORDER
    // =================================================

    const razorpayOrder =
      await razorpay.orders.create({

        amount:
          amountInPaise,

        currency:
          "INR",

        receipt:
          `canteen_${Date.now()}`,

        notes: {
          userId:
            String(req.user.id),

          studentEmail:
            student.email,
        },
      });


    // =================================================
    // SAVE PAYMENT RECORD
    // =================================================

    const payment =
      new Payment({

        user:
          req.user.id,

        studentName:
          student.name,

        studentEmail:
          student.email,

        items:
          orderItems,

        razorpayOrderId:
          razorpayOrder.id,

        amount:
          totalAmount,

        currency:
          "INR",

        status:
          "Created",
      });


    await payment.save();


    // =================================================
    // RESPONSE
    // =================================================

    res.status(201).json({

      message:
        "Payment order created successfully",

      payment: {

        paymentId:
          payment._id,

        razorpayOrderId:
          razorpayOrder.id,

        amount:
          totalAmount,

        amountInPaise:
          amountInPaise,

        currency:
          "INR",

        keyId:
          process.env.RAZORPAY_KEY_ID,

        studentName:
          student.name,

        studentEmail:
          student.email,

        items:
          orderItems,
      },
    });

  } catch (error) {

    console.error(
      "Create payment order error:",
      error
    );

    res.status(500).json({

      message:
        "Failed to create payment order",

      error:
        error.message,
    });
  }
};


// =====================================================
// VERIFY RAZORPAY PAYMENT
// =====================================================

const verifyPayment = async (
  req,
  res
) => {

  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;


    // =================================================
    // VALIDATE PAYMENT RESPONSE
    // =================================================

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {

      return res.status(400).json({

        message:
          "Payment verification data is incomplete",
      });
    }


    // =================================================
    // FIND PAYMENT
    // =================================================

    const payment =
      await Payment.findOne({

        razorpayOrderId:
          razorpay_order_id,
      });


    if (!payment) {

      return res.status(404).json({

        message:
          "Payment record not found",
      });
    }


    // =================================================
    // CHECK PAYMENT OWNER
    // =================================================

    if (
      String(payment.user) !==
      String(req.user.id)
    ) {

      return res.status(403).json({

        message:
          "You are not allowed to verify this payment",
      });
    }


    // =================================================
    // DUPLICATE PAYMENT CHECK
    // =================================================

    if (
      payment.status === "Paid"
    ) {

      const existingOrder =
        payment.order
          ? await Order.findById(
              payment.order
            )
          : null;


      return res.status(200).json({

        message:
          "Payment already verified",

        paymentStatus:
          "Paid",

        order:
          existingOrder,
      });
    }


    // =================================================
    // GENERATE SIGNATURE
    // =================================================

    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(
          `${razorpay_order_id}|${razorpay_payment_id}`
        )
        .digest("hex");


    // =================================================
    // VERIFY SIGNATURE
    // =================================================

    if (
      generatedSignature !==
      razorpay_signature
    ) {

      payment.status =
        "Failed";

      await payment.save();


      return res.status(400).json({

        message:
          "Payment signature verification failed",
      });
    }


    // =================================================
    // FIND STUDENT
    // =================================================

    const student =
      await User.findById(
        req.user.id
      );


    if (!student) {

      return res.status(404).json({

        message:
          "Student account not found",
      });
    }


    // =================================================
    // SAVE PAYMENT DETAILS
    // =================================================

    payment.razorpayPaymentId =
      razorpay_payment_id;

    payment.razorpaySignature =
      razorpay_signature;

    payment.status =
      "Paid";


    // =================================================
    // GENERATE SMART CANTEEN ORDER ID
    // =================================================

    const orderId =
      `ORD-${Date.now()}`;


    // =================================================
    // GENERATE TOKEN NUMBER
    // =================================================

    const lastOrder =
      await Order.findOne()
        .sort({
          tokenNumber: -1,
        });


    const tokenNumber =
      lastOrder
        ? lastOrder.tokenNumber + 1
        : 1;


    // =================================================
    // CREATE SMART CANTEEN ORDER
    // =================================================

    const order =
      new Order({

        orderId:

          orderId,

        tokenNumber:

          tokenNumber,

        user:

          req.user.id,

        studentName:

          student.name,

        studentEmail:

          student.email,

        items:

          payment.items,

        totalAmount:

          payment.amount,

        status:

          "Pending",
      });


    await order.save();


    // =================================================
    // LINK PAYMENT WITH ORDER
    // =================================================

    payment.order =
      order._id;

    await payment.save();


    // =================================================
    // SEND ORDER CONFIRMATION EMAIL
    // =================================================

    try {

      const {
        sendOrderConfirmationEmail,
      } =
        require(
          "../services/emailService"
        );


      await sendOrderConfirmationEmail(
        order
      );

    } catch (emailError) {

      console.error(
        "Payment order email error:",
        emailError.message
      );
    }


    // =================================================
    // SOCKET.IO NOTIFICATION
    // =================================================

    try {

      const io =
        req.app.get("io");


      if (
        io &&
        order.user
      ) {

        const roomName =
          `user_${order.user}`;


        io.to(roomName).emit(

          "orderStatusUpdated",

          {

            orderId:
              order.orderId,

            tokenNumber:
              order.tokenNumber,

            previousStatus:
              null,

            status:
              order.status,

            totalAmount:
              order.totalAmount,

            message:
              `Your payment was successful and order ${order.orderId} has been placed.`,

            updatedAt:
              order.updatedAt,
          }
        );
      }

    } catch (socketError) {

      console.error(
        "Socket notification error:",
        socketError
      );
    }


    // =================================================
    // FINAL RESPONSE
    // =================================================

    res.status(200).json({

      message:
        "Payment verified and order created successfully",

      payment: {

        paymentId:
          payment._id,

        razorpayOrderId:
          razorpay_order_id,

        razorpayPaymentId:
          razorpay_payment_id,

        amount:
          payment.amount,

        status:
          payment.status,
      },

      order: {

        _id:
          order._id,

        orderId:
          order.orderId,

        tokenNumber:
          order.tokenNumber,

        items:
          order.items,

        totalAmount:
          order.totalAmount,

        status:
          order.status,

        createdAt:
          order.createdAt,
      },
    });

  } catch (error) {

    console.error(
      "Verify payment error:",
      error
    );


    res.status(500).json({

      message:
        "Failed to verify payment",

      error:
        error.message,
    });
  }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {

  createPaymentOrder,

  verifyPayment,

};