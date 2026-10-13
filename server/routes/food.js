
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const FoodItem = require("../models/FoodItem");
const FoodCourt = require("../models/FoodCourt");
const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

// =====================================================
// UPLOAD FOLDER
// =====================================================

const uploadDir = path.join(__dirname, "../uploads/food");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// =====================================================
// MULTER STORAGE
// =====================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);

    const fileName =
      "food-" +
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      extension;

    cb(null, fileName);
  },
});

// =====================================================
// FILE FILTER
// =====================================================

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG and WEBP images are allowed."));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// =====================================================
// HELPER: REMOVE UPLOADED FILE
// =====================================================

const removeUploadedFile = (filename) => {
  if (!filename) return;

  const filePath = path.join(uploadDir, path.basename(filename));

  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// =====================================================
// HELPER: VALIDATE FOOD COURT
// =====================================================

const validateFoodCourt = async (foodCourtId) => {
  if (!foodCourtId) {
    return {
      valid: false,
      message: "Please select a Food Court.",
    };
  }

  if (!/^[0-9a-fA-F]{24}$/.test(String(foodCourtId))) {
    return {
      valid: false,
      message: "Invalid Food Court ID.",
    };
  }

  const foodCourt = await FoodCourt.findOne({
    _id: foodCourtId,
    isActive: true,
  });

  if (!foodCourt) {
    return {
      valid: false,
      message: "Food Court not found or inactive.",
    };
  }

  return {
    valid: true,
    foodCourt,
  };
};

// =====================================================
// HELPER: VERIFY ADMIN OR ASSIGNED STAFF
// =====================================================

const getFoodManager = async (req) => {
  if (!req.user || !req.user.role) {
    return {
      valid: false,
      status: 401,
      message: "Please login to continue.",
    };
  }

  // Admin can manage every active Food Court.
  // Admin token uses id: "admin", so do not query User
  // using that ID.
  if (req.user.role === "admin") {
    return {
      valid: true,
      isAdmin: true,
      foodCourtId: null,
    };
  }

  if (req.user.role !== "staff") {
    return {
      valid: false,
      status: 403,
      message: "Only admin or assigned staff can manage food items.",
    };
  }

  if (!/^[0-9a-fA-F]{24}$/.test(String(req.user.id || ""))) {
    return {
      valid: false,
      status: 401,
      message: "Invalid staff account. Please login again.",
    };
  }

  const staff = await User.findById(req.user.id).select(
    "role foodCourt name"
  );

  if (!staff || staff.role !== "staff") {
    return {
      valid: false,
      status: 403,
      message: "Staff account not found or access denied.",
    };
  }

  if (!staff.foodCourt) {
    return {
      valid: false,
      status: 403,
      message: "No Food Court is assigned to this staff account.",
    };
  }

  const courtValidation = await validateFoodCourt(staff.foodCourt);

  if (!courtValidation.valid) {
    return {
      valid: false,
      status: 403,
      message: "Your assigned Food Court is inactive or unavailable.",
    };
  }

  return {
    valid: true,
    isAdmin: false,
    foodCourtId: String(courtValidation.foodCourt._id),
    foodCourtName: courtValidation.foodCourt.name,
  };
};

// =====================================================
// SERVE FOOD IMAGES
// Existing route preserved
// =====================================================

router.use("/uploads/food", express.static(uploadDir));

// =====================================================
// GET FOOD ITEMS
// Public menu remains available.
// Optional: /api/food?foodCourt=FOOD_COURT_ID
// =====================================================

router.get("/", async (req, res) => {
  try {
    const { foodCourt } = req.query;
    const filter = {};

    if (foodCourt) {
      if (!/^[0-9a-fA-F]{24}$/.test(String(foodCourt))) {
        return res.status(400).json({
          message: "Invalid Food Court ID.",
        });
      }

      filter.foodCourt = foodCourt;
    }

    const foodItems = await FoodItem.find(filter)
      .populate("foodCourt", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json(foodItems);
  } catch (error) {
    console.error("Error fetching food items:", error);

    return res.status(500).json({
      message: "Failed to fetch food items.",
    });
  }
});

// =====================================================
// ADD NEW FOOD ITEM
// Admin: any active court
// Staff: assigned court only
// =====================================================

router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const manager = await getFoodManager(req);

      if (!manager.valid) {
        if (req.file) removeUploadedFile(req.file.filename);

        return res.status(manager.status).json({
          message: manager.message,
        });
      }

      const {
        name,
        description,
        price,
        category,
        imageUrl,
        isAvailable,
        foodCourt,
      } = req.body;

      if (!name || !String(name).trim()) {
        if (req.file) removeUploadedFile(req.file.filename);

        return res.status(400).json({
          message: "Food name is required.",
        });
      }

      if (
        price === undefined ||
        price === "" ||
        !Number.isFinite(Number(price)) ||
        Number(price) < 0
      ) {
        if (req.file) removeUploadedFile(req.file.filename);

        return res.status(400).json({
          message: "Please enter a valid price.",
        });
      }

      // Never trust the Food Court ID sent by staff.
      const selectedFoodCourt = manager.isAdmin
        ? foodCourt
        : manager.foodCourtId;

      const validation = await validateFoodCourt(selectedFoodCourt);

      if (!validation.valid) {
        if (req.file) removeUploadedFile(req.file.filename);

        return res.status(400).json({
          message: validation.message,
        });
      }

      let finalImageUrl = imageUrl || "";

      if (req.file) {
        finalImageUrl = `/uploads/food/${req.file.filename}`;
      }

      const newFoodItem = new FoodItem({
        name: String(name).trim(),
        description: description || "",
        price: Number(price),
        category,
        foodCourt: validation.foodCourt._id,
        imageUrl: finalImageUrl,
        isAvailable:
          isAvailable === undefined
            ? true
            : isAvailable === "true" || isAvailable === true,
      });

      const savedFoodItem = await newFoodItem.save();

      const responseItem = await FoodItem.findById(savedFoodItem._id)
        .populate("foodCourt", "name");

      return res.status(201).json({
        message: "Food item added successfully.",
        foodItem: responseItem,
      });
    } catch (error) {
      console.error("Error adding food item:", error);

      if (req.file) removeUploadedFile(req.file.filename);

      return res.status(500).json({
        message: error.message || "Failed to add food item.",
      });
    }
  }
);

