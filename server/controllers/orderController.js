const mongoose = require("mongoose");

const Order = require("../models/Order");
const User = require("../models/User");
const FoodItem = require("../models/FoodItem");
const FoodCourt = require("../models/FoodCourt");

const {
  sendOrderConfirmationEmail,
  sendOrderStatusEmail,
} = require("../services/emailService");

// =====================================================
// HELPER: CHECK ADMIN
// =====================================================

const isAdmin = (req) => {
  return (
    req.user &&
    (
      req.user.role === "admin" ||
      String(req.user.id) === "admin"
    )
  );
};

// =====================================================
// HELPER: SOCKET.IO NOTIFICATION
// =====================================================

const notifyOrderStatus = (
  req,
  order,
  previousStatus
) => {
  try {
    const io = req.app.get("io");

    if (io && order.user) {
      io.to(`user_${order.user}`).emit(
        "orderStatusUpdated",
        {
          orderId: order.orderId,
          tokenNumber: order.tokenNumber,
          previousStatus,
          status: order.status,
          totalAmount: order.totalAmount,
          message:
            `Your order ${order.orderId} is now ${order.status}.`,
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
// HELPER: STATUS EMAIL
// =====================================================

const sendStatusEmailSafely = (
  order,
  previousStatus
) => {
  try {
    Promise.resolve(
      sendOrderStatusEmail(
        order,
        previousStatus
      )
    ).catch((error) => {
      console.error(
        "Order status email failed:",
        error.message
      );
    });
  } catch (error) {
    console.error(
      "Order status email error:",
      error.message
    );
  }
};

// =====================================================
// HELPER: ORDER CONFIRMATION EMAIL
// =====================================================

const sendConfirmationEmailSafely = (
  order
) => {
  try {
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
// HELPER: LOAD CURRENT USER
// =====================================================

const getCurrentUser = async (req) => {
  if (isAdmin(req)) {
    return {
      _id: "admin",
      role: "admin",
      foodCourt: null,
    };
  }

  const userId = req.user && req.user.id;

  if (
    !userId ||
    !mongoose.Types.ObjectId.isValid(
      String(userId)
    )
  ) {
    return null;
  }

  return User.findById(userId).select(
    "name email role foodCourt"
  );
};

// =====================================================
// HELPER: VERIFY ORDER BELONGS TO STAFF COURT
// =====================================================

const checkStaffOrderAccess = async (
  staff,
  order
) => {
  if (
    !staff ||
    staff.role !== "staff" ||
    !staff.foodCourt
  ) {
    return {
      allowed: false,
      message:
        "Your account is not assigned to a food court.",
    };
  }

  const staffCourtId = String(
    staff.foodCourt._id ||
    staff.foodCourt
  );

  const itemIds = (order.items || [])
    .map((item) => {
      return item.foodItem &&
        String(
          item.foodItem._id ||
          item.foodItem
        );
    })
    .filter(Boolean);

  if (itemIds.length === 0) {
    return {
      allowed: false,
      message:
        "This order has no verifiable food items.",
    };
  }

  const foods = await FoodItem.find({
    _id: { $in: itemIds },
  })
    .select("_id foodCourt")
    .lean();

  const foodMap = new Map(
    foods.map((food) => [
      String(food._id),
      food,
    ])
  );

  // Every item must belong to the staff's court.
  const allItemsBelongToCourt =
    itemIds.every((itemId) => {
      const food = foodMap.get(
        String(itemId)
      );

      return (
        food &&
        food.foodCourt &&
        String(food.foodCourt) ===
          staffCourtId
      );
    });

  if (!allItemsBelongToCourt) {
    return {
      allowed: false,
      message:
        "This order contains items outside your assigned food court.",
    };
  }

  const orderCourtId = order.foodCourt
    ? String(
        order.foodCourt._id ||
        order.foodCourt
      )
    : null;

  if (orderCourtId) {
    if (orderCourtId !== staffCourtId) {
      return {
        allowed: false,
        message:
          "You cannot access another food court's order.",
      };
    }

    return {
      allowed: true,
    };
  }

  // Legacy order: associate it only after
  // verifying every item against the staff court.
  order.foodCourt = staff.foodCourt._id ||
    staff.foodCourt;

  await order.save();

  return {
    allowed: true,
  };
};

// =====================================================
// CREATE ORDER
// =====================================================

const createOrder = async (
  req,
  res
) => {
  try {
    const { items } = req.body;

    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        message: "Cart is empty.",
      });
    }

    const student = await User.findById(
      req.user.id
    );

    if (!student) {
      return res.status(404).json({
        message:
          "Student account not found.",
      });
    }

    // Validate item IDs and quantities.
    const quantityById = new Map();

    for (const item of items) {
      const itemId =
        item &&
        (
          item._id ||
          item.foodItem
        );

      const quantity = Number(
        item && item.quantity
      );

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
          message:
            "Invalid food item or quantity.",
        });
      }

      const id = String(itemId);

      const updatedQuantity =
        (quantityById.get(id) || 0) +
        quantity;

      if (updatedQuantity > 100) {
        return res.status(400).json({
          message:
            "Maximum quantity per food item is 100.",
        });
      }

      quantityById.set(
        id,
        updatedQuantity
      );
    }

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
    }

    // A single order can belong to only one court.
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
          "Please place separate orders for different food courts.",
      });
    }

    const foodCourtId = courtIds[0];

    const foodCourt = await FoodCourt.findById(
      foodCourtId
    );

    if (
      !foodCourt ||
      foodCourt.isActive === false
    ) {
      return res.status(400).json({
        message:
          "This food court is unavailable.",
      });
    }

    const orderItems = requestedItems.map(
      (requested) => {
        const food = foodById.get(
          String(requested._id)
        );

        const price = Number(food.price);

        if (
          !Number.isFinite(price) ||
          price < 0
        ) {
          throw new Error(
            `Invalid price configured for ${food.name}.`
          );
        }

        return {
          foodItem: food._id,
          name: food.name,
          price,
          quantity: requested.quantity,
          subtotal: Number(
            (
              price *
              requested.quantity
            ).toFixed(2)
          ),
        };
      }
    );

    const totalAmount = Number(
      orderItems
        .reduce(
          (sum, item) =>
            sum + item.subtotal,
          0
        )
        .toFixed(2)
    );

    if (totalAmount <= 0) {
      return res.status(400).json({
        message: "Invalid order amount.",
      });
    }

    const orderId =
      `ORD-${Date.now()}`;

    const lastOrder =
      await Order.findOne().sort({
        tokenNumber: -1,
      });

    const tokenNumber = lastOrder
      ? lastOrder.tokenNumber + 1
      : 1;

    const order = new Order({
      orderId,
      tokenNumber,
      user: student._id,
      studentName: student.name,
      studentEmail: student.email,
      foodCourt: foodCourt._id,
      items: orderItems,
      totalAmount,
      status: "Pending",
    });

    await order.save();

    sendConfirmationEmailSafely(order);

    return res.status(201).json({
      message: "Order placed successfully.",
      order: {
        _id: order._id,
        orderId: order.orderId,
        tokenNumber: order.tokenNumber,
        items: order.items,
        totalAmount: order.totalAmount,
        foodCourt: {
          _id: foodCourt._id,
          name: foodCourt.name,
        },
        status: order.status,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Create order error:",
      error
    );

    return res.status(500).json({
      message: "Failed to create order.",
      error: error.message,
    });
  }
};

