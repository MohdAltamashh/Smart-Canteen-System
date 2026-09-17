const Order = require("../models/Order");
const User = require("../models/User");

const {
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
} = require("../services/emailService");

// =====================================================
// CREATE ORDER
// =====================================================

const createOrder = async (req, res) => {
  try {
    const { items, totalAmount } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "Cart is empty",
      });
    }

    const student = await User.findById(req.user.id);

    if (!student) {
      return res.status(404).json({
        message: "Student account not found",
      });
    }

    // Generate Order ID
    const orderId = `ORD-${Date.now()}`;

    // Generate Token Number
    const lastOrder = await Order.findOne().sort({
      tokenNumber: -1,
    });

    const tokenNumber = lastOrder
      ? lastOrder.tokenNumber + 1
      : 1;

    // Prepare order items
    const orderItems = items.map((item) => ({
      foodItem: item._id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.price * item.quantity,
    }));

    // Create order
    const order = new Order({
      orderId,
      tokenNumber,

      user: req.user.id,

      studentName: student.name,
      studentEmail: student.email,

      items: orderItems,
      totalAmount,
      status: "Pending",
    });

    await order.save();

    // =====================================================
    // SEND ORDER CONFIRMATION EMAIL
    // =====================================================

    // Email failure should NOT stop successful order placement
    sendOrderConfirmationEmail(order).catch((emailError) => {
      console.error(
        "Order confirmation email failed:",
        emailError.message
      );
    });

    // =====================================================
    // RESPONSE
    // =====================================================

    res.status(201).json({
      message: "Order placed successfully",

      order: {
        orderId: order.orderId,
        tokenNumber: order.tokenNumber,
        items: order.items,
        totalAmount: order.totalAmount,
        status: order.status,
        createdAt: order.createdAt,
      },
    });

  } catch (error) {
    console.error(
      "Create order error:",
      error
    );

    res.status(500).json({
      message: "Failed to create order",
      error: error.message,
    });
  }
};


// =====================================================
// GET MY ORDERS
// =====================================================

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user.id,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json(orders);

  } catch (error) {
    console.error(
      "Get my orders error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};


// =====================================================
// GET ALL ORDERS
// =====================================================

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({
        createdAt: -1,
      });

    res.status(200).json(orders);

  } catch (error) {
    console.error(
      "Get all orders error:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch all orders",
      error: error.message,
    });
  }
};


// =====================================================
// CANCEL ORDER
// =====================================================

const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    // -------------------------------------------------
    // FIND ORDER
    // -------------------------------------------------

    const order = await Order.findById(
      orderId
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    // -------------------------------------------------
    // CHECK ORDER OWNER
    // -------------------------------------------------

    if (
      String(order.user) !==
      String(req.user.id)
    ) {
      return res.status(403).json({
        message:
          "You are not allowed to cancel this order.",
      });
    }

    // -------------------------------------------------
    // ONLY PENDING ORDER CAN BE CANCELLED
    // -------------------------------------------------

    if (order.status !== "Pending") {
      return res.status(400).json({
        message:
          `Order cannot be cancelled because its current status is ${order.status}.`,
      });
    }

    // -------------------------------------------------
    // UPDATE STATUS
    // -------------------------------------------------

    const previousStatus = order.status;

    order.status = "Cancelled";

    await order.save();

    // =====================================================
    // EMAIL NOTIFICATION
    // =====================================================

    sendOrderStatusEmail(
      order,
      previousStatus
    ).catch((emailError) => {
      console.error(
        "Cancellation email failed:",
        emailError.message
      );
    });

    // -------------------------------------------------
    // REAL-TIME SOCKET NOTIFICATION
    // -------------------------------------------------

    try {
      const io = req.app.get("io");

      if (io && order.user) {
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
              previousStatus,

            status:
              "Cancelled",

            totalAmount:
              order.totalAmount,

            message:
              `Your order ${order.orderId} has been cancelled.`,

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

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    res.status(200).json({
      message:
        "Order cancelled successfully",

      order: {
        _id:
          order._id,

        orderId:
          order.orderId,

        tokenNumber:
          order.tokenNumber,

        status:
          order.status,

        totalAmount:
          order.totalAmount,

        updatedAt:
          order.updatedAt,
      },
    });

  } catch (error) {
    console.error(
      "Cancel order error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to cancel order",
      error:
        error.message,
    });
  }
};


// =====================================================
// UPDATE ORDER STATUS
// =====================================================

const updateOrderStatus = async (
  req,
  res
) => {
  try {
    const { status } = req.body;

    const allowedStatuses = [
      "Pending",
      "Preparing",
      "Ready",
      "Completed",
      "Cancelled",
    ];

    // -------------------------------------------------
    // CHECK STATUS
    // -------------------------------------------------

    if (!status) {
      return res.status(400).json({
        message: "Status is required",
      });
    }

    // -------------------------------------------------
    // CHECK VALID STATUS
    // -------------------------------------------------

    if (
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        message:
          "Invalid order status",
      });
    }

    // -------------------------------------------------
    // FIND ORDER
    // -------------------------------------------------

    const order =
      await Order.findById(
        req.params.id
      );

    if (!order) {
      return res.status(404).json({
        message:
          "Order not found",
      });
    }

    // -------------------------------------------------
    // SAVE OLD STATUS
    // -------------------------------------------------

    const previousStatus =
      order.status;

    // -------------------------------------------------
    // UPDATE STATUS
    // -------------------------------------------------

    order.status = status;

    await order.save();

    // =====================================================
    // SEND EMAIL NOTIFICATION
    // =====================================================

    // Don't send an email if status hasn't actually changed
    if (previousStatus !== order.status) {
      sendOrderStatusEmail(
        order,
        previousStatus
      ).catch((emailError) => {
        console.error(
          "Order status email failed:",
          emailError.message
        );
      });
    }

    // =====================================================
    // REAL-TIME SOCKET.IO NOTIFICATION
    // =====================================================

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
              previousStatus,

            status:
              order.status,

            totalAmount:
              order.totalAmount,

            message:
              `Your order ${order.orderId} is now ${order.status}.`,

            updatedAt:
              order.updatedAt,
          }
        );

        console.log(
          `Real-time notification sent to ${roomName}`
        );
      }

    } catch (socketError) {
      console.error(
        "Socket notification error:",
        socketError
      );
    }

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    res.status(200).json({
      message:
        "Order status updated successfully",

      order: {
        orderId:
          order.orderId,

        tokenNumber:
          order.tokenNumber,

        status:
          order.status,

        totalAmount:
          order.totalAmount,

        updatedAt:
          order.updatedAt,
      },
    });

  } catch (error) {
    console.error(
      "Update order status error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to update order status",

      error:
        error.message,
    });
  }
};


// =====================================================
// EXPORT ALL FUNCTIONS
// =====================================================

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  cancelOrder,
  updateOrderStatus,
};