// =====================================================
// UPDATE FOOD ITEM
// Admin: any item
// Staff: items belonging to assigned court only
// =====================================================

router.put(
  "/:id",
  authMiddleware,
  upload.single("image"),
  async (req, res) => {
    try {
      const manager = await getFoodManager(req);

      if (!manager.valid) {
        if (req.file) removeUploadedFile(req.file.filename);

        return res.status(manager.status).json({
          message: manager.message,
        });
      }

      if (!/^[0-9a-fA-F]{24}$/.test(String(req.params.id))) {
        if (req.file) removeUploadedFile(req.file.filename);

        return res.status(400).json({
          message: "Invalid food item ID.",
        });
      }

      const existingFoodItem = await FoodItem.findById(req.params.id);

      if (!existingFoodItem) {
        if (req.file) removeUploadedFile(req.file.filename);

        return res.status(404).json({
          message: "Food item not found.",
        });
      }

      // Staff cannot edit food from another court.
      if (
        !manager.isAdmin &&
        String(existingFoodItem.foodCourt || "") !== manager.foodCourtId
      ) {
        if (req.file) removeUploadedFile(req.file.filename);

        return res.status(403).json({
          message: "You can only edit food items from your assigned Food Court.",
        });
      }

      const {
        name,
        description,
        price,
        category,
        imageUrl,
        isAvailable,
        foodCourt,
      } = req.body;

      const updateData = {};

      if (name !== undefined) {
        if (!String(name).trim()) {
          if (req.file) removeUploadedFile(req.file.filename);

          return res.status(400).json({
            message: "Food name cannot be empty.",
          });
        }

        updateData.name = String(name).trim();
      }

      if (description !== undefined) {
        updateData.description = description;
      }

      if (category !== undefined) {
        updateData.category = category;
      }

      if (price !== undefined && price !== "") {
        if (!Number.isFinite(Number(price)) || Number(price) < 0) {
          if (req.file) removeUploadedFile(req.file.filename);

          return res.status(400).json({
            message: "Please enter a valid price.",
          });
        }

        updateData.price = Number(price);
      }

      if (isAvailable !== undefined) {
        updateData.isAvailable =
          isAvailable === "true" || isAvailable === true;
      }

      // Only admin can move an item between Food Courts.
      if (foodCourt !== undefined) {
        if (!manager.isAdmin) {
          if (String(foodCourt) !== manager.foodCourtId) {
            if (req.file) removeUploadedFile(req.file.filename);

            return res.status(403).json({
              message: "Staff cannot move food items to another Food Court.",
            });
          }
        } else {
          const validation = await validateFoodCourt(foodCourt);

          if (!validation.valid) {
            if (req.file) removeUploadedFile(req.file.filename);

            return res.status(400).json({
              message: validation.message,
            });
          }

          updateData.foodCourt = validation.foodCourt._id;
        }
      }

      if (req.file) {
        updateData.imageUrl = `/uploads/food/${req.file.filename}`;
      } else if (imageUrl !== undefined) {
        updateData.imageUrl = imageUrl || "";
      }

      const updatedFoodItem = await FoodItem.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      ).populate("foodCourt", "name");

      // Delete the old uploaded image only after successful update.
      if (
        req.file &&
        existingFoodItem.imageUrl &&
        existingFoodItem.imageUrl.startsWith("/uploads/food/")
      ) {
        removeUploadedFile(path.basename(existingFoodItem.imageUrl));
      }

      return res.status(200).json({
        message: "Food item updated successfully.",
        foodItem: updatedFoodItem,
      });
    } catch (error) {
      console.error("Error updating food item:", error);

      if (req.file) removeUploadedFile(req.file.filename);

      return res.status(500).json({
        message: error.message || "Failed to update food item.",
      });
    }
  }
);