// =====================================================
// GET MY ORDERS
// =====================================================

const getMyOrders = async (
  req,
  res
) => {
  try {
    const orders = await Order.find({
      user: req.user.id,
    })
      .populate("foodCourt", "name")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json(orders);
  } catch (error) {
    console.error(
      "Get my orders error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch orders.",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL ORDERS
// ADMIN: ALL COURTS
// STAFF: ASSIGNED COURT ONLY
// =====================================================

const getAllOrders = async (
  req,
  res
) => {
  try {
    const currentUser =
      await getCurrentUser(req);

    if (!currentUser) {
      return res.status(401).json({
        message:
          "User account not found. Please login again.",
      });
    }

    // Admin can see all courts.
    if (currentUser.role === "admin") {
      const orders = await Order.find()
        .populate("user", "name email")
        .populate("foodCourt", "name")
        .sort({
          createdAt: -1,
        });

      return res.status(200).json(orders);
    }

    if (currentUser.role !== "staff") {
      return res.status(403).json({
        message:
          "You are not allowed to view all orders.",
      });
    }

    if (!currentUser.foodCourt) {
      return res.status(403).json({
        message:
          "Your account is not assigned to a food court.",
      });
    }

    const staffCourtId = String(
      currentUser.foodCourt
    );

    const candidateOrders = await Order.find({
      $or: [
        {
          foodCourt:
            currentUser.foodCourt,
        },
        {
          foodCourt: null,
        },
        {
          foodCourt: {
            $exists: false,
          },
        },
      ],
    })
      .populate("user", "name email")
      .populate("foodCourt", "name")
      .sort({
        createdAt: -1,
      });

    const safeOrders = [];

    for (const order of candidateOrders) {
      const access =
        await checkStaffOrderAccess(
          currentUser,
          order
        );

      if (!access.allowed) {
        continue;
      }

      // Populate after legacy court assignment.
      await order.populate(
        "foodCourt",
        "name"
      );

      if (
        order.foodCourt &&
        String(order.foodCourt._id) ===
          staffCourtId
      ) {
        safeOrders.push(order);
      }
    }

    return res.status(200).json(
      safeOrders
    );
  } catch (error) {
    console.error(
      "Get all orders error:",
      error
    );

    return res.status(500).json({
      message: "Failed to fetch orders.",
      error: error.message,
    });
  }
};

// =====================================================
// CANCEL ORDER
// STUDENT OWNER ONLY; PENDING ONLY
// =====================================================

const cancelOrder = async (
  req,
  res
) => {
  try {
    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findById(
      req.params.id
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    if (
      String(order.user) !==
      String(req.user.id)
    ) {
      return res.status(403).json({
        message:
          "You are not allowed to cancel this order.",
      });
    }

    if (order.status !== "Pending") {
      return res.status(400).json({
        message:
          `Order cannot be cancelled because its current status is ${order.status}.`,
      });
    }

    const previousStatus = order.status;

    order.status = "Cancelled";

    await order.save();

    sendStatusEmailSafely(
      order,
      previousStatus
    );

    notifyOrderStatus(
      req,
      order,
      previousStatus
    );

    return res.status(200).json({
      message: "Order cancelled successfully.",
      order: {
        _id: order._id,
        orderId: order.orderId,
        tokenNumber: order.tokenNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Cancel order error:",
      error
    );

    return res.status(500).json({
      message: "Failed to cancel order.",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE ORDER STATUS
// ADMIN: ANY ORDER
// STAFF: ASSIGNED COURT ONLY
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

    if (
      !status ||
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        message: "Invalid order status.",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(
        req.params.id
      )
    ) {
      return res.status(400).json({
        message: "Invalid order ID.",
      });
    }

    const currentUser =
      await getCurrentUser(req);

    if (!currentUser) {
      return res.status(401).json({
        message:
          "User account not found. Please login again.",
      });
    }

    if (
      !["admin", "staff"].includes(
        currentUser.role
      )
    ) {
      return res.status(403).json({
        message:
          "You are not allowed to update order status.",
      });
    }

    const order = await Order.findById(
      req.params.id
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    // Staff must pass the food court check.
    if (currentUser.role === "staff") {
      const access =
        await checkStaffOrderAccess(
          currentUser,
          order
        );

      if (!access.allowed) {
        return res.status(403).json({
          message: access.message,
        });
      }
    }

    const previousStatus = order.status;

    if (previousStatus === status) {
      return res.status(200).json({
        message:
          "Order status is already set to this value.",
        order: {
          _id: order._id,
          orderId: order.orderId,
          tokenNumber: order.tokenNumber,
          status: order.status,
          totalAmount: order.totalAmount,
          updatedAt: order.updatedAt,
        },
      });
    }

    order.status = status;

    await order.save();

    sendStatusEmailSafely(
      order,
      previousStatus
    );

    notifyOrderStatus(
      req,
      order,
      previousStatus
    );

    return res.status(200).json({
      message:
        "Order status updated successfully.",
      order: {
        _id: order._id,
        orderId: order.orderId,
        tokenNumber: order.tokenNumber,
        status: order.status,
        totalAmount: order.totalAmount,
        foodCourt: order.foodCourt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Update order status error:",
      error
    );

    return res.status(500).json({
      message:
        "Failed to update order status.",
      error: error.message,
    });
  }
};

// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  cancelOrder,
  updateOrderStatus,
};