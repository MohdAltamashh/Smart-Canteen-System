import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Link } from "react-router-dom";

// =====================================================
// API CONFIGURATION
// =====================================================

const API =
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000/api";

const SOCKET_URL = API.replace(/\/api\/?$/, "");

// =====================================================
// MY ORDERS
// =====================================================

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);

  // =====================================================
  // REAL-TIME NOTIFICATION
  // =====================================================

  const [notification, setNotification] = useState(null);

  // =====================================================
  // LIVE QUEUE
  // =====================================================

  const [queueData, setQueueData] = useState(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState("");

  // =====================================================
  // GET USER ID FROM JWT
  // =====================================================

  const getUserIdFromToken = (token) => {
    try {
      if (!token) return null;

      const parts = token.split(".");

      if (parts.length !== 3) {
        return null;
      }

      const payload = JSON.parse(
        atob(
          parts[1]
            .replace(/-/g, "+")
            .replace(/_/g, "/")
        )
      );

      return payload.id || null;
    } catch (error) {
      console.error("JWT decode error:", error);
      return null;
    }
  };

  // =====================================================
  // SAFE JSON RESPONSE
  // =====================================================

  const getResponseData = async (response) => {
    const text = await response.text();

    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch (error) {
      console.error(
        "Invalid JSON response:",
        text
      );

      throw new Error(
        `Server returned an invalid response (${response.status}).`
      );
    }
  };

  // =====================================================
  // FETCH LIVE TOKEN QUEUE
  // =====================================================

  const fetchQueue = async () => {
    try {
      setQueueLoading(true);
      setQueueError("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        setQueueData(null);
        return;
      }

      const response = await fetch(
        `${API}/orders/queue`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      const data =
        await getResponseData(response);

      console.log(
        "Live Queue API Response:",
        data
      );

      if (!response.ok) {
        setQueueError(
          data?.message ||
            "Failed to load queue."
        );

        setQueueData(null);
        return;
      }

      setQueueData(data);
    } catch (error) {
      console.error(
        "Fetch queue error:",
        error
      );

      setQueueError(
        error.message ||
          "Unable to load live queue."
      );

      setQueueData(null);
    } finally {
      setQueueLoading(false);
    }
  };

  // =====================================================
  // FETCH MY ORDERS
  // =====================================================

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        setError("Please login first.");
        setOrders([]);
        return;
      }

      const loggedInUserId =
        getUserIdFromToken(token);

      console.log(
        "Logged-in User ID:",
        loggedInUserId
      );

      if (!loggedInUserId) {
        setError(
          "Invalid login session. Please logout and login again."
        );

        setOrders([]);
        return;
      }

      const response = await fetch(
        `${API}/orders/my-orders`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      const data =
        await getResponseData(response);

      console.log(
        "My Orders API Response:",
        data
      );

      if (!response.ok) {
        setError(
          data?.message ||
            "Failed to fetch orders."
        );

        setOrders([]);
        return;
      }

      if (!Array.isArray(data)) {
        setError(
          "Invalid orders data received from server."
        );

        setOrders([]);
        return;
      }

      // =================================================
      // EXTRA FRONTEND SECURITY FILTER
      // =================================================

      const myOrders = data.filter(
        (order) => {
          if (!order.user) {
            return false;
          }

          const orderUserId =
            typeof order.user ===
            "object"
              ? order.user._id
              : order.user;

          return (
            String(orderUserId) ===
            String(loggedInUserId)
          );
        }
      );

      console.log(
        "Filtered My Orders:",
        myOrders
      );

      setOrders(myOrders);
    } catch (err) {
      console.error(
        "Fetch orders error:",
        err
      );

      setError(
        err.message ||
          "Something went wrong while loading your orders."
      );

      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CANCEL ORDER
  // =====================================================

  const cancelOrder = async (orderId) => {
    const confirmCancel =
      window.confirm(
        "Are you sure you want to cancel this order?"
      );

    if (!confirmCancel) {
      return;
    }

    try {
      setError("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        setError("Please login first.");
        return;
      }

      const response = await fetch(
        `${API}/orders/${orderId}/cancel`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

      const data =
        await getResponseData(response);

      console.log(
        "Cancel Order Response:",
        data
      );

      if (!response.ok) {
        setError(
          data?.message ||
            "Failed to cancel order."
        );

        return;
      }

      setOrders(
        (currentOrders) =>
          currentOrders.map(
            (order) =>
              order._id === orderId
                ? {
                    ...order,
                    status:
                      "Cancelled",
                    updatedAt:
                      data.order
                        ?.updatedAt ||
                      order.updatedAt,
                  }
                : order
          )
      );

      fetchQueue();

      setNotification({
        orderId:
          data.order?.orderId || "",
        tokenNumber:
          data.order?.tokenNumber ||
          "",
        status: "Cancelled",
        message:
          `Your order ${
            data.order?.orderId || ""
          } has been cancelled.`,
      });

      setTimeout(() => {
        setNotification(null);
      }, 6000);
    } catch (error) {
      console.error(
        "Cancel order error:",
        error
      );

      setError(
        error.message ||
          "Something went wrong while cancelling the order."
      );
    }
  };

  // =====================================================
  // LOAD ORDERS
  // =====================================================

  useEffect(() => {
    fetchOrders();
    fetchQueue();
  }, []);

  // =====================================================
  // REAL-TIME SOCKET.IO
  // =====================================================

  useEffect(() => {
    const token =
      localStorage.getItem("token");

    if (!token) {
      return;
    }

    const userId =
      getUserIdFromToken(token);

    if (!userId) {
      console.error(
        "Unable to get user ID for Socket.io"
      );

      return;
    }

    const socket = io(SOCKET_URL);

    console.log(
      "Connecting to Socket.io..."
    );

    socket.on("connect", () => {
      console.log(
        "Socket connected:",
        socket.id
      );

      socket.emit(
        "joinUserRoom",
        userId
      );

      console.log(
        "Joined user room:",
        `user_${userId}`
      );
    });

    socket.on(
      "orderStatusUpdated",
      (data) => {
        console.log(
          "Real-time order update received:",
          data
        );

        setOrders(
          (currentOrders) =>
            currentOrders.map(
              (order) => {
                if (
                  order.orderId ===
                  data.orderId
                ) {
                  return {
                    ...order,
                    status:
                      data.status,
                    updatedAt:
                      data.updatedAt,
                  };
                }

                return order;
              }
            )
        );

        setNotification({
          orderId: data.orderId,
          tokenNumber:
            data.tokenNumber,
          status: data.status,
          message: data.message,
        });

        fetchQueue();

        setTimeout(() => {
          setNotification(null);
        }, 6000);
      }
    );

    socket.on(
      "connect_error",
      (error) => {
        console.error(
          "Socket connection error:",
          error
        );
      }
    );

    socket.on(
      "disconnect",
      () => {
        console.log(
          "Socket disconnected"
        );
      }
    );

    return () => {
      console.log(
        "Disconnecting Socket.io..."
      );

      socket.disconnect();
    };
  }, []);

  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending":
        return "bg-warning text-dark";

      case "Preparing":
        return "bg-info text-dark";

      case "Ready":
        return "bg-success";

      case "Completed":
        return "bg-primary";

      case "Cancelled":
        return "bg-danger";

      default:
        return "bg-secondary";
    }
  };

  // =====================================================
  // STATUS ICON
  // =====================================================

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return "⏳";

      case "Preparing":
        return "👨‍🍳";

      case "Ready":
        return "🔔";

      case "Completed":
        return "✅";

      case "Cancelled":
        return "❌";

      default:
        return "📦";
    }
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    return new Date(
      date
    ).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  // =====================================================
  // STATUS STEP
  // =====================================================

  const getStatusStep = (status) => {
    switch (status) {
      case "Pending":
        return 1;

      case "Preparing":
        return 2;

      case "Ready":
        return 3;

      case "Completed":
        return 4;

      case "Cancelled":
        return -1;

      default:
        return 0;
    }
  };

  // =====================================================
  // GET TOTAL ITEMS
  // =====================================================

  const getTotalItems = () => {
    return orders.reduce(
      (total, order) =>
        total +
        (order.items?.reduce(
          (sum, item) =>
            sum +
            (item.quantity || 0),
          0
        ) || 0),
      0
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f5f7fb 0%, #eef3f9 100%)",
        paddingBottom: "60px",
      }}
    >

      {/* ================================================= */}
      {/* HERO HEADER */}
      {/* ================================================= */}

      <section
        style={{
          background:
            "linear-gradient(135deg, #061f49 0%, #073b7a 45%, #0d6efd 100%)",
          color: "white",
          padding:
            "45px 20px 55px",
          position: "relative",
          overflow: "hidden",
        }}
      >

        <div
          style={{
            position: "absolute",
            width: "250px",
            height: "250px",
            borderRadius: "50%",
            background:
              "rgba(255,255,255,0.06)",
            top: "-100px",
            right: "-50px",
          }}
        />

        <div className="container position-relative">

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-4">

            <div>

              <div
                className="badge rounded-pill mb-3"
                style={{
                  background:
                    "rgba(255,255,255,0.14)",
                  color: "white",
                  padding:
                    "8px 14px",
                  fontSize:
                    "13px",
                }}
              >
                🎟️ SMART CANTEEN
              </div>

              <h1
                className="fw-bold mb-2"
                style={{
                  fontSize:
                    "clamp(28px, 5vw, 42px)",
                }}
              >
                My Orders
              </h1>

              <p
                className="mb-0"
                style={{
                  color:
                    "rgba(255,255,255,0.78)",
                  fontSize: "16px",
                }}
              >
                Track your orders, tokens
                and live queue in real time.
              </p>

            </div>

            <button
              type="button"
              className="btn btn-light fw-bold px-4 py-2"
              style={{
                borderRadius: "10px",
              }}
              onClick={() => {
                fetchOrders();
                fetchQueue();
              }}
              disabled={
                loading ||
                queueLoading
              }
            >
              {loading ||
              queueLoading
                ? "⏳ Loading..."
                : "🔄 Refresh"}
            </button>

          </div>

        </div>
      </section>

      {/* ================================================= */}
      {/* QUICK STATS */}
      {/* ================================================= */}

      {!loading &&
        !error &&
        orders.length > 0 && (
          <div
            className="container"
            style={{
              marginTop: "-30px",
              position: "relative",
              zIndex: 2,
            }}
          >

            <div className="row g-3">

              <div className="col-6 col-md-4">

                <div
                  className="card border-0 shadow-sm h-100"
                  style={{
                    borderRadius: "16px",
                  }}
                >

                  <div className="card-body p-3 p-md-4">

                    <div className="d-flex justify-content-between align-items-center">

                      <div>

                        <small className="text-muted">
                          TOTAL ORDERS
                        </small>

                        <h3 className="fw-bold mb-0 mt-1">
                          {orders.length}
                        </h3>

                      </div>

                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius:
                            "14px",
                          background:
                            "#eef4ff",
                          display: "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          fontSize: "23px",
                        }}
                      >
                        📦
                      </div>

                    </div>

                  </div>

                </div>

              </div>

              <div className="col-6 col-md-4">

                <div
                  className="card border-0 shadow-sm h-100"
                  style={{
                    borderRadius: "16px",
                  }}
                >

                  <div className="card-body p-3 p-md-4">

                    <div className="d-flex justify-content-between align-items-center">

                      <div>

                        <small className="text-muted">
                          TOTAL ITEMS
                        </small>

                        <h3 className="fw-bold mb-0 mt-1">
                          {getTotalItems()}
                        </h3>

                      </div>

                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius:
                            "14px",
                          background:
                            "#eefbf3",
                          display: "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          fontSize: "23px",
                        }}
                      >
                        🍔
                      </div>

                    </div>

                  </div>

                </div>

              </div>

              <div className="col-12 col-md-4">

                <div
                  className="card border-0 shadow-sm h-100"
                  style={{
                    borderRadius: "16px",
                  }}
                >

                  <div className="card-body p-3 p-md-4">

                    <div className="d-flex justify-content-between align-items-center">

                      <div>

                        <small className="text-muted">
                          ACTIVE ORDER
                        </small>

                        <h3 className="fw-bold mb-0 mt-1">
                          {queueData?.hasActiveOrder
                            ? "Yes"
                            : "None"}
                        </h3>

                      </div>

                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius:
                            "14px",
                          background:
                            queueData?.hasActiveOrder
                              ? "#fff6e5"
                              : "#f1f3f5",
                          display: "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          fontSize: "23px",
                        }}
                      >
                        🎟️
                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

      {/* ================================================= */}
      {/* REAL-TIME NOTIFICATION */}
      {/* ================================================= */}

      {notification && (
        <div
          className="container"
          style={{
            position: "relative",
            zIndex: 10,
            marginTop: "20px",
          }}
        >

          <div
            className="shadow-sm"
            style={{
              background:
                "linear-gradient(135deg, #ecfdf3, #f4fff8)",
              border:
                "1px solid #b7ebca",
              borderRadius: "15px",
              padding: "17px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: "15px",
            }}
          >

            <div className="d-flex align-items-center gap-3">

              <div
                style={{
                  width: "45px",
                  height: "45px",
                  borderRadius: "12px",
                  background:
                    "#198754",
                  color: "white",
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  fontSize: "20px",
                  flexShrink: 0,
                }}
              >
                🔔
              </div>

              <div>

                <div
                  className="fw-bold"
                  style={{
                    color: "#146c43",
                  }}
                >
                  Order Update
                </div>

                <div
                  className="small mt-1"
                  style={{
                    color: "#3d5a4a",
                  }}
                >
                  {notification.message}
                </div>

                {notification.tokenNumber && (
                  <small className="text-muted">
                    Token #
                    {
                      notification.tokenNumber
                    }
                  </small>
                )}

              </div>

            </div>

            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={() =>
                setNotification(null)
              }
            />

          </div>

        </div>
      )}

      {/* ================================================= */}
      {/* LIVE QUEUE */}
      {/* ================================================= */}

      {queueData?.hasActiveOrder && (
        <div
          className="container"
          style={{
            marginTop: "25px",
          }}
        >

          <div
            className="card border-0 shadow-sm"
            style={{
              borderRadius: "18px",
              overflow: "hidden",
            }}
          >

            {/* QUEUE HEADER */}

            <div
              style={{
                background:
                  "linear-gradient(135deg, #073b7a, #0d6efd)",
                color: "white",
                padding:
                  "22px 24px",
              }}
            >

              <div className="d-flex justify-content-between align-items-center">

                <div>

                  <div className="d-flex align-items-center gap-2">

                    <span
                      style={{
                        fontSize: "24px",
                      }}
                    >
                      🎟️
                    </span>

                    <h5 className="fw-bold mb-0">
                      Live Queue Status
                    </h5>

                  </div>

                  <small
                    style={{
                      color:
                        "rgba(255,255,255,0.72)",
                    }}
                  >
                    Real-time canteen queue
                    tracking
                  </small>

                </div>

                <span
                  className="badge rounded-pill"
                  style={{
                    background:
                      "rgba(255,255,255,0.15)",
                    color: "white",
                    padding:
                      "8px 12px",
                  }}
                >
                  ● LIVE
                </span>

              </div>

            </div>

            {/* QUEUE BODY */}

            <div className="card-body p-3 p-md-4">

              <div className="row g-3">

                {/* YOUR TOKEN */}

                <div className="col-6 col-md-3">

                  <div
                    className="text-center h-100"
                    style={{
                      background:
                        "#f1f5ff",
                      borderRadius:
                        "14px",
                      padding:
                        "18px 10px",
                    }}
                  >

                    <small
                      className="text-muted fw-semibold"
                      style={{
                        fontSize:
                          "11px",
                      }}
                    >
                      YOUR TOKEN
                    </small>

                    <div
                      className="fw-bold text-primary"
                      style={{
                        fontSize:
                          "30px",
                        marginTop: "3px",
                      }}
                    >
                      #
                      {
                        queueData.yourToken
                      }
                    </div>

                  </div>

                </div>

                {/* NOW SERVING */}

                <div className="col-6 col-md-3">

                  <div
                    className="text-center h-100"
                    style={{
                      background:
                        "#effbf4",
                      borderRadius:
                        "14px",
                      padding:
                        "18px 10px",
                    }}
                  >

                    <small
                      className="text-muted fw-semibold"
                      style={{
                        fontSize:
                          "11px",
                      }}
                    >
                      NOW SERVING
                    </small>

                    <div
                      className="fw-bold text-success"
                      style={{
                        fontSize:
                          "30px",
                        marginTop: "3px",
                      }}
                    >
                      {queueData.currentlyServing
                        ? `#${queueData.currentlyServing}`
                        : "--"}
                    </div>

                  </div>

                </div>

                {/* PEOPLE AHEAD */}

                <div className="col-6 col-md-3">

                  <div
                    className="text-center h-100"
                    style={{
                      background:
                        "#fff8e8",
                      borderRadius:
                        "14px",
                      padding:
                        "18px 10px",
                    }}
                  >

                    <small
                      className="text-muted fw-semibold"
                      style={{
                        fontSize:
                          "11px",
                      }}
                    >
                      PEOPLE AHEAD
                    </small>

                    <div
                      className="fw-bold text-warning"
                      style={{
                        fontSize:
                          "30px",
                        marginTop: "3px",
                      }}
                    >
                      {
                        queueData.peopleAhead
                      }
                    </div>

                  </div>

                </div>

                {/* WAIT TIME */}

                <div className="col-6 col-md-3">

                  <div
                    className="text-center h-100"
                    style={{
                      background:
                        "#f5efff",
                      borderRadius:
                        "14px",
                      padding:
                        "18px 10px",
                    }}
                  >

                    <small
                      className="text-muted fw-semibold"
                      style={{
                        fontSize:
                          "11px",
                      }}
                    >
                      EST. WAIT
                    </small>

                    <div
                      className="fw-bold text-info"
                      style={{
                        fontSize:
                          "30px",
                        marginTop: "3px",
                      }}
                    >
                      {
                        queueData.estimatedMinutes
                      }{" "}
                      <span
                        style={{
                          fontSize:
                            "15px",
                        }}
                      >
                        min
                      </span>
                    </div>

                  </div>

                </div>

              </div>

              {/* QUEUE POSITION */}

              <div className="mt-4">

                <div className="d-flex justify-content-between align-items-center mb-2">

                  <span className="fw-semibold">
                    📍 Your Queue Position
                  </span>

                  <span className="badge bg-light text-dark border">
                    {
                      queueData.queuePosition
                    }{" "}
                    /{" "}
                    {
                      queueData.queueLength
                    }
                  </span>

                </div>

                <div
                  className="progress"
                  style={{
                    height: "11px",
                    borderRadius: "20px",
                    background:
                      "#e9ecef",
                  }}
                >

                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{
                      width:
                        `${
                          queueData.queueLength >
                          0
                            ? Math.min(
                                100,
                                (
                                  queueData.queuePosition /
                                  queueData.queueLength
                                ) *
                                  100
                              )
                            : 0
                        }%`,
                      borderRadius:
                        "20px",
                    }}
                  />

                </div>

              </div>

              {/* STATUS MESSAGE */}

              <div className="text-center mt-4">

                <span
                  className={`badge ${getStatusClass(
                    queueData.orderStatus
                  )}`}
                  style={{
                    padding:
                      "10px 18px",
                    fontSize:
                      "13px",
                    borderRadius:
                      "30px",
                  }}
                >

                  {queueData.orderStatus ===
                    "Pending" &&
                    "⏳ Waiting in Queue"}

                  {queueData.orderStatus ===
                    "Preparing" &&
                    "👨‍🍳 Your Order is Being Prepared"}

                  {queueData.orderStatus ===
                    "Ready" &&
                    "🔔 Your Order is Ready"}

                  {queueData.orderStatus ===
                    "Completed" &&
                    "✅ Order Completed"}

                </span>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ================================================= */}
      {/* QUEUE LOADING */}
      {/* ================================================= */}

      {queueLoading && (
        <div className="container mt-3">

          <div className="text-center text-muted">

            <div
              className="spinner-border spinner-border-sm text-primary"
              role="status"
            />

            <span className="ms-2">
              Updating live queue...
            </span>

          </div>

        </div>
      )}

      {/* ================================================= */}
      {/* QUEUE ERROR */}
      {/* ================================================= */}

      {queueError && (
        <div className="container mt-3">

          <div
            className="alert alert-warning border-0 shadow-sm"
            style={{
              borderRadius: "12px",
            }}
          >
            ⚠️ {queueError}
          </div>

        </div>
      )}

      {/* ================================================= */}
      {/* MAIN CONTENT */}
      {/* ================================================= */}

      <div className="container py-4">

        {/* LOADING */}

        {loading && (
          <div className="text-center py-5">

            <div
              className="spinner-border text-primary"
              style={{
                width: "3rem",
                height: "3rem",
              }}
              role="status"
            />

            <h5 className="fw-bold mt-4">
              Loading your orders...
            </h5>

            <p className="text-muted">
              Please wait a moment.
            </p>

          </div>
        )}

        {/* ERROR */}

        {!loading && error && (
          <div
            className="alert alert-danger border-0 shadow-sm"
            style={{
              borderRadius: "14px",
            }}
          >

            <strong>
              ⚠️ Something went wrong
            </strong>

            <div className="mt-1">
              {error}
            </div>

          </div>
        )}

        {/* NO ORDERS */}

        {!loading &&
          !error &&
          orders.length === 0 && (

            <div
              className="card border-0 shadow-sm"
              style={{
                borderRadius: "20px",
              }}
            >

              <div
                className="card-body text-center"
                style={{
                  padding:
                    "65px 20px",
                }}
              >

                <div
                  style={{
                    width: "90px",
                    height: "90px",
                    margin:
                      "0 auto",
                    borderRadius:
                      "25px",
                    background:
                      "#eef4ff",
                    display: "flex",
                    alignItems:
                      "center",
                    justifyContent:
                      "center",
                    fontSize: "42px",
                  }}
                >
                  🛒
                </div>

                <h3 className="fw-bold mt-4">
                  No Orders Yet
                </h3>

                <p className="text-muted mb-4">
                  You haven't placed any
                  canteen orders yet.
                </p>

                <Link
                  to="/canteen-menu"
                  className="btn btn-primary px-4 py-2 fw-bold"
                  style={{
                    borderRadius:
                      "10px",
                  }}
                >
                  🍔 Browse Menu
                </Link>

              </div>

            </div>
          )}

        {/* ================================================= */}
        {/* ORDERS */}
        {/* ================================================= */}

        {!loading &&
          !error &&
          orders.length > 0 && (

            <div>

              <div className="d-flex justify-content-between align-items-center mb-3">

                <div>

                  <h4 className="fw-bold mb-1">
                    Order History
                  </h4>

                  <p className="text-muted mb-0">
                    Your recent canteen orders
                  </p>

                </div>

                <span
                  className="badge bg-primary rounded-pill px-3 py-2"
                >
                  {orders.length} Orders
                </span>

              </div>

              <div className="row g-4">

                {orders.map((order) => {

                  const currentStep =
                    getStatusStep(
                      order.status
                    );

                  return (

                    <div
                      className="col-12"
                      key={order._id}
                    >

                      <div
                        className="card border-0 shadow-sm"
                        style={{
                          borderRadius:
                            "18px",
                          overflow:
                            "hidden",
                        }}
                      >

                        {/* ORDER HEADER */}

                        <div
                          style={{
                            padding:
                              "20px",
                          }}
                        >

                          <div className="row align-items-center">

                            {/* TOKEN */}

                            <div className="col-12 col-md-2 mb-3 mb-md-0">

                              <div
                                className="text-center"
                                style={{
                                  background:
                                    "#f1f5ff",
                                  borderRadius:
                                    "15px",
                                  padding:
                                    "15px 10px",
                                }}
                              >

                                <small className="text-muted fw-semibold">
                                  TOKEN NUMBER
                                </small>

                                <div
                                  className="fw-bold text-primary"
                                  style={{
                                    fontSize:
                                      "36px",
                                    lineHeight:
                                      "1.1",
                                  }}
                                >
                                  #
                                  {
                                    order.tokenNumber
                                  }
                                </div>

                              </div>

                            </div>

                            {/* ORDER INFO */}

                            <div className="col-12 col-md-5 mb-3 mb-md-0">

                              <div className="d-flex align-items-center gap-2 mb-2">

                                <span
                                  style={{
                                    fontSize:
                                      "18px",
                                  }}
                                >
                                  📦
                                </span>

                                <h5 className="fw-bold mb-0">
                                  {
                                    order.orderId
                                  }
                                </h5>

                              </div>

                              <div className="d-flex flex-wrap gap-3">

                                <span className="text-muted small">
                                  🍔{" "}
                                  {
                                    order.items
                                      ?.length ||
                                    0
                                  }{" "}
                                  items
                                </span>

                                <span className="text-success fw-bold small">
                                  ₹
                                  {
                                    order.totalAmount
                                  }
                                </span>

                              </div>

                              <small className="text-muted d-block mt-2">
                                📅{" "}
                                {formatDate(
                                  order.createdAt
                                )}
                              </small>

                            </div>

                            {/* STATUS */}

                            <div className="col-6 col-md-3 text-md-center mb-3 mb-md-0">

                              <span
                                className={`badge ${getStatusClass(
                                  order.status
                                )}`}
                                style={{
                                  padding:
                                    "10px 14px",
                                  fontSize:
                                    "13px",
                                  borderRadius:
                                    "30px",
                                }}
                              >

                                {
                                  getStatusIcon(
                                    order.status
                                  )
                                }{" "}

                                {
                                  order.status
                                }

                              </span>

                            </div>

                            {/* DETAILS */}

                            <div className="col-6 col-md-2 text-end text-md-center">

                              <button
                                type="button"
                                className="btn btn-outline-primary fw-semibold"
                                style={{
                                  borderRadius:
                                    "9px",
                                }}
                                onClick={() =>
                                  setExpandedOrder(
                                    expandedOrder ===
                                      order._id
                                      ? null
                                      : order._id
                                  )
                                }
                              >

                                {expandedOrder ===
                                order._id
                                  ? "▲ Hide"
                                  : "▼ Details"}

                              </button>

                            </div>

                          </div>

                        </div>

                        {/* ================================================= */}
                        {/* EXPANDED DETAILS */}
                        {/* ================================================= */}

                        {expandedOrder ===
                          order._id && (

                          <div
                            style={{
                              background:
                                "#fafbfd",
                              borderTop:
                                "1px solid #e9ecef",
                              padding:
                                "25px 20px",
                            }}
                          >

                            {/* ORDERED ITEMS */}

                            <h6 className="fw-bold mb-3">
                              🍔 Ordered Items
                            </h6>

                            <div className="table-responsive">

                              <table
                                className="table align-middle mb-0"
                                style={{
                                  background:
                                    "white",
                                  borderRadius:
                                    "12px",
                                  overflow:
                                    "hidden",
                                }}
                              >

                                <thead className="table-light">

                                  <tr>

                                    <th>
                                      Item
                                    </th>

                                    <th>
                                      Price
                                    </th>

                                    <th>
                                      Quantity
                                    </th>

                                    <th>
                                      Subtotal
                                    </th>

                                  </tr>

                                </thead>

                                <tbody>

                                  {order.items?.map(
                                    (
                                      item,
                                      index
                                    ) => (

                                      <tr
                                        key={
                                          item._id ||
                                          index
                                        }
                                      >

                                        <td className="fw-semibold">
                                          <span className="me-2">
                                            🍽️
                                          </span>

                                          {
                                            item.name
                                          }
                                        </td>

                                        <td>
                                          ₹
                                          {
                                            item.price
                                          }
                                        </td>

                                        <td>

                                          <span className="badge bg-light text-dark border">
                                            ×
                                            {
                                              item.quantity
                                            }
                                          </span>

                                        </td>

                                        <td className="fw-bold text-success">
                                          ₹
                                          {
                                            item.subtotal
                                          }
                                        </td>

                                      </tr>

                                    )
                                  )}

                                </tbody>

                                <tfoot>

                                  <tr>

                                    <td
                                      colSpan="3"
                                      className="text-end fw-bold"
                                    >
                                      Total Amount
                                    </td>

                                    <td className="fw-bold text-success">
                                      ₹
                                      {
                                        order.totalAmount
                                      }
                                    </td>

                                  </tr>

                                </tfoot>

                              </table>

                            </div>

                            {/* ================================================= */}
                            {/* STATUS TRACKING */}
                            {/* ================================================= */}

                            <h6 className="fw-bold mt-4 mb-3">
                              📍 Order Status
                            </h6>

                            {order.status ===
                            "Cancelled" ? (

                              <div
                                className="alert alert-danger border-0 mb-0"
                                style={{
                                  borderRadius:
                                    "12px",
                                }}
                              >
                                ❌ This order
                                has been cancelled.
                              </div>

                            ) : (

                              <div
                                className="card border-0"
                                style={{
                                  background:
                                    "white",
                                  borderRadius:
                                    "15px",
                                }}
                              >

                                <div className="card-body">

                                  <div className="row text-center">

                                    {[
                                      {
                                        step: 1,
                                        icon: "⏳",
                                        label: "Pending",
                                      },
                                      {
                                        step: 2,
                                        icon: "👨‍🍳",
                                        label: "Preparing",
                                      },
                                      {
                                        step: 3,
                                        icon: "🔔",
                                        label: "Ready",
                                      },
                                      {
                                        step: 4,
                                        icon: "✅",
                                        label: "Completed",
                                      },
                                    ].map(
                                      (
                                        statusStep
                                      ) => (

                                        <div
                                          className="col-3 position-relative"
                                          key={
                                            statusStep.step
                                          }
                                        >

                                          <div
                                            style={{
                                              width:
                                                "48px",
                                              height:
                                                "48px",
                                              borderRadius:
                                                "50%",
                                              margin:
                                                "0 auto",
                                              display:
                                                "flex",
                                              alignItems:
                                                "center",
                                              justifyContent:
                                                "center",
                                              fontSize:
                                                "21px",
                                              background:
                                                currentStep >=
                                                statusStep.step
                                                  ? "#0d6efd"
                                                  : "#edf0f4",
                                              color:
                                                currentStep >=
                                                statusStep.step
                                                  ? "white"
                                                  : "#8a94a6",
                                              transition:
                                                "all 0.3s ease",
                                            }}
                                          >
                                            {
                                              statusStep.icon
                                            }
                                          </div>

                                          <small
                                            className={
                                              currentStep >=
                                              statusStep.step
                                                ? "fw-bold text-primary d-block mt-2"
                                                : "text-muted d-block mt-2"
                                            }
                                          >
                                            {
                                              statusStep.label
                                            }
                                          </small>

                                        </div>

                                      )
                                    )}

                                  </div>

                                  {/* STATUS MESSAGE */}

                                  <div className="text-center mt-4">

                                    <span
                                      className={`badge ${getStatusClass(
                                        order.status
                                      )}`}
                                      style={{
                                        padding:
                                          "9px 16px",
                                        borderRadius:
                                          "30px",
                                      }}
                                    >

                                      {
                                        getStatusIcon(
                                          order.status
                                        )
                                      }{" "}

                                      Your order is{" "}

                                      <strong>
                                        {
                                          order.status
                                        }
                                      </strong>

                                    </span>

                                  </div>

                                </div>

                              </div>

                            )}

                            {/* ================================================= */}
                            {/* CANCEL ORDER */}
                            {/* ================================================= */}

                            {order.status ===
                              "Pending" && (

                              <div
                                className="mt-4"
                                style={{
                                  background:
                                    "#fff8f8",
                                  border:
                                    "1px solid #f5c2c7",
                                  borderRadius:
                                    "14px",
                                  padding:
                                    "18px",
                                }}
                              >

                                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">

                                  <div>

                                    <h6 className="fw-bold mb-1">
                                      ⚠️ Cancel Order
                                    </h6>

                                    <small className="text-muted">
                                      You can cancel
                                      this order while
                                      it is still
                                      Pending.
                                    </small>

                                  </div>

                                  <button
                                    type="button"
                                    className="btn btn-outline-danger fw-semibold"
                                    style={{
                                      borderRadius:
                                        "9px",
                                    }}
                                    onClick={() =>
                                      cancelOrder(
                                        order._id
                                      )
                                    }
                                  >
                                    ❌ Cancel Order
                                  </button>

                                </div>

                              </div>

                            )}

                          </div>

                        )}

                      </div>

                    </div>

                  );
                })}

              </div>

            </div>

          )}

      </div>

    </div>
  );
};

export default MyOrders;