import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const Home = ({ userRole }) => {
  const [foodItems, setFoodItems] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [isLoggedIn, setIsLoggedIn] = useState(
    !!localStorage.getItem("token")
  );

  // =====================================================
  // CHECK LOGIN STATUS
  // =====================================================

  useEffect(() => {
    const checkLogin = () => {
      setIsLoggedIn(!!localStorage.getItem("token"));
    };

    checkLogin();

    window.addEventListener("storage", checkLogin);

    return () => {
      window.removeEventListener("storage", checkLogin);
    };
  }, []);

  // =====================================================
  // FETCH FOOD ITEMS
  // =====================================================

  useEffect(() => {
    if (
      isLoggedIn &&
      (userRole === "staff" || userRole === "admin")
    ) {
      setFoodItems([]);
      return;
    }

    const fetchFoodItems = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/food"
        );

        const availableItems = response.data.filter(
          (item) => item.isAvailable
        );

        setFoodItems(availableItems);
      } catch (error) {
        console.error("Error fetching food items:", error);
      }
    };

    fetchFoodItems();
  }, [isLoggedIn, userRole]);

  // =====================================================
  // ADD TO CART
  // =====================================================

  const addToCart = (item) => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Please login first to order food.");
      return;
    }

    const existingCart =
      JSON.parse(localStorage.getItem("cart")) || [];

    const existingItemIndex = existingCart.findIndex(
      (cartItem) => cartItem._id === item._id
    );

    if (existingItemIndex !== -1) {
      existingCart[existingItemIndex].quantity += 1;
    } else {
      existingCart.push({
        ...item,
        quantity: 1,
      });
    }

    localStorage.setItem(
      "cart",
      JSON.stringify(existingCart)
    );

    window.dispatchEvent(new Event("cartUpdated"));

    alert(`${item.name} added to cart!`);
  };

  // =====================================================
  // CATEGORIES
  // =====================================================

  const categories = [
    "All",
    "Breakfast",
    "Lunch",
    "Snacks",
    "Beverages",
    "Fast Food",
  ];

  // =====================================================
  // FILTER FOOD
  // =====================================================

  const filteredItems = foodItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      category === "All" || item.category === category;

    return matchesSearch && matchesCategory;
  });

  // =====================================================
  // FOOD SECTION
  // =====================================================

  const showFoodSection =
    !isLoggedIn || userRole === "student";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f8fc",
      }}
    >

      {/* ================================================= */}
      {/* HERO SECTION */}
      {/* ================================================= */}

      <section
        className="hero-section"
        style={{
          borderRadius: 0,
          marginBottom: 0,
          minHeight: "520px",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div className="container py-5">

          <div className="row align-items-center">

            {/* LEFT */}

            <div className="col-lg-7">

              <div className="mb-3">
                <span className="badge bg-warning text-dark px-3 py-2">
                  ⚡ SMART CANTEEN
                </span>
              </div>

              <h1
                className="fw-bold display-4 text-white"
                style={{
                  lineHeight: 1.1,
                  maxWidth: "700px",
                }}
              >
                Order Food.
                <br />
                Skip The Queue. 🍔
              </h1>

              <p
                className="mt-4 mb-4 text-white"
                style={{
                  maxWidth: "650px",
                  fontSize: "18px",
                  lineHeight: 1.7,
                  opacity: 0.9,
                }}
              >
                A smart digital canteen experience for
                students. Pre-order your favorite food,
                make a secure online payment and collect
                your order using your unique token number.
              </p>

              {/* HERO BUTTONS */}

              <div className="d-flex flex-wrap gap-3">

                {!isLoggedIn && (
                  <>
                    <Link
                      to="/login/student"
                      className="btn btn-warning btn-lg fw-bold px-4"
                    >
                      🔐 Login & Order
                    </Link>

                    <Link
                      to="/register/student"
                      className="btn btn-outline-light btn-lg px-4"
                    >
                      📝 Create Account
                    </Link>
                  </>
                )}

                {isLoggedIn && userRole === "student" && (
                  <>
                    <Link
                      to="/canteen-menu"
                      className="btn btn-warning btn-lg fw-bold px-4"
                    >
                      🍔 Order Food
                    </Link>

                    <Link
                      to="/my-orders"
                      className="btn btn-outline-light btn-lg px-4"
                    >
                      📦 Track Orders
                    </Link>
                  </>
                )}

                {isLoggedIn && userRole === "staff" && (
                  <Link
                    to="/staff/dashboard"
                    className="btn btn-warning btn-lg fw-bold px-4"
                  >
                    👨‍🍳 Open Staff Dashboard
                  </Link>
                )}

                {isLoggedIn && userRole === "admin" && (
                  <Link
                    to="/admin/dashboard"
                    className="btn btn-warning btn-lg fw-bold px-4"
                  >
                    📊 Open Admin Dashboard
                  </Link>
                )}

              </div>

            </div>

            {/* RIGHT */}

            <div className="col-lg-5 text-center mt-5 mt-lg-0">

              <div
                style={{
                  background: "rgba(255,255,255,0.10)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "30px",
                  padding: "45px 25px",
                  backdropFilter: "blur(8px)",
                  boxShadow:
                    "0 20px 50px rgba(0,0,0,0.15)",
                }}
              >

                <div
                  style={{
                    fontSize: "120px",
                    lineHeight: 1,
                  }}
                >
                  🍔
                </div>

                <h4 className="fw-bold text-white mt-4">
                  Your Token. Your Turn.
                </h4>

                <p
                  className="text-white mb-0"
                  style={{ opacity: 0.8 }}
                >
                  Order smart. Wait less.
                </p>

              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ================================================= */}
      {/* QUICK STATS */}
      {/* ================================================= */}

      <section
        className="container"
        style={{
          marginTop: "-45px",
          position: "relative",
          zIndex: 2,
        }}
      >

        <div className="row g-3">

          <div className="col-6 col-lg-3">
            <div className="card text-center p-3 h-100">
              <div style={{ fontSize: "30px" }}>🍔</div>
              <h6 className="fw-bold mt-2 mb-1">
                Fresh Food
              </h6>
              <small className="text-muted">
                Multiple categories
              </small>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div className="card text-center p-3 h-100">
              <div style={{ fontSize: "30px" }}>🎫</div>
              <h6 className="fw-bold mt-2 mb-1">
                Smart Token
              </h6>
              <small className="text-muted">
                Automatic token generation
              </small>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div className="card text-center p-3 h-100">
              <div style={{ fontSize: "30px" }}>💳</div>
              <h6 className="fw-bold mt-2 mb-1">
                Online Payment
              </h6>
              <small className="text-muted">
                Secure Razorpay checkout
              </small>
            </div>
          </div>

          <div className="col-6 col-lg-3">
            <div className="card text-center p-3 h-100">
              <div style={{ fontSize: "30px" }}>🔔</div>
              <h6 className="fw-bold mt-2 mb-1">
                Live Updates
              </h6>
              <small className="text-muted">
                Real-time order status
              </small>
            </div>
          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* FEATURES */}
      {/* ================================================= */}

      <section className="container py-5">

        <div className="text-center mb-5">

          <span className="badge bg-primary px-3 py-2">
            WHY SMART CANTEEN?
          </span>

          <h2 className="fw-bold mt-3">
            A Smarter Way To Order Food
          </h2>

          <p className="text-muted">
            Everything you need for a faster and easier
            canteen experience.
          </p>

        </div>

        <div className="row g-4">

          <div className="col-md-4">
            <div className="card h-100 text-center p-4">

              <div style={{ fontSize: "48px" }}>
                📱
              </div>

              <h5 className="fw-bold mt-3">
                Easy Pre-Order
              </h5>

              <p className="text-muted mb-0">
                Browse the canteen menu and place your
                order before reaching the counter.
              </p>

            </div>
          </div>

          <div className="col-md-4">
            <div className="card h-100 text-center p-4">

              <div style={{ fontSize: "48px" }}>
                🎫
              </div>

              <h5 className="fw-bold mt-3">
                Smart Token System
              </h5>

              <p className="text-muted mb-0">
                Every successful order receives a unique
                token number for easy collection.
              </p>

            </div>
          </div>

          <div className="col-md-4">
            <div className="card h-100 text-center p-4">

              <div style={{ fontSize: "48px" }}>
                🔔
              </div>

              <h5 className="fw-bold mt-3">
                Real-Time Tracking
              </h5>

              <p className="text-muted mb-0">
                Receive instant updates when your order
                moves from Pending to Completed.
              </p>

            </div>
          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* POPULAR MENU */}
      {/* ================================================= */}

      {showFoodSection && (
        <section className="container pb-5">

          <div className="text-center mb-4">

            <span className="badge bg-primary px-3 py-2">
              OUR MENU
            </span>

            <h2 className="fw-bold mt-3">
              Popular Food Items 🍴
            </h2>

            <p className="text-muted">
              Choose your favorite food and add it to
              your cart.
            </p>

          </div>

          {/* SEARCH */}

          <div className="row justify-content-center mb-4">

            <div className="col-md-7">

              <div className="input-group input-group-lg">

                <span className="input-group-text bg-white">
                  🔎
                </span>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Search food items..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />

              </div>

            </div>

          </div>

          {/* CATEGORIES */}

          <div className="d-flex justify-content-center flex-wrap gap-2 mb-5">

            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`btn ${
                  category === cat
                    ? "btn-primary"
                    : "btn-outline-primary"
                }`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}

          </div>

          {/* FOOD CARDS */}

          <div className="row g-4">

            {filteredItems
              .slice(0, 6)
              .map((item) => (

                <div
                  className="col-sm-6 col-lg-4"
                  key={item._id}
                >

                  <div className="card h-100 overflow-hidden">

                    {/* IMAGE */}

                    <div
                      style={{
                        height: "200px",
                        background: "#eef2f7",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
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
                        <span style={{ fontSize: "75px" }}>
                          🍽️
                        </span>
                      )}

                    </div>

                    {/* BODY */}

                    <div className="card-body p-4">

                      <div className="d-flex justify-content-between align-items-start gap-2">

                        <h5 className="fw-bold mb-2">
                          {item.name}
                        </h5>

                        <span className="badge bg-light text-dark">
                          {item.category}
                        </span>

                      </div>

                      <p
                        className="text-muted"
                        style={{
                          minHeight: "48px",
                        }}
                      >
                        {item.description ||
                          "Freshly prepared from our canteen."}
                      </p>

                      <div className="d-flex justify-content-between align-items-center mt-3">

                        <div>
                          <small className="text-muted d-block">
                            Price
                          </small>

                          <span className="text-success fw-bold fs-5">
                            ₹{item.price}
                          </span>
                        </div>

                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() =>
                            addToCart(item)
                          }
                        >
                          🛒 Add
                        </button>

                      </div>

                    </div>

                  </div>

                </div>

              ))}

          </div>

          {/* NO FOOD */}

          {filteredItems.length === 0 && (

            <div className="text-center py-5">

              <div style={{ fontSize: "60px" }}>
                🍽️
              </div>

              <h5 className="mt-3 fw-bold">
                No food items found
              </h5>

              <p className="text-muted">
                Try another search or category.
              </p>

            </div>

          )}

          {/* FULL MENU */}

          {foodItems.length > 6 && (

            <div className="text-center mt-5">

              <Link
                to="/canteen-menu"
                className="btn btn-outline-primary btn-lg px-4"
              >
                View Full Menu →
              </Link>

            </div>

          )}

        </section>
      )}

      {/* ================================================= */}
      {/* STAFF */}
      {/* ================================================= */}

      {isLoggedIn && userRole === "staff" && (

        <section className="container py-5">

          <div className="card text-center p-5">

            <div style={{ fontSize: "65px" }}>
              👨‍🍳
            </div>

            <h3 className="fw-bold mt-3">
              Staff Order Management
            </h3>

            <p className="text-muted">
              Manage incoming student orders, update
              order status and control the live token queue.
            </p>

            <div>
              <Link
                to="/staff/dashboard"
                className="btn btn-primary btn-lg px-4"
              >
                📦 Open Orders Dashboard →
              </Link>
            </div>

          </div>

        </section>

      )}

      {/* ================================================= */}
      {/* ADMIN */}
      {/* ================================================= */}

      {isLoggedIn && userRole === "admin" && (

        <section className="container py-5">

          <div className="card text-center p-5">

            <div style={{ fontSize: "65px" }}>
              📊
            </div>

            <h3 className="fw-bold mt-3">
              Admin Control Center
            </h3>

            <p className="text-muted">
              Manage food items, orders, staff and the
              Smart Canteen system from one dashboard.
            </p>

            <div>
              <Link
                to="/admin/dashboard"
                className="btn btn-primary btn-lg px-4"
              >
                📊 Open Admin Dashboard →
              </Link>
            </div>

          </div>

        </section>

      )}

      {/* ================================================= */}
      {/* HOW IT WORKS */}
      {/* ================================================= */}

      <section className="bg-white py-5">

        <div className="container">

          <div className="text-center mb-5">

            <span className="badge bg-success px-3 py-2">
              HOW IT WORKS
            </span>

            <h2 className="fw-bold mt-3">
              Order in 4 Simple Steps
            </h2>

            <p className="text-muted">
              From selecting food to collecting your order.
            </p>

          </div>

          <div className="row g-4">

            <div className="col-md-3">
              <div className="text-center h-100">

                <div
                  style={{
                    fontSize: "45px",
                  }}
                >
                  1️⃣
                </div>

                <h5 className="fw-bold mt-3">
                  Select Food
                </h5>

                <p className="text-muted">
                  Browse the menu and select your
                  favorite food.
                </p>

              </div>
            </div>

            <div className="col-md-3">
              <div className="text-center h-100">

                <div
                  style={{
                    fontSize: "45px",
                  }}
                >
                  2️⃣
                </div>

                <h5 className="fw-bold mt-3">
                  Add to Cart
                </h5>

                <p className="text-muted">
                  Select quantities and review your
                  cart.
                </p>

              </div>
            </div>

            <div className="col-md-3">
              <div className="text-center h-100">

                <div
                  style={{
                    fontSize: "45px",
                  }}
                >
                  3️⃣
                </div>

                <h5 className="fw-bold mt-3">
                  Pay & Get Token
                </h5>

                <p className="text-muted">
                  Complete online payment and receive
                  your token.
                </p>

              </div>
            </div>

            <div className="col-md-3">
              <div className="text-center h-100">

                <div
                  style={{
                    fontSize: "45px",
                  }}
                >
                  4️⃣
                </div>

                <h5 className="fw-bold mt-3">
                  Collect Food
                </h5>

                <p className="text-muted">
                  Collect your order when the status
                  becomes Ready.
                </p>

              </div>
            </div>

          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* CTA */}
      {/* ================================================= */}

      <section
        className="py-5 text-center text-white"
        style={{
          background:
            "linear-gradient(135deg, #198754, #20c997)",
        }}
      >

        <div className="container">

          <div style={{ fontSize: "45px" }}>
            🍔
          </div>

          <h2 className="fw-bold mt-2">
            Hungry? Let's Order!
          </h2>

          <p className="mb-4">
            Skip the queue and enjoy a smarter canteen
            experience.
          </p>

          {!isLoggedIn && (
            <div className="d-flex justify-content-center gap-3 flex-wrap">

              <Link
                to="/login/student"
                className="btn btn-light btn-lg px-5 fw-bold"
              >
                🔐 Login
              </Link>

              <Link
                to="/register/student"
                className="btn btn-outline-light btn-lg px-5 fw-bold"
              >
                📝 Register
              </Link>

            </div>
          )}

          {isLoggedIn && userRole === "student" && (
            <Link
              to="/canteen-menu"
              className="btn btn-light btn-lg px-5 fw-bold"
            >
              🍔 Start Ordering →
            </Link>
          )}

          {isLoggedIn && userRole === "staff" && (
            <Link
              to="/staff/dashboard"
              className="btn btn-light btn-lg px-5 fw-bold"
            >
              👨‍🍳 Manage Orders →
            </Link>
          )}

          {isLoggedIn && userRole === "admin" && (
            <Link
              to="/admin/dashboard"
              className="btn btn-light btn-lg px-5 fw-bold"
            >
              📊 Admin Dashboard →
            </Link>
          )}

        </div>

      </section>

      {/* ================================================= */}
      {/* DEVELOPER / PROJECT INFORMATION */}
      {/* ================================================= */}

      <section
        className="py-5"
        style={{
          background: "#eef3f9",
        }}
      >

        <div className="container">

          <div className="row justify-content-center">

            <div className="col-lg-7">

              <div className="card text-center p-4">

                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    margin: "0 auto",
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #073b7a, #0d6efd)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "30px",
                  }}
                >
                  👨‍💻
                </div>

                <span className="badge bg-primary mx-auto mt-3 px-3 py-2">
                  PROJECT DEVELOPER
                </span>

                <h3 className="fw-bold mt-3 mb-1">
                  Mohd Altamash
                </h3>

                <p className="text-muted mb-4">
                  Developer & Creator of Smart Canteen
                </p>

                <div className="row g-3">

                  <div className="col-md-6">

                    <div
                      className="p-3 rounded"
                      style={{
                        background: "#f7f9fc",
                      }}
                    >
                      <div style={{ fontSize: "24px" }}>
                        📧
                      </div>

                      <small className="text-muted">
                        Email
                      </small>

                      <div className="fw-semibold">
                        altamasha607@gmail.com
                      </div>
                    </div>

                  </div>

                  <div className="col-md-6">

                    <div
                      className="p-3 rounded"
                      style={{
                        background: "#f7f9fc",
                      }}
                    >
                      <div style={{ fontSize: "24px" }}>
                        📱
                      </div>

                      <small className="text-muted">
                        Phone
                      </small>

                      <div className="fw-semibold">
                        +91 9027693960
                      </div>
                    </div>

                  </div>

                </div>

                <hr className="my-4" />

                <p className="text-muted small mb-0">
                  Smart Canteen Pre-Order & Token
                  Management System
                </p>

                <p className="text-muted small mb-0">
                  Developed as a college project using
                  modern web technologies.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ================================================= */}
      {/* FOOTER */}
      {/* ================================================= */}

      <footer className="py-4">

        <div className="container text-center">

          <div
            style={{
              fontSize: "28px",
            }}
          >
            🍴
          </div>

          <h5 className="fw-bold mt-2">
            Smart Canteen
          </h5>

          <p className="text-white-50 mb-2">
            Pre-Order & Token Management System
          </p>

          <div
            className="small text-white-50"
            style={{
              maxWidth: "650px",
              margin: "0 auto",
            }}
          >
            A digital solution designed to simplify
            campus canteen ordering, payment and
            token-based food collection.
          </div>

          <hr
            className="my-3"
            style={{
              borderColor: "rgba(255,255,255,0.15)",
            }}
          />

          <small className="text-white-50">
            © 2026 Smart Canteen System • Developed by
            Mohd Altamash
          </small>

        </div>

      </footer>

    </div>
  );
};

export default Home;