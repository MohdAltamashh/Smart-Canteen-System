const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();


// =====================================================
// DATABASE CONNECTIONS
// =====================================================

require("./canteendb");


// =====================================================
// ROUTES
// =====================================================

const authRoutes = require("./routes/auth");
const foodRoutes = require("./routes/food");
const orderRoutes = require("./routes/order");
const paymentRoutes = require("./routes/payment");


// =====================================================
// APP
// =====================================================

const app = express();

const PORT =
  process.env.PORT || 5000;


// =====================================================
// HTTP SERVER
// =====================================================

const server =
  http.createServer(app);


// =====================================================
// SOCKET.IO
// =====================================================

const io = new Server(
  server,
  {
    cors: {
      origin: "*",

      methods: [
        "GET",
        "POST",
        "PUT",
        "DELETE",
      ],
    },
  }
);


// =====================================================
// MAKE SOCKET.IO AVAILABLE IN CONTROLLERS
// =====================================================

app.set(
  "io",
  io
);


// =====================================================
// SOCKET CONNECTION
// =====================================================

io.on(
  "connection",
  (socket) => {

    console.log(
      "======================================"
    );

    console.log(
      "Socket connected:",
      socket.id
    );

    console.log(
      "======================================"
    );


    // -------------------------------------------------
    // JOIN USER ROOM
    // -------------------------------------------------

    socket.on(
      "joinUserRoom",
      (userId) => {

        if (!userId) {

          console.log(
            "No userId provided for socket room"
          );

          return;
        }


        const roomName =
          `user_${userId}`;


        socket.join(
          roomName
        );


        console.log(
          `Socket ${socket.id} joined room: ${roomName}`
        );
      }
    );


    // -------------------------------------------------
    // DISCONNECT
    // -------------------------------------------------

    socket.on(
      "disconnect",
      () => {

        console.log(
          "Socket disconnected:",
          socket.id
        );

      }
    );

  }
);


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors()
);

app.use(
  express.json()
);


// =====================================================
// UPLOADS
// =====================================================

app.use(
  "/uploads",
  express.static("uploads")
);


// =====================================================
// REQUEST LOGGER
// =====================================================

app.use(
  (req, res, next) => {

    console.log(
      `${req.method} ${req.path}`
    );

    next();

  }
);


// =====================================================
// OLD COMPLAINT SYSTEM DATABASE
// =====================================================

mongoose
  .connect(
    process.env.MONGO_URI,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(
    () => {

      console.log(
        "======================================"
      );

      console.log(
        "Old Complaint System MongoDB Connected"
      );

      console.log(
        "======================================"
      );

    }
  )
  .catch(
    (error) => {

      console.error(
        "Old MongoDB connection error:",
        error
      );

    }
  );


// =====================================================
// API ROUTES
// =====================================================

app.use(
  "/api/auth",
  authRoutes
);





app.use(
  "/api/food",
  foodRoutes
);


app.use(
  "/api/orders",
  orderRoutes
);


// =====================================================
// RAZORPAY PAYMENT ROUTES
// =====================================================

app.use(
  "/api/payment",
  paymentRoutes
);


// =====================================================
// BASIC SERVER TEST
// =====================================================

app.get(
  "/api/test",
  (req, res) => {

    res.json({

      message:
        "Server is working!",

      timestamp:
        new Date().toISOString(),

    });

  }
);


// =====================================================
// TEST COMPLAINT STATS
// =====================================================

app.get(
  "/api/test-complaint-stats",
  async (req, res) => {

    try {

      const Complaint =
        require(
          "./models/Complaint"
        );


      const totalComplaints =
        await Complaint.countDocuments();


      const resolvedComplaints =
        await Complaint.countDocuments({
          status:
            "resolved",
        });


      res.json({

        total:
          totalComplaints,

        resolved:
          resolvedComplaints,

      });

    } catch (error) {

      console.error(
        "Complaint stats error:",
        error
      );


      res.status(500).json({

        error:
          error.message,

      });

    }

  }
);


// =====================================================
// TEST USER STATS
// =====================================================

app.get(
  "/api/test-user-stats",
  async (req, res) => {

    try {

      const User =
        require(
          "./models/User"
        );


      const totalUsers =
        await User.countDocuments();


      res.json({

        totalUsers:

          totalUsers,

      });

    } catch (error) {

      console.error(
        "User stats error:",
        error
      );


      res.status(500).json({

        error:
          error.message,

      });

    }

  }
);


// =====================================================
// DEBUG ROUTES
// =====================================================

app.get(
  "/api/debug/routes",
  (req, res) => {

    const routes = [];


    if (app._router) {

      app._router.stack.forEach(
        (middleware) => {

          if (
            middleware.route
          ) {

            routes.push({

              path:
                middleware.route.path,

              methods:
                Object.keys(
                  middleware.route.methods
                ),

            });

          }


          if (
            middleware.name ===
            "router"
          ) {

            middleware.handle.stack.forEach(
              (handler) => {

                if (
                  handler.route
                ) {

                  routes.push({

                    path:
                      handler.route.path,

                    methods:
                      Object.keys(
                        handler.route.methods
                      ),

                  });

                }

              }
            );

          }

        }
      );

    }


    res.json({
      routes,
    });

  }
);


// =====================================================
// START SERVER
// =====================================================

server.listen(
  PORT,
  () => {

    console.log(
      "======================================"
    );

    console.log(
      `Server is running on port ${PORT}`
    );

    console.log(
      "Socket.io is running"
    );

    console.log(
      "======================================"
    );

    console.log(
      "Old DB: Complaint System"
    );

    console.log(
      "Canteen DB: SmartCanteenDB"
    );

    console.log(
      "Payment: Razorpay"
    );

    console.log(
      "======================================"
    );

  }
);