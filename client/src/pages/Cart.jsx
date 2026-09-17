import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [error, setError] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);

  // =====================================================
  // LOAD CART
  // =====================================================

  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart =
          JSON.parse(localStorage.getItem("cart")) || [];

        setCartItems(savedCart);
      } catch (error) {
        console.error("Cart loading error:", error);
        setCartItems([]);
      }
    };

    loadCart();

    window.addEventListener("cartUpdated", loadCart);

    return () => {
      window.removeEventListener("cartUpdated", loadCart);
    };
  }, []);

  // =====================================================
  // LOAD RAZORPAY CHECKOUT
  // =====================================================

  useEffect(() => {
    if (window.Razorpay) return;

    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    );

    if (existingScript) return;

    const script = document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    script.onload = () => {
      console.log("Razorpay Checkout loaded successfully");
    };

    script.onerror = () => {
      console.error("Failed to load Razorpay Checkout");

      setError(
        "Unable to load payment gateway. Please check your internet connection and try again."
      );
    };

    document.body.appendChild(script);
  }, []);

  // =====================================================
  // UPDATE QUANTITY
  // =====================================================

  const updateQuantity = (id, change) => {
    const updatedCart = cartItems
      .map((item) => {
        if (item._id === id) {
          const newQuantity =
            Number(item.quantity || 0) + change;

          return {
            ...item,
            quantity: newQuantity,
          };
        }

        return item;
      })
      .filter((item) => item.quantity > 0);

    setCartItems(updatedCart);

    localStorage.setItem(
      "cart",
      JSON.stringify(updatedCart)
    );

    window.dispatchEvent(new Event("cartUpdated"));
  };

  // =====================================================
  // REMOVE ITEM
  // =====================================================

  const removeItem = (id) => {
    const updatedCart = cartItems.filter(
      (item) => item._id !== id
    );

    setCartItems(updatedCart);

    localStorage.setItem(
      "cart",
      JSON.stringify(updatedCart)
    );

    window.dispatchEvent(new Event("cartUpdated"));
  };

  // =====================================================
  // TOTAL
  // =====================================================

  const totalAmount = cartItems.reduce(
    (total, item) => {
      const price = Number(item.price || 0);
      const quantity = Number(item.quantity || 0);

      return total + price * quantity;
    },
    0
  );

  // =====================================================
  // VERIFY PAYMENT
  // =====================================================

  const verifyPayment = async (paymentResponse) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error(
          "Student login session expired. Please login again."
        );
      }

      const response = await fetch(
        "http://localhost:5000/api/payment/verify",
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

      if (!data?.order) {
        throw new Error(
          "Payment verified but order information was not received."
        );
      }

      setOrderSuccess(data.order);

      localStorage.removeItem("cart");

      setCartItems([]);

      window.dispatchEvent(
        new Event("cartUpdated")
      );

      setError("");

    } catch (error) {
      console.error(
        "Payment verification error:",
        error
      );

      setError(
        error.message ||
          "Payment verification failed. Please contact the canteen administrator if money was deducted."
      );

    } finally {
      setPaymentLoading(false);
      setPlacingOrder(false);
    }
  };

  // =====================================================
  // OPEN RAZORPAY
  // =====================================================

  const openRazorpayCheckout = (paymentData) => {
    try {
      if (!window.Razorpay) {
        setError(
          "Razorpay payment gateway is not loaded. Please refresh the page and try again."
        );

        setPaymentLoading(false);
        setPlacingOrder(false);

        return;
      }

      const options = {
        key: paymentData.keyId,

        amount: paymentData.amountInPaise,

        currency: paymentData.currency || "INR",

        order_id: paymentData.razorpayOrderId,

        name: "Smart Canteen",

        description: "Smart Canteen Food Order",

        prefill: {
          name: paymentData.studentName,
          email: paymentData.studentEmail,
        },

        theme: {
          color: "#0d6efd",
        },

        handler: async function (response) {
          await verifyPayment(response);
        },

        modal: {
          ondismiss: function () {
            setPaymentLoading(false);
            setPlacingOrder(false);

            setError(
              "Payment was cancelled or the payment window was closed."
            );
          },
        },
      };

      const razorpay =
        new window.Razorpay(options);

      razorpay.on(
        "payment.failed",
        function (response) {
          console.error(
            "Razorpay payment failed:",
            response
          );

          setPaymentLoading(false);
          setPlacingOrder(false);

          setError(
            response?.error?.description ||
              "Payment failed. Please try again."
          );
        }
      );

      razorpay.open();

    } catch (error) {
      console.error(
        "Razorpay checkout error:",
        error
      );

      setError(
        error.message ||
          "Unable to open Razorpay payment window."
      );

      setPaymentLoading(false);
      setPlacingOrder(false);
    }
  };

  // =====================================================
  // START PAYMENT
  // =====================================================

  const startPayment = async () => {
    try {
      setError("");
      setOrderSuccess(null);

      if (cartItems.length === 0) {
        setError("Your cart is empty.");
        return;
      }

      const token = localStorage.getItem("token");

      if (!token) {
        setError(
          "Please login as a student before making payment."
        );

        return;
      }

      const invalidItem = cartItems.find(
        (item) =>
          !item._id ||
          !item.name ||
          Number(item.quantity) <= 0 ||
          Number(item.price) < 0
      );

      if (invalidItem) {
        setError(
          "Some cart item is invalid. Please remove it and add it again from the menu."
        );

        return;
      }

      if (
        placingOrder ||
        paymentLoading
      ) {
        return;
      }

      setPlacingOrder(true);
      setPaymentLoading(true);

      if (!window.Razorpay) {
        setError(
          "Payment gateway is still loading. Please wait a moment and try again."
        );

        setPaymentLoading(false);
        setPlacingOrder(false);

        return;
      }

      const paymentData = {
        items: cartItems.map((item) => ({
          _id: item._id,
          quantity: Number(item.quantity),
        })),
      };

      const response = await fetch(
        "http://localhost:5000/api/payment/create-order",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",

            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify(paymentData),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data?.message ||
            data?.error ||
            "Unable to create payment order."
        );

        setPaymentLoading(false);
        setPlacingOrder(false);

        return;
      }

      if (!data?.payment) {
        setError(
          "Payment order was created but payment information was not received."
        );

        setPaymentLoading(false);
        setPlacingOrder(false);

        return;
      }

      openRazorpayCheckout(
        data.payment
      );

    } catch (error) {
      console.error(
        "Start payment error:",
        error
      );

      setError(
        error.message ||
          "Something went wrong while starting the payment."
      );

      setPaymentLoading(false);
      setPlacingOrder(false);
    }
  };

  // =====================================================
  // RETURN
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f8fc",
        paddingBottom: "60px",
      }}
    >

      {/* ================================================= */}
      {/* PAGE HEADER */}
      {/* ================================================= */}

      <section
        style={{
          background:
            "linear-gradient(135deg, #073b7a, #0d6efd)",
          color: "#fff",
        }}
      >

        <div className="container py-5">

          <div className="row align-items-center">

            <div className="col-lg-8">

              <span className="badge bg-warning text-dark px-3 py-2 mb-3">
                🛒 ORDER SUMMARY
              </span>

              <h1 className="fw-bold mb-2">
                Your Shopping Cart
              </h1>

              <p
                className="mb-0"
                style={{
                  opacity: 0.85,
                  fontSize: "16px",
                }}
              >
                Review your selected food items,
                choose quantities and complete your
                secure online payment.
              </p>

            </div>

            <div className="col-lg-4 text-center mt-4 mt-lg-0">

              <div
                style={{
                  fontSize: "80px",
                  lineHeight: 1,
                }}
              >
                🛒
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* MAIN */}
      {/* ================================================= */}

      <div className="container py-5">

        {/* ================================================= */}
        {/* SUCCESS */}
        {/* ================================================= */}

        {orderSuccess && (

          <div
            className="card mb-4"
            style={{
              border: "1px solid #b7e4c7",
              background: "#f3fff7",
            }}
          >

            <div className="card-body p-4 p-md-5">

              <div className="text-center mb-4">

                <div
                  style={{
                    fontSize: "65px",
                  }}
                >
                  🎉
                </div>

                <h3 className="fw-bold text-success">
                  Payment Successful!
                </h3>

                <p className="text-muted mb-0">
                  Your food order has been successfully
                  placed.
                </p>

              </div>

              <div className="row g-3 text-center">

                <div className="col-md-4">

                  <div className="p-3 rounded bg-white border">

                    <small className="text-muted">
                      Order ID
                    </small>

                    <div className="fw-bold mt-1">
                      {orderSuccess.orderId}
                    </div>

                  </div>

                </div>

                <div className="col-md-4">

                  <div className="p-3 rounded bg-white border">

                    <small className="text-muted">
                      Token Number
                    </small>

                    <div
                      className="fw-bold text-primary"
                      style={{
                        fontSize: "28px",
                      }}
                    >
                      #{orderSuccess.tokenNumber}
                    </div>

                  </div>

                </div>

                <div className="col-md-4">

                  <div className="p-3 rounded bg-white border">

                    <small className="text-muted">
                      Order Status
                    </small>

                    <div className="mt-2">
                      <span className="badge bg-warning text-dark px-3 py-2">
                        ⏳ {orderSuccess.status}
                      </span>
                    </div>

                  </div>

                </div>

              </div>

              <div className="text-center mt-4">

                <p className="text-muted">
                  Confirmation email has been sent to
                  your registered email address.
                </p>

                <Link
                  to="/my-orders"
                  className="btn btn-primary px-4"
                >
                  📦 Track My Order →
                </Link>

              </div>

            </div>

          </div>

        )}

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (

          <div className="alert alert-danger mb-4">

            <strong>
              ⚠️ Payment Error
            </strong>

            <div className="mt-1">
              {error}
            </div>

          </div>

        )}

        {/* ================================================= */}
        {/* EMPTY CART */}
        {/* ================================================= */}

        {cartItems.length === 0 &&
          !orderSuccess && (

            <div className="card">

              <div className="card-body text-center py-5">

                <div
                  style={{
                    fontSize: "75px",
                  }}
                >
                  🛒
                </div>

                <h3 className="fw-bold mt-3">
                  Your Cart is Empty
                </h3>

                <p className="text-muted">
                  You haven't added any food items yet.
                </p>

                <Link
                  to="/canteen-menu"
                  className="btn btn-primary btn-lg px-4"
                >
                  🍔 Browse Canteen Menu
                </Link>

              </div>

            </div>

          )}

        {/* ================================================= */}
        {/* CART */}
        {/* ================================================= */}

        {cartItems.length > 0 && (

          <div className="row g-4">

            {/* ================================================= */}
            {/* CART ITEMS */}
            {/* ================================================= */}

            <div className="col-lg-8">

              <div className="d-flex justify-content-between align-items-center mb-3">

                <div>

                  <h4 className="fw-bold mb-1">
                    Selected Items
                  </h4>

                  <p className="text-muted mb-0">
                    {cartItems.length} item type
                    {cartItems.length !== 1
                      ? "s"
                      : ""}
                  </p>

                </div>

                <Link
                  to="/canteen-menu"
                  className="btn btn-outline-primary btn-sm"
                >
                  + Add More
                </Link>

              </div>

              {cartItems.map((item) => (

                <div
                  className="card mb-3"
                  key={item._id}
                >

                  <div className="card-body p-3 p-md-4">

                    <div className="row align-items-center g-3">

                      {/* IMAGE */}

                      <div className="col-4 col-md-3">

                        <div
                          style={{
                            height: "110px",
                            borderRadius: "12px",
                            overflow: "hidden",
                            background: "#eef2f7",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >

                          {item.imageUrl ? (

                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                              }}
                            />

                          ) : (

                            <span
                              style={{
                                fontSize: "45px",
                              }}
                            >
                              🍽️
                            </span>

                          )}

                        </div>

                      </div>

                      {/* DETAILS */}

                      <div className="col-8 col-md-4">

                        <h5 className="fw-bold mb-1">
                          {item.name}
                        </h5>

                        <span className="badge bg-light text-primary">
                          {item.category}
                        </span>

                        <div className="mt-2">

                          <span className="fw-bold text-success">
                            ₹{item.price}
                          </span>

                          <small className="text-muted">
                            {" "}per item
                          </small>

                        </div>

                      </div>

                      {/* QUANTITY */}

                      <div className="col-6 col-md-3">

                        <small className="text-muted d-block mb-1">
                          Quantity
                        </small>

                        <div
                          className="d-inline-flex align-items-center"
                          style={{
                            border:
                              "1px solid #dce3ec",
                            borderRadius: "10px",
                            overflow: "hidden",
                          }}
                        >

                          <button
                            type="button"
                            className="btn btn-light"
                            style={{
                              borderRadius: 0,
                              fontSize: "20px",
                            }}
                            onClick={() =>
                              updateQuantity(
                                item._id,
                                -1
                              )
                            }
                            disabled={
                              placingOrder ||
                              paymentLoading
                            }
                          >
                            −
                          </button>

                          <span
                            className="fw-bold px-3"
                            style={{
                              minWidth: "40px",
                              textAlign: "center",
                            }}
                          >
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            className="btn btn-light"
                            style={{
                              borderRadius: 0,
                              fontSize: "20px",
                            }}
                            onClick={() =>
                              updateQuantity(
                                item._id,
                                1
                              )
                            }
                            disabled={
                              placingOrder ||
                              paymentLoading
                            }
                          >
                            +
                          </button>

                        </div>

                      </div>

                      {/* SUBTOTAL */}

                      <div className="col-6 col-md-2 text-md-end">

                        <small className="text-muted d-block">
                          Subtotal
                        </small>

                        <strong className="text-success fs-5">

                          ₹
                          {Number(item.price) *
                            Number(item.quantity)}

                        </strong>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger d-block mt-2 ms-md-auto"
                          onClick={() =>
                            removeItem(item._id)
                          }
                          disabled={
                            placingOrder ||
                            paymentLoading
                          }
                        >
                          🗑️ Remove
                        </button>

                      </div>

                    </div>

                  </div>

                </div>

              ))}

            </div>

            {/* ================================================= */}
            {/* ORDER SUMMARY */}
            {/* ================================================= */}

            <div className="col-lg-4">

              <div
                className="card"
                style={{
                  position: "sticky",
                  top: "90px",
                }}
              >

                <div className="card-body p-4">

                  <h4 className="fw-bold mb-4">
                    Order Summary
                  </h4>

                  <div className="d-flex justify-content-between mb-3">

                    <span className="text-muted">
                      Items
                    </span>

                    <strong>
                      {cartItems.reduce(
                        (total, item) =>
                          total +
                          Number(
                            item.quantity || 0
                          ),
                        0
                      )}
                    </strong>

                  </div>

                  <div className="d-flex justify-content-between mb-3">

                    <span className="text-muted">
                      Subtotal
                    </span>

                    <strong>
                      ₹{totalAmount}
                    </strong>

                  </div>

                  <div className="d-flex justify-content-between mb-3">

                    <span className="text-muted">
                      Payment
                    </span>

                    <span className="badge bg-success">
                      Online
                    </span>

                  </div>

                  <hr />

                  <div className="d-flex justify-content-between align-items-center mb-4">

                    <span className="fw-bold">
                      Total Amount
                    </span>

                    <span
                      className="fw-bold text-success"
                      style={{
                        fontSize: "25px",
                      }}
                    >
                      ₹{totalAmount}
                    </span>

                  </div>

                  {/* PAYMENT INFO */}

                  <div
                    className="p-3 rounded mb-3"
                    style={{
                      background: "#f4f8ff",
                      border:
                        "1px solid #dbe8ff",
                    }}
                  >

                    <div className="d-flex">

                      <div
                        style={{
                          fontSize: "25px",
                        }}
                      >
                        🔒
                      </div>

                      <div className="ms-2">

                        <strong>
                          Secure Payment
                        </strong>

                        <div className="small text-muted mt-1">
                          Powered by Razorpay Test Mode.
                        </div>

                      </div>

                    </div>

                  </div>

                  {/* PAY BUTTON */}

                  <button
                    type="button"
                    className="btn btn-success btn-lg w-100 fw-bold"
                    onClick={startPayment}
                    disabled={
                      placingOrder ||
                      paymentLoading
                    }
                  >

                    {placingOrder ||
                    paymentLoading ? (

                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                        ></span>

                        Processing Payment...
                      </>

                    ) : (

                      <>
                        💳 Pay ₹{totalAmount}
                      </>

                    )}

                  </button>

                  <small className="text-muted d-block text-center mt-3">
                    By continuing, you agree to place
                    this food order.
                  </small>

                </div>

              </div>

            </div>

          </div>

        )}

      </div>

    </div>
  );
};

export default Cart;