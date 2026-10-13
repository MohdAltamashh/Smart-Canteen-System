import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

// =====================================================
// IMAGE URL HELPER
// =====================================================

const getCartImageUrl = (imageUrl) => {
  if (!imageUrl) return "";

  const value = String(imageUrl).trim();

  if (
    value.startsWith("http://") ||
    value.startsWith("https://")
  ) {
    return value;
  }

  if (value.startsWith("/uploads/food/")) {
    return `${API_URL}/food${value}`;
  }

  return `${API_URL}${value.startsWith("/") ? "" : "/"}${value}`;
};

// =====================================================
// FOOD COURT HELPER
// =====================================================

const getFoodCourtId = (item) => {
  if (!item) return "";

  const court =
    item.foodCourtId ||
    item.foodCourt ||
    item.canteenId;

  if (!court) return "";

  if (typeof court === "object") {
    return String(
      court._id ||
      court.id ||
      ""
    );
  }

  return String(court);
};

// =====================================================
// CART COMPONENT
// =====================================================

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [error, setError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(
    Boolean(window.Razorpay)
  );

  // ===================================================
  // LOAD CART
  // ===================================================

  useEffect(() => {
    const loadCart = () => {
      try {
        const saved = JSON.parse(
          localStorage.getItem("cart") || "[]"
        );

        setCartItems(
          Array.isArray(saved) ? saved : []
        );
      } catch (err) {
        console.error("Cart loading error:", err);
        setCartItems([]);
      }
    };

    loadCart();

    window.addEventListener(
      "cartUpdated",
      loadCart
    );

    return () => {
      window.removeEventListener(
        "cartUpdated",
        loadCart
      );
    };
  }, []);

  // ===================================================
  // LOAD RAZORPAY
  // ===================================================

  useEffect(() => {
    if (window.Razorpay) {
      setRazorpayLoaded(true);
      return;
    }

    const scriptUrl =
      "https://checkout.razorpay.com/v1/checkout.js";

    let script = document.querySelector(
      `script[src="${scriptUrl}"]`
    );

    const handleLoad = () => {
      setRazorpayLoaded(
        Boolean(window.Razorpay)
      );

      if (!window.Razorpay) {
        setError(
          "Payment gateway initialize nahi hua. Page refresh karein."
        );
      }
    };

    const handleError = () => {
      setRazorpayLoaded(false);

      setError(
        "Razorpay load nahi ho raha. Internet check karke refresh karein."
      );
    };

    if (!script) {
      script = document.createElement("script");
      script.src = scriptUrl;
      script.async = true;

      document.body.appendChild(script);
    }

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    if (window.Razorpay) {
      handleLoad();
    }

    return () => {
      script?.removeEventListener(
        "load",
        handleLoad
      );

      script?.removeEventListener(
        "error",
        handleError
      );
    };
  }, []);

  // ===================================================
  // PERSIST CART
  // ===================================================

  const saveCart = (updatedCart) => {
    setCartItems(updatedCart);

    localStorage.setItem(
      "cart",
      JSON.stringify(updatedCart)
    );

    window.dispatchEvent(
      new Event("cartUpdated")
    );
  };

  // ===================================================
  // CHECK SINGLE FOOD COURT
  // ===================================================

  const validateSingleFoodCourt = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
      return {
        valid: false,
        message: "Aapka cart empty hai.",
      };
    }

    const courtIds = items.map(
      getFoodCourtId
    );

    // Missing court IDs cannot safely be validated
    // on the frontend. Backend validation remains
    // authoritative.
    if (courtIds.some((id) => !id)) {
      return {
        valid: false,
        message:
          "Cart ke kuch items ka Food Court ID missing hai. Menu se items dobara add karein.",
      };
    }

    const uniqueCourtIds = [
      ...new Set(courtIds),
    ];

    if (uniqueCourtIds.length !== 1) {
      return {
        valid: false,
        message:
          "Aapke cart mein multiple Food Courts ke items hain. Ek Food Court select karke order place karein.",
      };
    }

    return {
      valid: true,
      foodCourtId: uniqueCourtIds[0],
    };
  };

  // ===================================================
  // UPDATE QUANTITY
  // ===================================================

  const updateQuantity = (id, change) => {
    if (placingOrder || paymentLoading) return;

    const updated = cartItems
      .map((item) => {
        if (
          String(item._id) !== String(id)
        ) {
          return item;
        }

        return {
          ...item,
          quantity:
            Number(item.quantity || 0) +
            change,
        };
      })
      .filter(
        (item) => Number(item.quantity) > 0
      );

    saveCart(updated);
  };

  // ===================================================
  // REMOVE ITEM
  // ===================================================

  const removeItem = (id) => {
    if (placingOrder || paymentLoading) return;

    saveCart(
      cartItems.filter(
        (item) =>
          String(item._id) !== String(id)
      )
    );

    setError("");
  };

  // ===================================================
  // TOTALS
  // ===================================================

  const totalItems = cartItems.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0),
    0
  );

  const totalAmount = cartItems.reduce(
    (sum, item) =>
      sum +
      Number(item.price || 0) *
        Number(item.quantity || 0),
    0
  );

  const courtValidation =
    validateSingleFoodCourt(cartItems);

  // ===================================================
  // VERIFY PAYMENT WITH BACKEND
  // ===================================================

  const verifyPayment = async (
    paymentResponse
  ) => {
    try {
      const token =
        localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Login session expire ho gaya. Dobara login karein."
        );
      }

      const response = await fetch(
        `${API_URL}/payment/verify`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            razorpay_order_id:
              paymentResponse.razorpay_order_id,

            razorpay_payment_id:
              paymentResponse.razorpay_payment_id,

            razorpay_signature:
              paymentResponse.razorpay_signature,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            "Payment verification failed."
        );
      }

      if (!data.order) {
        throw new Error(
          "Order details nahi mili. My Orders mein status check karein."
        );
      }

      setOrderSuccess(data.order);
      setError("");

      // Clear only after backend confirms order.
      localStorage.removeItem("cart");

      setCartItems([]);

      window.dispatchEvent(
        new Event("cartUpdated")
      );

      return true;
    } catch (err) {
      console.error(
        "Payment verification error:",
        err
      );

      setError(
        err.message ||
          "Payment verify nahi hua. Agar paise deduct hue hain, My Orders check karein."
      );

      return false;
    } finally {
      setPaymentLoading(false);
      setPlacingOrder(false);
    }
  };

  // ===================================================
  // OPEN RAZORPAY CHECKOUT
  // ===================================================

  const openRazorpayCheckout = (
    paymentData
  ) => {
    let paymentCompleted = false;
    let verificationStarted = false;
    let razorpay;

    try {
      if (!window.Razorpay) {
        throw new Error(
          "Razorpay load nahi hua. Page refresh karke try karein."
        );
      }

      if (
        !paymentData?.keyId ||
        !paymentData?.razorpayOrderId ||
        !paymentData?.amountInPaise
      ) {
        throw new Error(
          "Backend se payment details incomplete mili hain."
        );
      }

      razorpay = new window.Razorpay({
        key: paymentData.keyId,

        amount: paymentData.amountInPaise,

        currency:
          paymentData.currency || "INR",

        order_id:
          paymentData.razorpayOrderId,

        name: "Campus Bite",

        description:
          "Digital Food Ordering & Service Platform",

        prefill: {
          name:
            paymentData.studentName || "",

          email:
            paymentData.studentEmail || "",
        },

        notes: {
          platform: "Campus Bite",
        },

        theme: {
          color: "#ff9b5e",
        },

        handler: async (response) => {
          if (verificationStarted) return;

          verificationStarted = true;

          setPaymentLoading(true);
          setPlacingOrder(true);
          setError("");

          const verified =
            await verifyPayment(response);

          if (verified) {
            paymentCompleted = true;

            try {
              razorpay.close();
            } catch (err) {
              console.log(
                "Checkout close:",
                err.message
              );
            }
          }
        },

        modal: {
          ondismiss: () => {
            if (
              !paymentCompleted &&
              !verificationStarted
            ) {
              setPaymentLoading(false);
              setPlacingOrder(false);

              setError(
                "Payment window close ho gayi. Agar payment deduct hua hai, My Orders aur payment status check karein."
              );
            }
          },
        },
      });

      razorpay.on(
        "payment.failed",
        (response) => {
          console.error(
            "Razorpay payment failed:",
            response
          );

          setPaymentLoading(false);
          setPlacingOrder(false);

          setError(
            response?.error?.description ||
              response?.error?.reason ||
              "Payment fail ho gaya. Please dobara try karein."
          );
        }
      );

      razorpay.open();
    } catch (err) {
      console.error(
        "Razorpay checkout error:",
        err
      );

      setError(
        err.message ||
          "Razorpay checkout open nahi ho paya."
      );

      setPaymentLoading(false);
      setPlacingOrder(false);
    }
  };

  // ===================================================
  // START PAYMENT
  // ===================================================

  const startPayment = async () => {
    try {
      setError("");
      setOrderSuccess(null);

      if (!cartItems.length) {
        setError("Aapka cart empty hai.");
        return;
      }

      if (placingOrder || paymentLoading) {
        return;
      }

      const token =
        localStorage.getItem("token");

      if (!token) {
        setError(
          "Payment karne ke liye pehle student login karein."
        );

        return;
      }

      // Validate single Food Court.
      const courtCheck =
        validateSingleFoodCourt(cartItems);

      if (!courtCheck.valid) {
        setError(courtCheck.message);
        return;
      }

      // Validate items.
      const invalidItem = cartItems.find(
        (item) =>
          !item._id ||
          !item.name ||
          !Number.isInteger(
            Number(item.quantity)
          ) ||
          Number(item.quantity) <= 0 ||
          Number(item.quantity) > 100 ||
          !Number.isFinite(
            Number(item.price)
          ) ||
          Number(item.price) < 0
      );

      if (invalidItem) {
        setError(
          "Cart mein invalid item hai. Menu se item dobara add karein."
        );

        return;
      }

      if (
        !Number.isFinite(totalAmount) ||
        totalAmount <= 0
      ) {
        setError(
          "Order amount valid nahi hai."
        );

        return;
      }

      if (!window.Razorpay) {
        setError(
          "Razorpay load ho raha hai. Kuch seconds baad try karein."
        );

        return;
      }

      setPlacingOrder(true);
      setPaymentLoading(true);

      const response = await fetch(
        `${API_URL}/payment/create-order`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            items: cartItems.map((item) => ({
              _id: item._id,
              quantity: Number(item.quantity),
            })),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (
          data?.code ===
          "MULTIPLE_FOOD_COURTS"
        ) {
          throw new Error(
            "Cart mein alag-alag Food Courts ke items hain. Cart clear karke ek Food Court ke items select karein."
          );
        }

        throw new Error(
          data?.message ||
            data?.error ||
            "Payment order create nahi hua."
        );
      }

      if (
        !data.payment?.razorpayOrderId ||
        !data.payment?.keyId
      ) {
        throw new Error(
          "Backend se Razorpay Order ID ya Key ID nahi mili."
        );
      }

      // Guard against unexpected court mismatch.
      const responseCourtId =
        data.payment?.foodCourt?._id;

      if (
        responseCourtId &&
        String(responseCourtId) !==
          String(courtCheck.foodCourtId)
      ) {
        throw new Error(
          "Food Court verification failed. Please refresh the menu and try again."
        );
      }

      openRazorpayCheckout(
        data.payment
      );
    } catch (err) {
      console.error(
        "Start payment error:",
        err
      );

      setError(
        err.message ||
          "Payment start karte waqt error aa gaya."
      );

      setPaymentLoading(false);
      setPlacingOrder(false);
    }
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="cb-cart">
      <style>{`
        .cb-cart {
          min-height: 100vh;
          background: #f5f7fb;
          color: #172238;
          padding-bottom: 65px;
          font-family: Inter, "Segoe UI", Arial, sans-serif;
        }
        .cb-cart * { box-sizing: border-box; }
        .cb-cart a { text-decoration: none; }
        .cb-cart-container {
          max-width: 1180px;
          margin: auto;
          padding-left: 24px;
          padding-right: 24px;
        }
        .cb-cart-hero {
          position: relative;
          overflow: hidden;
          color: white;
          background:
            radial-gradient(ellipse at 82% 15%, rgba(255,173,104,.16), transparent 33%),
            linear-gradient(125deg, #0b1220, #172643);
        }
        .cb-cart-hero-inner {
          padding-top: 48px;
          padding-bottom: 72px;
        }
        .cb-cart-eyebrow {
          display: inline-block;
          color: #ffc18e;
          background: rgba(255,173,104,.09);
          border: 1px solid rgba(255,173,104,.22);
          border-radius: 999px;
          padding: 8px 13px;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }
        .cb-cart-title {
          font-size: clamp(34px, 5vw, 52px);
          line-height: 1.1;
          letter-spacing: -2px;
          font-weight: 900;
          margin: 19px 0 12px;
        }
        .cb-cart-subtitle {
          max-width: 550px;
          color: #aab7ca;
          line-height: 1.8;
          font-size: 14px;
          margin: 0;
        }
        .cb-cart-main { margin-top: -28px; position: relative; }
        .cb-cart-panel {
          border: 1px solid #e8edf4;
          border-radius: 21px;
          background: white;
          box-shadow: 0 15px 45px rgba(18,35,62,.055);
          overflow: hidden;
        }
        .cb-cart-panel-heading {
          padding: 22px 24px;
          border-bottom: 1px solid #edf0f5;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }
        .cb-cart-panel-heading h2 {
          font-size: 17px;
          font-weight: 900;
          margin: 0 0 5px;
        }
        .cb-cart-muted { color: #8793a6; font-size: 12px; }
        .cb-cart-item {
          padding: 22px 24px;
          display: grid;
          grid-template-columns: 112px minmax(0,1fr) auto;
          gap: 19px;
          align-items: center;
          border-bottom: 1px solid #edf0f5;
        }
        .cb-cart-item:last-child { border-bottom: 0; }
        .cb-cart-image {
          height: 105px;
          width: 112px;
          border-radius: 16px;
          overflow: hidden;
          background: #f0f2f7;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cb-cart-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .cb-cart-item h3 {
          font-size: 16px;
          font-weight: 900;
          margin: 0 0 8px;
          color: #192840;
        }
        .cb-cart-category {
          display: inline-block;
          padding: 5px 9px;
          border-radius: 7px;
          background: #fff2e8;
          color: #b86632;
          font-size: 10px;
          font-weight: 800;
        }
        .cb-cart-unit {
          margin-top: 9px;
          font-size: 13px;
          font-weight: 800;
          color: #47566e;
        }
        .cb-cart-controls {
          display: inline-flex;
          align-items: center;
          border: 1px solid #e4e9f1;
          border-radius: 10px;
          overflow: hidden;
          margin-top: 12px;
        }
        .cb-cart-controls button {
          width: 35px;
          height: 34px;
          border: 0;
          background: #f8f9fc;
          color: #26364d;
          font-size: 20px;
          cursor: pointer;
        }
        .cb-cart-controls button:hover { background: #fff0e4; }
        .cb-cart-controls button:disabled { opacity: .45; cursor: not-allowed; }
        .cb-cart-quantity {
          min-width: 37px;
          text-align: center;
          font-size: 13px;
          font-weight: 900;
        }
        .cb-cart-line-total {
          min-width: 95px;
          text-align: right;
        }
        .cb-cart-line-total strong {
          display: block;
          color: #18273e;
          font-size: 16px;
          font-weight: 900;
        }
        .cb-cart-remove {
          margin-top: 10px;
          border: 0;
          padding: 5px 0;
          background: transparent;
          color: #cf5c5c;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }
        .cb-cart-summary {
          padding: 25px;
          position: sticky;
          top: 95px;
        }
        .cb-cart-summary h2 {
          font-size: 19px;
          font-weight: 900;
          margin: 0 0 22px;
        }
        .cb-cart-summary-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          margin: 15px 0;
          font-size: 13px;
        }
        .cb-cart-total {
          border-top: 1px dashed #dfe5ee;
          margin-top: 20px;
          padding-top: 20px;
        }
        .cb-cart-total strong {
          font-size: 25px;
          font-weight: 900;
          color: #d77e42;
        }
        .cb-cart-secure {
          border: 1px solid #e6ebf3;
          background: #f8faff;
          border-radius: 13px;
          padding: 14px;
          display: flex;
          gap: 11px;
          margin: 20px 0;
        }
        .cb-cart-secure strong { font-size: 12px; }
        .cb-cart-secure p {
          color: #8490a2;
          font-size: 11px;
          line-height: 1.7;
          margin: 4px 0 0;
        }
        .cb-cart-pay {
          width: 100%;
          border: 0;
          border-radius: 12px;
          padding: 15px;
          background: linear-gradient(135deg,#ffc28c,#ff985b);
          color: #192337;
          font-size: 13px;
          font-weight: 900;
          cursor: pointer;
          transition: transform .2s ease;
        }
        .cb-cart-pay:hover:not(:disabled) { transform: translateY(-2px); }
        .cb-cart-pay:disabled { opacity: .6; cursor: not-allowed; }
        .cb-cart-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e1e7ef;
          color: #24354d;
          border-radius: 10px;
          padding: 10px 13px;
          font-size: 12px;
          font-weight: 800;
        }
        .cb-cart-empty {
          padding: 65px 24px;
          text-align: center;
        }
        .cb-cart-empty-icon {
          margin: 0 auto 19px;
          height: 86px;
          width: 86px;
          border-radius: 27px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 42px;
          background: #fff0e4;
        }
        .cb-cart-empty h2 {
          font-size: 24px;
          font-weight: 900;
          margin-bottom: 10px;
        }
        .cb-cart-empty p {
          color: #8793a6;
          font-size: 13px;
          margin-bottom: 22px;
        }
        .cb-cart-primary-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          background: #17243b;
          color: white !important;
          padding: 13px 18px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 900;
        }
        .cb-cart-alert {
          border-radius: 13px;
          border: 1px solid #f1c7c7;
          background: #fff6f6;
          color: #9e3737;
          padding: 15px 18px;
          margin-bottom: 18px;
          font-size: 13px;
          line-height: 1.7;
        }
        .cb-cart-success {
          border: 1px solid #ccebd9;
          background: #fff;
          border-radius: 22px;
          padding: 35px;
          text-align: center;
          box-shadow: 0 15px 45px rgba(18,35,62,.055);
        }
        .cb-cart-success-icon {
          width: 78px;
          height: 78px;
          margin: 0 auto 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 25px;
          background: #e5f8ed;
          font-size: 39px;
        }
        .cb-cart-success h2 { font-size: 26px; font-weight: 900; }
        .cb-cart-success p { color: #8290a2; font-size: 13px; }
        .cb-cart-success-data {
          border: 1px solid #e8edf4;
          border-radius: 13px;
          padding: 17px 10px;
          height: 100%;
          background: #fafbfe;
        }
        .cb-cart-success-data small {
          display: block;
          color: #8793a6;
          font-size: 10px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .7px;
        }
        .cb-cart-success-data strong {
          display: block;
          margin-top: 9px;
          font-size: 15px;
          overflow-wrap: anywhere;
        }
        @media (max-width: 767px) {
          .cb-cart-container { padding-left: 16px; padding-right: 16px; }
          .cb-cart-hero-inner { padding-top: 37px; padding-bottom: 58px; }
          .cb-cart-title { letter-spacing: -1.3px; }
          .cb-cart-item {
            grid-template-columns: 82px minmax(0,1fr);
            gap: 13px;
            padding: 17px;
          }
          .cb-cart-image { width: 82px; height: 88px; }
          .cb-cart-line-total {
            grid-column: 2;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-width: 0;
            width: 100%;
            text-align: left;
          }
          .cb-cart-line-total strong { font-size: 14px; }
          .cb-cart-summary { position: static; padding: 20px; }
          .cb-cart-panel-heading { padding: 19px 17px; }
          .cb-cart-success { padding: 25px 17px; }
        }
      `}</style>

      {/* HEADER */}
      <section className="cb-cart-hero">
        <div className="cb-cart-container cb-cart-hero-inner">
          <div className="row align-items-center g-4">
            <div className="col-md-9">
              <span className="cb-cart-eyebrow">
                CAMPUS BITE / YOUR ORDER
              </span>

              <h1 className="cb-cart-title">
                Your cart.
                <br />
                Your next favourite.
              </h1>

              <p className="cb-cart-subtitle">
                Review your selections, adjust quantities and get ready
                for a smoother campus food pickup.
              </p>
            </div>

            <div className="col-md-3 text-md-end">
              <div style={{ fontSize: 76, opacity: 0.95 }}>
                🛒
              </div>

              <div style={{ color: "#aab7ca", fontSize: 12 }}>
                {totalItems} item
                {totalItems !== 1 ? "s" : ""} in your cart
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="cb-cart-container cb-cart-main">
        {error && (
          <div className="cb-cart-alert" role="alert">
            <strong>Payment notice</strong>
            <div>{error}</div>
          </div>
        )}

        {/* SUCCESS */}
        {orderSuccess && (
          <section className="cb-cart-success mb-4">
            <div className="cb-cart-success-icon">
              ✓
            </div>

            <div
              style={{
                color: "#3b9a69",
                fontSize: 10,
                fontWeight: 900,
                letterSpacing: 1.8,
                marginBottom: 10,
              }}
            >
              ORDER CONFIRMED
            </div>

            <h2>Payment successful!</h2>

            <p>
              Your order has been confirmed by the server.
            </p>

            <div className="row g-3 mt-4">
              <div className="col-md-4">
                <div className="cb-cart-success-data">
                  <small>Order ID</small>
                  <strong>
                    {orderSuccess.orderId || "N/A"}
                  </strong>
                </div>
              </div>

              <div className="col-md-4">
                <div className="cb-cart-success-data">
                  <small>Token number</small>
                  <strong
                    style={{
                      color: "#d77e42",
                      fontSize: 25,
                    }}
                  >
                    #{orderSuccess.tokenNumber ?? "N/A"}
                  </strong>
                </div>
              </div>

              <div className="col-md-4">
                <div className="cb-cart-success-data">
                  <small>Order status</small>
                  <strong>
                    {orderSuccess.status || "Pending"}
                  </strong>
                </div>
              </div>
            </div>

            <p className="mt-4">
              You can track your order status from My Orders.
            </p>

            <Link
              to="/my-orders"
              className="cb-cart-primary-link"
            >
              Track My Order ↗️
            </Link>
          </section>
        )}

        {/* EMPTY CART */}
        {cartItems.length === 0 && !orderSuccess && (
          <section className="cb-cart-panel">
            <div className="cb-cart-empty">
              <div className="cb-cart-empty-icon">
                🛍️
              </div>

              <h2>Your cart is taking a break.</h2>

              <p>
                You haven't added any food yet. Explore the menu
                and find something you love.
              </p>

              <Link
                to="/canteen-menu"
                className="cb-cart-primary-link"
              >
                Explore Menu <span>↗️</span>
              </Link>
            </div>
          </section>
        )}

        {/* CART ITEMS */}
        {cartItems.length > 0 && (
          <div className="row g-4 align-items-start">
            <div className="col-lg-8">
              <section className="cb-cart-panel">
                <div className="cb-cart-panel-heading">
                  <div>
                    <h2>Your selected items</h2>

                    <div className="cb-cart-muted">
                      {cartItems.length} food choice
                      {cartItems.length !== 1 ? "s" : ""}
                    </div>
                  </div>

                  <Link
                    to="/canteen-menu"
                    className="cb-cart-secondary"
                  >
                    + Add more
                  </Link>
                </div>

                {cartItems.map((item) => (
                  <article
                    className="cb-cart-item"
                    key={item._id}
                  >
                    <div className="cb-cart-image">
                      {item.imageUrl ? (
                        <img
                          src={getCartImageUrl(item.imageUrl)}
                          alt={item.name}
                          onError={(event) => {
                            event.currentTarget.style.display =
                              "none";

                            if (
                              event.currentTarget.parentElement
                            ) {
                              event.currentTarget.parentElement.innerHTML =
                                "🍽️";

                              event.currentTarget.parentElement.style.fontSize =
                                "36px";
                            }
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: 36 }}>
                          🍽️
                        </span>
                      )}
                    </div>

                    <div>
                      <h3>{item.name}</h3>

                      <span className="cb-cart-category">
                        {item.category || "Food"}
                      </span>

                      <div className="cb-cart-unit">
                        ₹{Number(item.price || 0)}{" "}
                        <span className="cb-cart-muted">
                          per item
                        </span>
                      </div>

                      <div className="cb-cart-controls">
                        <button
                          type="button"
                          aria-label={`Decrease ${item.name} quantity`}
                          onClick={() =>
                            updateQuantity(item._id, -1)
                          }
                          disabled={
                            placingOrder ||
                            paymentLoading
                          }
                        >
                          −
                        </button>

                        <span className="cb-cart-quantity">
                          {item.quantity}
                        </span>

                        <button
                          type="button"
                          aria-label={`Increase ${item.name} quantity`}
                          onClick={() =>
                            updateQuantity(item._id, 1)
                          }
                          disabled={
                            placingOrder ||
                            paymentLoading ||
                            Number(item.quantity) >= 100
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="cb-cart-line-total">
                      <div>
                        <span className="cb-cart-muted">
                          Subtotal
                        </span>

                        <strong>
                          ₹
                          {(
                            Number(item.price || 0) *
                            Number(item.quantity || 0)
                          ).toLocaleString("en-IN")}
                        </strong>
                      </div>

                      <button
                        type="button"
                        className="cb-cart-remove"
                        onClick={() =>
                          removeItem(item._id)
                        }
                        disabled={
                          placingOrder ||
                          paymentLoading
                        }
                      >
                        Remove item
                      </button>
                    </div>
                  </article>
                ))}
              </section>

              {!courtValidation.valid && (
                <div
                  className="cb-cart-alert mt-3"
                  role="alert"
                >
                  <strong>Food Court check</strong>
                  <div>{courtValidation.message}</div>
                </div>
              )}

              <div
                className="d-flex flex-wrap align-items-center gap-2 mt-3"
                style={{
                  color: "#8290a2",
                  fontSize: 11,
                }}
              >
                <span
                  style={{
                    color: "#4aa77a",
                    fontSize: 16,
                  }}
                >
                  ✓
                </span>

                Your cart is saved in this browser while you continue.
              </div>
            </div>

            {/* ORDER SUMMARY */}
            <div className="col-lg-4">
              <aside className="cb-cart-panel cb-cart-summary">
                <h2>Order summary</h2>

                <div className="cb-cart-summary-row">
                  <span className="cb-cart-muted">
                    Total food items
                  </span>

                  <strong>{totalItems}</strong>
                </div>

                <div className="cb-cart-summary-row">
                  <span className="cb-cart-muted">
                    Subtotal
                  </span>

                  <strong>
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </strong>
                </div>

                <div className="cb-cart-summary-row">
                  <span className="cb-cart-muted">
                    Payment method
                  </span>

                  <strong>Online</strong>
                </div>

                <div className="cb-cart-summary-row cb-cart-total">
                  <span style={{ fontWeight: 900 }}>
                    Total amount
                  </span>

                  <strong>
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </strong>
                </div>

                <div className="cb-cart-secure">
                  <span style={{ fontSize: 22 }}>
                    🔒
                  </span>

                  <div>
                    <strong>Secure checkout</strong>

                    <p>
                      Payment is processed through Razorpay. Your order
                      is confirmed only after backend verification.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="cb-cart-pay"
                  onClick={startPayment}
                  disabled={
                    placingOrder ||
                    paymentLoading ||
                    !razorpayLoaded ||
                    !courtValidation.valid
                  }
                >
                  {placingOrder || paymentLoading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      />

                      Processing payment...
                    </>
                  ) : !razorpayLoaded ? (
                    "Loading payment gateway..."
                  ) : !courtValidation.valid ? (
                    "Fix Food Court Selection"
                  ) : (
                    `Continue to pay ₹${totalAmount.toLocaleString("en-IN")} →`
                  )}
                </button>

                <div
                  className="text-center mt-3"
                  style={{
                    color: "#8793a6",
                    fontSize: 10,
                    lineHeight: 1.7,
                  }}
                >
                  Review your items before completing payment.
                </div>

                <div className="text-center mt-4">
                  <Link
                    to="/my-orders"
                    style={{
                      color: "#53627a",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    View my orders ↗️
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer
        style={{
          marginTop: 70,
          padding: "25px 16px",
          background: "#0b1220",
          color: "#8e9bb0",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 1.2,
          }}
        >
          CAMPUS BITE · SMART FOOD EXPERIENCE
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 14,
            fontWeight: 900,
            color: "#fff",
          }}
        >
          Designed & Developed by{" "}
          <span style={{ color: "#ffb477" }}>
            Mohd Altamash
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Cart;