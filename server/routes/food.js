const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const router = express.Router();

const FoodItem = require("../models/FoodItem");

// =====================================================
// UPLOAD FOLDER
// =====================================================

const uploadDir = path.join(
  __dirname,
  "../uploads/food"
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

// =====================================================
// MULTER STORAGE
// =====================================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },

  filename: (req, file, cb) => {
    const extension = path.extname(
      file.originalname
    );

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
    cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      )
    );
  }
};

// =====================================================
// MULTER
// =====================================================

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// =====================================================
// GET ALL FOOD ITEMS
// =====================================================

router.get("/", async (req, res) => {
  try {
    const foodItems = await FoodItem.find().sort({
      createdAt: -1,
    });

    res.status(200).json(foodItems);
  } catch (error) {
    console.error(
      "Error fetching food items:",
      error
    );

    res.status(500).json({
      message: "Failed to fetch food items",
    });
  }
});

// =====================================================
// ADD NEW FOOD ITEM
// =====================================================

router.post(
  "/",
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        name,
        description,
        price,
        category,
        imageUrl,
        isAvailable,
      } = req.body;

      let finalImageUrl = imageUrl || "";

      // Uploaded image
      if (req.file) {
        finalImageUrl =
          `/uploads/food/${req.file.filename}`;
      }

      const newFoodItem = new FoodItem({
        name,
        description,
        price,
        category,
        imageUrl: finalImageUrl,
        isAvailable:
          isAvailable === undefined
            ? true
            : isAvailable === "true" ||
              isAvailable === true,
      });

      const savedFoodItem =
        await newFoodItem.save();

      res.status(201).json(savedFoodItem);
    } catch (error) {
      console.error(
        "Error adding food item:",
        error
      );

      // Remove uploaded file if database save fails
      if (req.file) {
        const uploadedFile = path.join(
          uploadDir,
          req.file.filename
        );

        if (fs.existsSync(uploadedFile)) {
          fs.unlinkSync(uploadedFile);
        }
      }

      res.status(500).json({
        message:
          error.message ||
          "Failed to add food item",
      });
    }
  }
);

// =====================================================
// UPDATE FOOD ITEM
// =====================================================

router.put(
  "/:id",
  upload.single("image"),
  async (req, res) => {
    try {
      const existingFoodItem =
        await FoodItem.findById(
          req.params.id
        );

      if (!existingFoodItem) {
        if (req.file) {
          const uploadedFile = path.join(
            uploadDir,
            req.file.filename
          );

          if (fs.existsSync(uploadedFile)) {
            fs.unlinkSync(uploadedFile);
          }
        }

        return res.status(404).json({
          message: "Food item not found",
        });
      }

      const {
        name,
        description,
        price,
        category,
        imageUrl,
        isAvailable,
      } = req.body;

      const updateData = {
        name,
        description,
        price,
        category,
        isAvailable:
          isAvailable === undefined
            ? existingFoodItem.isAvailable
            : isAvailable === "true" ||
              isAvailable === true,
      };

      // =================================================
      // NEW IMAGE UPLOADED
      // =================================================

      if (req.file) {
        updateData.imageUrl =
          `/uploads/food/${req.file.filename}`;

        // Delete old uploaded image
        if (
          existingFoodItem.imageUrl &&
          existingFoodItem.imageUrl.startsWith(
            "/uploads/food/"
          )
        ) {
          const oldFileName =
            path.basename(
              existingFoodItem.imageUrl
            );

          const oldFilePath = path.join(
            uploadDir,
            oldFileName
          );

          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }
      } else if (
        imageUrl !== undefined
      ) {
        // Keep existing URL if no new image
        updateData.imageUrl =
          imageUrl ||
          existingFoodItem.imageUrl ||
          "";
      }

      const updatedFoodItem =
        await FoodItem.findByIdAndUpdate(
          req.params.id,
          updateData,
          {
            new: true,
            runValidators: true,
          }
        );

      res.status(200).json(
        updatedFoodItem
      );
    } catch (error) {
      console.error(
        "Error updating food item:",
        error
      );

      // Remove newly uploaded image if update fails
      if (req.file) {
        const uploadedFile = path.join(
          uploadDir,
          req.file.filename
        );

        if (fs.existsSync(uploadedFile)) {
          fs.unlinkSync(uploadedFile);
        }
      }

      res.status(500).json({
        message:
          error.message ||
          "Failed to update food item",
      });
    }
  }
);

// =====================================================
// DELETE FOOD ITEM
// =====================================================

router.delete(
  "/:id",
  async (req, res) => {
    try {
      const deletedFoodItem =
        await FoodItem.findByIdAndDelete(
          req.params.id
        );

      if (!deletedFoodItem) {
        return res.status(404).json({
          message: "Food item not found",
        });
      }

      // Delete uploaded image
      if (
        deletedFoodItem.imageUrl &&
        deletedFoodItem.imageUrl.startsWith(
          "/uploads/food/"
        )
      ) {
        const fileName =
          path.basename(
            deletedFoodItem.imageUrl
          );

        const filePath = path.join(
          uploadDir,
          fileName
        );

        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      res.status(200).json({
        message:
          "Food item deleted successfully",
      });
    } catch (error) {
      console.error(
        "Error deleting food item:",
        error
      );

      res.status(500).json({
        message:
          "Failed to delete food item",
      });
    }
  }
);

// =====================================================
// MULTER ERROR HANDLER
// =====================================================

router.use(
  (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message:
            "Image size must be less than 5 MB.",
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
  }
);

module.exports = router;