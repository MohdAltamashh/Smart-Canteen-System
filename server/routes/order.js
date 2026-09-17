const express = require("express");

const {
  createOrder,
  getMyOrders,
  getAllOrders,
  cancelOrder,
  updateOrderStatus,
} = require("../controllers/orderController");

const {
  getTokenQueue,
} = require("../controllers/queueController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();


// =====================================================
// CREATE ORDER
// =====================================================

router.post(
  "/",
  authMiddleware,
  createOrder
);


// =====================================================
// MY ORDERS
// =====================================================

router.get(
  "/my-orders",
  authMiddleware,
  getMyOrders
);


// =====================================================
// LIVE TOKEN QUEUE
// =====================================================

router.get(
  "/queue",
  authMiddleware,
  getTokenQueue
);


// =====================================================
// ALL ORDERS
// =====================================================

router.get(
  "/all",
  authMiddleware,
  getAllOrders
);


// =====================================================
// CANCEL ORDER
// IMPORTANT: THIS MUST COME BEFORE /:id/status
// =====================================================

router.put(
  "/:id/cancel",
  authMiddleware,
  cancelOrder
);


// =====================================================
// UPDATE ORDER STATUS
// =====================================================

router.put(
  "/:id/status",
  authMiddleware,
  updateOrderStatus
);


module.exports = router;