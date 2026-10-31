const mongoose = require("mongoose");
require("dotenv").config();

mongoose.set("useCreateIndex", true);

const canteenDB = mongoose.createConnection(
  process.env.MONGO_URI,
  {
    dbName: "SmartCanteenDB",
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

canteenDB.on("connected", () => {
  console.log("Smart Canteen MongoDB Connected");
  console.log("Database: SmartCanteenDB");
});

canteenDB.on("error", (error) => {
  console.error("Smart Canteen MongoDB Error:", error);
});

canteenDB.on("disconnected", () => {
  console.log("Smart Canteen MongoDB Disconnected");
});

module.exports = canteenDB;