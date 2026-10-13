
import React, { useCallback, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Link } from "react-router-dom";

const API =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const SOCKET_URL = API.replace(/\/api\/?$/, "");

const STATUS_STEPS = [
  { label: "Pending", icon: "◷" },
  { label: "Preparing", icon: "♨" },
  { label: "Ready", icon: "♧" },
  { label: "Completed", icon: "✓" },
];

const STATUS_META = {
  Pending: { className: "pending", icon: "◷", message: "Waiting for the kitchen to accept your order." },
  Preparing: { className: "preparing", icon: "♨", message: "The kitchen is preparing your food." },
  Ready: { className: "ready", icon: "♧", message: "Your order is ready for pickup!" },
  Completed: { className: "completed", icon: "✓", message: "Your order has been completed." },
  Cancelled: { className: "cancelled", icon: "×", message: "This order has been cancelled." },
};

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Date unavailable";

  return parsed.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatMoney = (amount) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const getUserIdFromToken = (token) => {
  try {
    if (!token) return null;

    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;

    const base64 = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const payload = JSON.parse(
      decodeURIComponent(
        atob(base64)
          .split("")
          .map((char) =>
            `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`
          )
          .join("")
      )
    );

    return payload.id || null;
  } catch (error) {
    console.error("Token decode error:", error);
    return null;
  }
};

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [filter, setFilter] = useState("All");
  const [notification, setNotification] = useState(null);
  const [queueData, setQueueData] = useState(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const getResponseData = async (response) => {
    const text = await response.text();

    if (!text) return {};

    try {
      return JSON.parse(text);
    } catch {
      throw new Error(
        `Server returned an invalid response (${response.status}).`
      );
    }
  };

  const fetchQueue = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setQueueData(null);
      setQueueError("");
      return;
    }

    try {
      setQueueLoading(true);
      setQueueError("");

      const response = await fetch(`${API}/orders/queue`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await getResponseData(response);

      if (!response.ok) {
        throw new Error(data.message || "Unable to load live queue.");
      }

      setQueueData(data);
    } catch (err) {
      console.error("Queue fetch error:", err);
      setQueueError(err.message || "Unable to load live queue.");
    } finally {
      setQueueLoading(false);
    }
  }, []);

  const fetchOrders = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setOrders([]);
        setError("Please login first to view your orders.");
        return;
      }

      const userId = getUserIdFromToken(token);

      if (!userId) {
        setOrders([]);
        setError("Your login session is invalid. Please login again.");
        return;
      }

      const response = await fetch(`${API}/orders/my-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await getResponseData(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch your orders.");
      }

      if (!Array.isArray(data)) {
        throw new Error("Invalid orders data received from server.");
      }

      // Extra display-level filter; backend must also authorize user orders.
      const myOrders = data.filter((order) => {
        if (!order.user) return false;

        const orderUserId =
          typeof order.user === "object"
            ? order.user._id
            : order.user;

        return String(orderUserId) === String(userId);
      });

      myOrders.sort(
        (a, b) =>
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

      setOrders(myOrders);
    } catch (err) {
      console.error("Orders fetch error:", err);
      setError(err.message || "Something went wrong while loading orders.");
      setOrders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchQueue();
  }, [fetchOrders, fetchQueue]);

  // Real-time order updates
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = getUserIdFromToken(token);

    if (!token || !userId) return undefined;

    const socket = io(SOCKET_URL);

    socket.on("connect", () => {
      socket.emit("joinUserRoom", userId);
    });

    socket.on("orderStatusUpdated", (data) => {
      setOrders((current) =>
        current.map((order) =>
          order.orderId === data.orderId
            ? {
                ...order,
                status: data.status,
                updatedAt: data.updatedAt || order.updatedAt,
              }
            : order
        )
      );

      setNotification({
        orderId: data.orderId,
        tokenNumber: data.tokenNumber,
        status: data.status,
        message:
          data.message ||
          `Order ${data.orderId} status updated to ${data.status}.`,
      });

      fetchQueue();
      fetchOrders(true);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [fetchOrders, fetchQueue]);

  // Automatically dismiss notifications without timers in the UI.
  useEffect(() => {
    if (!notification) return undefined;

    const timer = setTimeout(() => setNotification(null), 6000);
    return () => clearTimeout(timer);
  }, [notification]);

  const cancelOrder = async (order) => {
    if (order.status !== "Pending") return;

    const confirmed = window.confirm(
      `Cancel order ${order.orderId || ""}?`
    );

    if (!confirmed) return;

    try {
      setCancellingId(order._id);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Please login first.");
      }

      const response = await fetch(
        `${API}/orders/${order._id}/cancel`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await getResponseData(response);

      if (!response.ok) {
        throw new Error(data.message || "Failed to cancel order.");
      }

      setOrders((current) =>
        current.map((item) =>
          item._id === order._id
            ? {
                ...item,
                status: data.order?.status || "Cancelled",
                updatedAt: data.order?.updatedAt || item.updatedAt,
              }
            : item
        )
      );

      setNotification({
        orderId: data.order?.orderId || order.orderId,
        tokenNumber: data.order?.tokenNumber || order.tokenNumber,
        status: "Cancelled",
        message: `Order ${order.orderId || ""} has been cancelled.`,
      });

      fetchQueue();
    } catch (err) {
      console.error("Cancel order error:", err);
      setError(err.message || "Unable to cancel this order.");
    } finally {
      setCancellingId(null);
    }
  };

  const getTotalItems = (order) =>
    order.items?.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0
    ) || 0;

  const totalItems = orders.reduce(
    (sum, order) => sum + getTotalItems(order),
    0
  );

  const activeOrders = orders.filter(
    (order) =>
      !["Completed", "Cancelled"].includes(order.status)
  );

  const totalSpent = orders
    .filter((order) => order.status !== "Cancelled")
    .reduce(
      (sum, order) => sum + Number(order.totalAmount || 0),
      0
    );

  const filters = ["All", "Active", "Completed", "Cancelled"];

  const filteredOrders = orders.filter((order) => {
    if (filter === "Active") {
      return !["Completed", "Cancelled"].includes(order.status);
    }

    if (filter === "Completed" || filter === "Cancelled") {
      return order.status === filter;
    }

    return true;
  });

  const statusMeta = (status) =>
    STATUS_META[status] || {
      className: "unknown",
      icon: "•",
      message: "Check your order for the latest status.",
    };

  const getStatusStep = (status) => {
    if (status === "Cancelled") return -1;
    return STATUS_STEPS.findIndex((step) => step.label === status) + 1;
  };

  return (
    <div className="cb-orders">
      <style>{`
        .cb-orders {
          --cb-ink: #18263d;
          --cb-muted: #8792a5;
          --cb-orange: #ffad72;
          min-height: 100vh;
          background: #f4f6fa;
          color: var(--cb-ink);
          padding-bottom: 60px;
          font-family: Inter, "Segoe UI", Arial, sans-serif;
        }
        .cb-orders * { box-sizing: border-box; }
        .cb-orders a { text-decoration: none; }
        .cb-orders-container {
          max-width: 1180px;
          padding: 0 22px;
          margin: 0 auto;
        }
        .cb-orders-hero {
          position: relative;
          overflow: hidden;
          color: #fff;
          background:
            radial-gradient(circle at 85% 15%, rgba(255,173,114,.16), transparent 30%),
            linear-gradient(125deg, #0b1220, #1b2b48);
        }
        .cb-orders-hero:after {
          content: "";
          position: absolute;
          width: 300px;
          height: 300px;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 50%;
          right: -100px;
          bottom: -210px;
          box-shadow: 0 0 0 35px rgba(255,255,255,.025),
                      0 0 0 75px rgba(255,255,255,.02);
        }
        .cb-orders-hero-inner {
          padding-top: 47px;
          padding-bottom: 72px;
          position: relative;
          z-index: 1;
        }
        .cb-orders-eyebrow {
          display: inline-flex;
          border: 1px solid rgba(255,173,114,.3);
          background: rgba(255,173,114,.09);
          color: #ffc69f;
          border-radius: 99px;
          padding: 8px 13px;
          font-size: 10px;
          letter-spacing: 1.5px;
          font-weight: 900;
        }
        .cb-orders-hero h1 {
          margin: 18px 0 10px;
          font-size: clamp(34px, 5vw, 51px);
          line-height: 1.1;
          letter-spacing: -1.8px;
          font-weight: 900;
        }
        .cb-orders-hero p {
          max-width: 570px;
          color: #b3bfd0;
          font-size: 14px;
          line-height: 1.8;
          margin: 0;
        }
        .cb-orders-refresh {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 12px 17px;
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 12px;
          background: rgba(255,255,255,.09);
          color: white;
          font-size: 12px;
          font-weight: 800;
          cursor: pointer;
        }
        .cb-orders-refresh:disabled { opacity: .6; cursor: wait; }
        .cb-orders-main { position: relative; margin-top: -28px; }
        .cb-orders-stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0,1fr));
          gap: 15px;
          margin-bottom: 25px;
        }
        .cb-orders-stat {
          background: #fff;
          border: 1px solid #e9edf4;
          box-shadow: 0 12px 35px rgba(20,35,58,.05);
          border-radius: 17px;
          padding: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-width: 0;
        }
        .cb-orders-stat small {
          display: block;
          color: var(--cb-muted);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .8px;
        }
        .cb-orders-stat strong {
          display: block;
          margin-top: 8px;
          font-size: 26px;
          font-weight: 900;
          line-height: 1.1;
          overflow-wrap: anywhere;
        }
        .cb-orders-stat-icon {
          display: flex;
          flex: 0 0 47px;
          width: 47px;
          height: 47px;
          border-radius: 14px;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          background: #fff1e6;
        }
        .cb-orders-panel {
          background: #fff;
          border: 1px solid #e8edf4;
          border-radius: 19px;
          overflow: hidden;
          box-shadow: 0 12px 35px rgba(20,35,58,.04);
        }
        .cb-orders-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 22px 24px;
          border-bottom: 1px solid #edf0f5;
        }
        .cb-orders-panel-head h2 {
          margin: 0 0 5px;
          font-size: 18px;
          font-weight: 900;
        }
        .cb-orders-muted { color: var(--cb-muted); font-size: 12px; }
        .cb-orders-queue { margin-bottom: 25px; }
        .cb-orders-queue-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          background: #121f35;
          color: white;
          padding: 22px 24px;
        }
        .cb-orders-queue-head h2 {
          margin: 0 0 5px;
          font-size: 17px;
          font-weight: 900;
        }
        .cb-orders-live {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border: 1px solid rgba(111,225,167,.3);
          background: rgba(111,225,167,.09);
          color: #9de6bb;
          border-radius: 99px;
          padding: 7px 10px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .8px;
        }
        .cb-orders-live-dot {
          width: 7px;
          height: 7px;
          background: #64d89b;
          border-radius: 50%;
        }
        .cb-orders-queue-body { padding: 23px; }
        .cb-orders-queue-grid {
          display: grid;
          grid-template-columns: repeat(4,minmax(0,1fr));
          gap: 12px;
        }
        .cb-orders-queue-metric {
          border: 1px solid #e8edf4;
          border-radius: 14px;
          padding: 17px 12px;
          background: #f9faff;
        }
        .cb-orders-queue-metric small {
          display: block;
          color: var(--cb-muted);
          font-size: 10px;
          font-weight: 900;
          letter-spacing: .5px;
        }
        .cb-orders-queue-metric strong {
          display: block;
          margin-top: 8px;
          font-size: 27px;
          font-weight: 900;
          overflow-wrap: anywhere;
        }
        .cb-orders-progress {
          height: 8px;
          border-radius: 99px;
          background: #e9edf4;
          overflow: hidden;
        }
        .cb-orders-progress span {
          display: block;
          height: 100%;
          background: linear-gradient(90deg,#ffbf8e,#f28c4e);
          border-radius: inherit;
          transition: width .35s ease;
        }
        .cb-orders-notice {
          display: flex;
          align-items: flex-start;
          gap: 13px;
          padding: 16px 18px;
          border-radius: 14px;
          margin-bottom: 20px;
          border: 1px solid #d4e8ff;
          background: #f2f8ff;
          color: #27496f;
        }
        .cb-orders-notice.error {
          border-color: #f1cccc;
          background: #fff5f5;
          color: #983b3b;
        }
        .cb-orders-notice.success {
          border-color: #ccebd9;
          background: #f1fbf5;
          color: #246846;
        }
        .cb-orders-notice button {
          margin-left: auto;
          border: 0;
          background: transparent;
          color: inherit;
          font-size: 19px;
          cursor: pointer;
        }
        .cb-orders-filterbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          flex-wrap: wrap;
          margin: 28px 0 15px;
        }
        .cb-orders-filterbar h2 {
          font-size: 20px;
          font-weight: 900;
          margin: 0 0 5px;
        }
        .cb-orders-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }
        .cb-orders-filter {
          border: 1px solid #e1e7ef;
          border-radius: 99px;
          padding: 9px 14px;
          background: #fff;
          color: #5d6a7e;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }
        .cb-orders-filter.active {
          background: #17243b;
          border-color: #17243b;
          color: #fff;
        }
        .cb-orders-card {
          border: 1px solid #e6ebf2;
          background: #fff;
          border-radius: 18px;
          overflow: hidden;
          margin-bottom: 15px;
          box-shadow: 0 9px 26px rgba(20,35,58,.035);
          transition: box-shadow .2s ease, transform .2s ease;
        }
        .cb-orders-card:hover {
          box-shadow: 0 14px 32px rgba(20,35,58,.07);
        }
        .cb-orders-card-top {
          display: grid;
          grid-template-columns: 90px minmax(0,1fr) auto;
          gap: 20px;
          padding: 22px;
          align-items: center;
        }
        .cb-orders-token {
          min-height: 90px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 1px dashed #f3c29e;
          border-radius: 15px;
          background: #fff6ee;
        }
        .cb-orders-token small {
          color: #ad724b;
          font-size: 9px;
          font-weight: 900;
          letter-spacing: .7px;
        }
        .cb-orders-token strong {
          color: #c66f37;
          font-size: 32px;
          font-weight: 900;
          line-height: 1.2;
          margin-top: 5px;
        }
        .cb-orders-id {
          font-size: 15px;
          font-weight: 900;
          overflow-wrap: anywhere;
          margin: 0 0 9px;
        }
        .cb-orders-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 15px;
          color: var(--cb-muted);
          font-size: 11px;
          line-height: 1.6;
        }
        .cb-orders-meta strong { color: #47556a; }
        .cb-orders-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          border-radius: 99px;
          padding: 9px 12px;
          font-size: 11px;
          font-weight: 900;
          white-space: nowrap;
        }
        .cb-orders-status.pending { color: #9b6813; background: #fff5d9; }
        .cb-orders-status.preparing { color: #27659e; background: #eaf5ff; }
        .cb-orders-status.ready { color: #217a50; background: #e8f8ef; }
        .cb-orders-status.completed { color: #4356a2; background: #edf0ff; }
        .cb-orders-status.cancelled { color: #ad4141; background: #fff0f0; }
        .cb-orders-status.unknown { color: #5e6a7c; background: #eef1f5; }
        .cb-orders-card-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 14px 22px;
          background: #fafbfe;
          border-top: 1px solid #edf0f5;
        }
        .cb-orders-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          border: 1px solid #dfe5ee;
          background: white;
          color: #253650;
          border-radius: 10px;
          padding: 10px 13px;
          font-size: 11px;
          font-weight: 900;
          cursor: pointer;
        }
        .cb-orders-button:hover { background: #f4f6fa; }
        .cb-orders-button.danger {
          color: #b04444;
          border-color: #f1d1d1;
          background: #fffafa;
        }
        .cb-orders-button:disabled { opacity: .55; cursor: wait; }
        .cb-orders-details {
          padding: 23px;
          border-top: 1px solid #edf0f5;
          background: #fcfdff;
        }
        .cb-orders-details h3 {
          margin: 0 0 15px;
          font-size: 14px;
          font-weight: 900;
        }
        .cb-orders-items {
          border: 1px solid #e7ecf3;
          border-radius: 12px;
          overflow: hidden;
        }
        .cb-orders-item {
          display: grid;
          grid-template-columns: minmax(0,1fr) auto auto;
          align-items: center;
          gap: 16px;
          padding: 13px 15px;
          border-bottom: 1px solid #edf0f5;
          font-size: 12px;
        }
        .cb-orders-item:last-child { border-bottom: 0; }
        .cb-orders-item-name { font-weight: 800; overflow-wrap: anywhere; }
        .cb-orders-item-sub { color: var(--cb-muted); font-size: 10px; margin-top: 4px; }
        .cb-orders-track {
          display: grid;
          grid-template-columns: repeat(4,minmax(0,1fr));
          gap: 7px;
          margin: 19px 0 10px;
        }
        .cb-orders-track-step { text-align: center; position: relative; }
        .cb-orders-track-icon {
          height: 39px;
          width: 39px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 8px;
          color: #929eb0;
          background: #edf0f5;
          font-size: 17px;
          font-weight: 900;
        }
        .cb-orders-track-step.done .cb-orders-track-icon {
          color: #fff;
          background: #df8b54;
        }
        .cb-orders-track-step small {
          font-size: 10px;
          color: #8792a5;
          font-weight: 800;
        }
        .cb-orders-track-step.done small { color: #b86b36; }
        .cb-orders-empty {
          background: #fff;
          border: 1px solid #e8edf4;
          border-radius: 20px;
          padding: 58px 20px;
          text-align: center;
        }
        .cb-orders-empty-icon {
          width: 82px;
          height: 82px;
          margin: 0 auto 18px;
          border-radius: 25px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #fff0e5;
          font-size: 37px;
        }
        .cb-orders-empty h2 { font-size: 23px; font-weight: 900; }
        .cb-orders-empty p {
          color: var(--cb-muted);
          font-size: 13px;
          margin: 9px 0 21px;
        }
        .cb-orders-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #17243b;
          color: white !important;
          border-radius: 11px;
          padding: 13px 17px;
          font-size: 12px;
          font-weight: 900;
        }
        .cb-orders-footer {
          text-align: center;
          color: #8995a8;
          padding: 45px 20px 0;
          font-size: 10px;
          letter-spacing: 1px;
        }
        .cb-orders-footer strong {
          display: block;
          color: #253650;
          font-size: 13px;
          letter-spacing: 0;
          margin-top: 8px;
        }
        @media (max-width: 760px) {
          .cb-orders-container { padding: 0 15px; }
          .cb-orders-hero-inner { padding-top: 35px; padding-bottom: 58px; }
          .cb-orders-stats { gap: 9px; }
          .cb-orders-stat { padding: 14px; align-items: flex-start; }
          .cb-orders-stat strong { font-size: 22px; }
          .cb-orders-stat-icon { display: none; }
          .cb-orders-queue-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
          .cb-orders-card-top {
            grid-template-columns: 68px minmax(0,1fr);
            gap: 13px;
            padding: 16px;
          }
          .cb-orders-token { min-height: 75px; }
          .cb-orders-token strong { font-size: 26px; }
          .cb-orders-card-status { grid-column: 2; }
          .cb-orders-card-actions { padding: 13px 16px; }
          .cb-orders-panel-head { padding: 18px; }
          .cb-orders-queue-body { padding: 16px; }
          .cb-orders-details { padding: 17px; }
          .cb-orders-item { gap: 8px; padding: 12px 10px; }
        }
        @media (max-width: 420px) {
          .cb-orders-stats { grid-template-columns: 1fr 1fr; }
          .cb-orders-stat:last-child { grid-column: 1 / -1; }
          .cb-orders-filters { width: 100%; }
          .cb-orders-filter { flex: 1; padding: 9px 8px; }
          .cb-orders-card-actions { align-items: flex-start; flex-direction: column; }
          .cb-orders-card-actions > div { width: 100%; }
          .cb-orders-card-actions .cb-orders-button { flex: 1; }
          .cb-orders-track-icon { width: 32px; height: 32px; font-size: 14px; }
          .cb-orders-track-step small { font-size: 9px; }
        }
      `}</style>

      {/* Hero */}
      <section className="cb-orders-hero">
        <div className="cb-orders-container cb-orders-hero-inner">
          <div className="d-flex flex-wrap justify-content-between align-items-end gap-4">
            <div>
              <span className="cb-orders-eyebrow">
                CAMPUS BITE · ORDER CENTER
              </span>
              <h1>Every order,<br />under control.</h1>
              <p>
                Track your food, follow your token in the queue and
                stay updated as your order moves from kitchen to pickup.
              </p>
            </div>

            <button
              className="cb-orders-refresh"
              type="button"
              onClick={() => {
                fetchOrders(true);
                fetchQueue();
              }}
              disabled={refreshing || loading || queueLoading}
            >
              ↻ {refreshing || queueLoading ? "Refreshing..." : "Refresh status"}
            </button>
          </div>
        </div>
      </section>

      <main className="cb-orders-container cb-orders-main">
        {error && (
          <div className="cb-orders-notice error" role="alert">
            <span>⚠</span>
            <div>{error}</div>
            <button
              type="button"
              aria-label="Dismiss error"
              onClick={() => setError("")}
            >
              ×
            </button>
          </div>
        )}

        {notification && (
          <div className="cb-orders-notice success" role="status">
            <span style={{ fontSize: 20 }}>✓</span>
            <div style={{ flex: 1 }}>
              <strong>Order update</strong>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                {notification.message}
              </div>
              {notification.tokenNumber != null && (
                <div style={{ fontSize: 11, marginTop: 5 }}>
                  Token #{notification.tokenNumber}
                </div>
              )}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setNotification(null)}
            >
              ×
            </button>
          </div>
        )}

        {!loading && !error && orders.length > 0 && (
          <section className="cb-orders-stats">
            <div className="cb-orders-stat">
              <div>
                <small>TOTAL ORDERS</small>
                <strong>{orders.length}</strong>
              </div>
              <span className="cb-orders-stat-icon">▤</span>
            </div>
            <div className="cb-orders-stat">
              <div>
                <small>ACTIVE ORDERS</small>
                <strong>{activeOrders.length}</strong>
              </div>
              <span className="cb-orders-stat-icon">◷</span>
            </div>
            <div className="cb-orders-stat">
              <div>
                <small>TOTAL SPENT</small>
                <strong style={{ fontSize: 23 }}>{formatMoney(totalSpent)}</strong>
                <div className="cb-orders-muted" style={{ marginTop: 5 }}>
                  {totalItems} items ordered
                </div>
              </div>
              <span className="cb-orders-stat-icon">₹</span>
            </div>
          </section>
        )}

        {/* Live Queue */}
        {queueData?.hasActiveOrder && (
          <section className="cb-orders-panel cb-orders-queue">
            <div className="cb-orders-queue-head">
              <div>
                <h2>◉ Live token queue</h2>
                <div style={{ color: "#aab7ca", fontSize: 12 }}>
                  Your real-time canteen pickup progress
                </div>
              </div>
              <span className="cb-orders-live">
                <span className="cb-orders-live-dot" />
                LIVE
              </span>
            </div>

            <div className="cb-orders-queue-body">
              <div className="cb-orders-queue-grid">
                <div className="cb-orders-queue-metric">
                  <small>YOUR TOKEN</small>
                  <strong style={{ color: "#c66f37" }}>
                    #{queueData.yourToken ?? "—"}
                  </strong>
                </div>
                <div className="cb-orders-queue-metric">
                  <small>NOW SERVING</small>
                  <strong style={{ color: "#288257" }}>
                    {queueData.currentlyServing != null
                      ? `#${queueData.currentlyServing}`
                      : "—"}
                  </strong>
                </div>
                <div className="cb-orders-queue-metric">
                  <small>PEOPLE AHEAD</small>
                  <strong>{queueData.peopleAhead ?? "—"}</strong>
                </div>
                <div className="cb-orders-queue-metric">
                  <small>ESTIMATED WAIT</small>
                  <strong>
                    {queueData.estimatedMinutes ?? "—"}
                    <span style={{ fontSize: 12, marginLeft: 4 }}>min</span>
                  </strong>
                </div>
              </div>

              <div className="mt-4">
                <div className="d-flex justify-content-between gap-2 mb-2">
                  <strong style={{ fontSize: 12 }}>Queue position</strong>
                  <span className="cb-orders-muted">
                    {queueData.queuePosition ?? "—"} / {queueData.queueLength ?? "—"}
                  </span>
                </div>
                <div className="cb-orders-progress">
                  <span
                    style={{
                      width: `${
                        Number(queueData.queueLength) > 0
                          ? Math.min(
                              100,
                              (Number(queueData.queuePosition) /
                                Number(queueData.queueLength)) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="mt-3 d-flex flex-wrap align-items-center gap-2">
                <span
                  className={`cb-orders-status ${statusMeta(queueData.orderStatus).className}`}
                >
                  {statusMeta(queueData.orderStatus).icon}{" "}
                  {queueData.orderStatus || "Queue active"}
                </span>
                <span className="cb-orders-muted">
                  {statusMeta(queueData.orderStatus).message}
                </span>
              </div>
            </div>
          </section>
        )}

        {queueLoading && (
          <div className="cb-orders-muted mb-3">
            Updating live queue...
          </div>
        )}

        {queueError && (
          <div className="cb-orders-notice">
            <span>ⓘ</span>
            <div>{queueError}</div>
          </div>
        )}

        {/* Order history */}
        <div className="cb-orders-filterbar">
          <div>
            <h2>Your order history</h2>
            <div className="cb-orders-muted">
              View items, token numbers and order progress
            </div>
          </div>

          {!loading && orders.length > 0 && (
            <div className="cb-orders-filters">
              {filters.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`cb-orders-filter ${filter === item ? "active" : ""}`}
                  onClick={() => setFilter(item)}
                >
                  {item}
                  {item === "All" ? ` (${orders.length})` : ""}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <section className="cb-orders-empty">
            <div className="spinner-border" role="status" />
            <h2 style={{ marginTop: 20 }}>Loading your orders</h2>
            <p>Getting your latest order history...</p>
          </section>
        )}

        {!loading && !error && orders.length === 0 && (
          <section className="cb-orders-empty">
            <div className="cb-orders-empty-icon">🛍️</div>
            <h2>Your food story starts here.</h2>
            <p>
              You haven't placed an order yet. Explore the menu and
              discover your next campus favourite.
            </p>
            <Link to="/canteen-menu" className="cb-orders-primary">
              Explore the menu ↗
            </Link>
          </section>
        )}

        {!loading && !error && orders.length > 0 && filteredOrders.length === 0 && (
          <section className="cb-orders-empty">
            <div className="cb-orders-empty-icon">⌕</div>
            <h2>No {filter.toLowerCase()} orders</h2>
            <p>Try another filter to see your order history.</p>
            <button
              type="button"
              className="cb-orders-primary"
              onClick={() => setFilter("All")}
              style={{ border: 0, cursor: "pointer" }}
            >
              Show all orders
            </button>
          </section>
        )}

        {!loading && !error && filteredOrders.map((order) => {
          const meta = statusMeta(order.status);
          const step = getStatusStep(order.status);
          const expanded = expandedOrder === order._id;

          return (
            <article className="cb-orders-card" key={order._id}>
              <div className="cb-orders-card-top">
                <div className="cb-orders-token">
                  <small>YOUR TOKEN</small>
                  <strong>{order.tokenNumber ?? "—"}</strong>
                </div>

                <div>
                  <div className="cb-orders-muted" style={{ marginBottom: 5 }}>
                    ORDER REFERENCE
                  </div>
                  <h3 className="cb-orders-id">
                    {order.orderId || "Order details"}
                  </h3>
                  <div className="cb-orders-meta">
                    <span>▤ {getTotalItems(order)} item(s)</span>
                    <span>
                      Total: <strong>{formatMoney(order.totalAmount)}</strong>
                    </span>
                  </div>
                  <div className="cb-orders-meta" style={{ marginTop: 7 }}>
                    <span>◷ {formatDate(order.createdAt)}</span>
                  </div>
                </div>

                <div className="cb-orders-card-status">
                  <span className={`cb-orders-status ${meta.className}`}>
                    {meta.icon} {order.status || "Unknown"}
                  </span>
                </div>
              </div>

              <div className="cb-orders-card-actions">
                <div className="cb-orders-muted">
                  {meta.message}
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {order.status === "Pending" && (
                    <button
                      type="button"
                      className="cb-orders-button danger"
                      onClick={() => cancelOrder(order)}
                      disabled={cancellingId === order._id}
                    >
                      {cancellingId === order._id
                        ? "Cancelling..."
                        : "× Cancel order"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="cb-orders-button"
                    onClick={() =>
                      setExpandedOrder(expanded ? null : order._id)
                    }
                    aria-expanded={expanded}
                  >
                    {expanded ? "Hide details ↑" : "View details ↓"}
                  </button>
                </div>
              </div>

              {expanded && (
                <div className="cb-orders-details">
                  <h3>Items in this order</h3>

                  {order.items?.length ? (
                    <div className="cb-orders-items">
                      {order.items.map((item, index) => {
                        const quantity = Number(item.quantity || 0);
                        const price = Number(item.price || 0);
                        const subtotal =
                          item.subtotal != null
                            ? Number(item.subtotal)
                            : price * quantity;

                        return (
                          <div
                            className="cb-orders-item"
                            key={item._id || `${item.name}-${index}`}
                          >
                            <div>
                              <div className="cb-orders-item-name">
                                🍽️ {item.name || "Food item"}
                              </div>
                              <div className="cb-orders-item-sub">
                                {formatMoney(price)} per item
                              </div>
                            </div>
                            <span style={{ color: "#647187" }}>
                              × {quantity}
                            </span>
                            <strong>{formatMoney(subtotal)}</strong>
                          </div>
                        );
                      })}
                      <div
                        className="d-flex justify-content-between align-items-center gap-3"
                        style={{
                          padding: "16px",
                          background: "#f9faff",
                          fontSize: 13,
                        }}
                      >
                        <strong>Order total</strong>
                        <strong style={{ color: "#c66f37", fontSize: 17 }}>
                          {formatMoney(order.totalAmount)}
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div className="cb-orders-muted">
                      No item details available for this order.
                    </div>
                  )}

                  <h3 style={{ marginTop: 25 }}>Order progress</h3>

                  {order.status === "Cancelled" ? (
                    <div className="cb-orders-notice error">
                      <span>×</span>
                      <div>This order was cancelled.</div>
                    </div>
                  ) : (
                    <>
                      <div className="cb-orders-track">
                        {STATUS_STEPS.map((statusStep, index) => {
                          const done = step >= index + 1;

                          return (
                            <div
                              className={`cb-orders-track-step ${done ? "done" : ""}`}
                              key={statusStep.label}
                            >
                              <div className="cb-orders-track-icon">
                                {done ? "✓" : statusStep.icon}
                              </div>
                              <small>{statusStep.label}</small>
                            </div>
                          );
                        })}
                      </div>

                      <div className="cb-orders-muted mt-3">
                        Current status: <strong>{order.status || "Unknown"}</strong>
                        {order.updatedAt
                          ? ` · Last updated ${formatDate(order.updatedAt)}`
                          : ""}
                      </div>
                    </>
                  )}
                </div>
              )}
            </article>
          );
        })}

        <div className="cb-orders-footer">
          CAMPUS BITE · SMART FOOD EXPERIENCE
          <strong>
            Designed &amp; Developed by{" "}
            <span style={{ color: "#c66f37" }}>Mohd Altamash</span>
          </strong>
        </div>
      </main>
    </div>
  );
};

export default MyOrders;
