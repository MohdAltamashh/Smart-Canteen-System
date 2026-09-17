const Order = require("../models/Order");

// =====================================================
// GET SMART TOKEN QUEUE
// =====================================================

const getTokenQueue = async (req, res) => {
  try {
    // ---------------------------------------------------
    // Logged-in student ID
    // ---------------------------------------------------

    const userId = req.user.id;

    // ---------------------------------------------------
    // Active orders
    // Pending + Preparing
    // Oldest order first
    // ---------------------------------------------------

    const activeOrders = await Order.find({
      status: {
        $in: ["Pending", "Preparing"],
      },
    }).sort({
      createdAt: 1,
    });

    // ---------------------------------------------------
    // Current student's active order
    // ---------------------------------------------------

    const myOrder = activeOrders.find(
      (order) =>
        String(order.user) === String(userId)
    );

    // ---------------------------------------------------
    // If student has no active order
    // ---------------------------------------------------

    if (!myOrder) {
      return res.json({
        hasActiveOrder: false,
        message: "No active order found",
      });
    }

    // ---------------------------------------------------
    // Currently serving token
    // ---------------------------------------------------

    const preparingOrder = activeOrders.find(
      (order) => order.status === "Preparing"
    );

    const currentlyServing =
      preparingOrder
        ? preparingOrder.tokenNumber
        : null;

    // ---------------------------------------------------
    // People ahead
    // ---------------------------------------------------

    const peopleAhead = activeOrders.filter(
      (order) =>
        new Date(order.createdAt) <
        new Date(myOrder.createdAt)
    ).length;

    // ---------------------------------------------------
    // Estimated waiting time
    // ---------------------------------------------------
    // Average estimated time:
    // 3 minutes per order ahead
    // ---------------------------------------------------

    const estimatedMinutes =
      peopleAhead * 3;

    // ---------------------------------------------------
    // Queue position
    // ---------------------------------------------------

    const queuePosition =
      activeOrders.findIndex(
        (order) =>
          String(order._id) ===
          String(myOrder._id)
      ) + 1;

    // ---------------------------------------------------
    // Response
    // ---------------------------------------------------

    res.json({
      hasActiveOrder: true,

      yourToken: myOrder.tokenNumber,

      orderId: myOrder.orderId,

      orderStatus: myOrder.status,

      currentlyServing,

      peopleAhead,

      queuePosition,

      estimatedMinutes,

      queueLength: activeOrders.length,
    });

  } catch (error) {
    console.error(
      "Token queue error:",
      error
    );

    res.status(500).json({
      message:
        "Failed to load token queue",
    });
  }
};

module.exports = {
  getTokenQueue,
};