// =====================================================
// DELETE FOOD ITEM
// Admin: any item
// Staff: assigned court only
// =====================================================

router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const manager = await getFoodManager(req);

    if (!manager.valid) {
      return res.status(manager.status).json({
        message: manager.message,
      });
    }

    if (!/^[0-9a-fA-F]{24}$/.test(String(req.params.id))) {
      return res.status(400).json({
        message: "Invalid food item ID.",
      });
    }

    const existingFoodItem = await FoodItem.findById(req.params.id);

    if (!existingFoodItem) {
      return res.status(404).json({
        message: "Food item not found.",
      });
    }

    if (
      !manager.isAdmin &&
      String(existingFoodItem.foodCourt || "") !== manager.foodCourtId
    ) {
      return res.status(403).json({
        message: "You can only delete food items from your assigned Food Court.",
      });
    }

    const deletedFoodItem = await FoodItem.findByIdAndDelete(req.params.id);

    if (
      deletedFoodItem.imageUrl &&
      deletedFoodItem.imageUrl.startsWith("/uploads/food/")
    ) {
      removeUploadedFile(path.basename(deletedFoodItem.imageUrl));
    }

    return res.status(200).json({
      message: "Food item deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting food item:", error);

    return res.status(500).json({
      message: "Failed to delete food item.",
    });
  }
});

// =====================================================
// MULTER ERROR HANDLER
// =====================================================

router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        message: "Image size must be less than 5 MB.",
      });
    }

    return res.status(400).json({
      message: error.message,
    });
  }

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  next();
});

module.exports = router;
