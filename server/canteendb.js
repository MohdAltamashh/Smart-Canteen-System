const mongoose = require("mongoose");
require("dotenv").config();

const canteenDB = mongoose.createConnection(
  process.env.MONGO_URI,
  {
    dbName: "SmartCanteenDB",
  }
);

canteenDB.on("connected", () => {
  console.log("======================================");
  console.log("Smart Canteen MongoDB Connected");
  console.log("Database: SmartCanteenDB");
  console.log("======================================");
});

canteenDB.on("error", (error) => {
  console.error("Smart Canteen MongoDB Error:", error);
});

canteenDB.on("disconnected", () => {
  console.log("Smart Canteen MongoDB Disconnected");
});

module.exports = canteenDB;