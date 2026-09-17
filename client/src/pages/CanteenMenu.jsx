import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

// =====================================================
// ADD TO CART
// =====================================================

const addToCart = (item) => {
  const existingCart =
    JSON.parse(localStorage.getItem("cart")) || [];

  const existingItem = existingCart.find(
    (cartItem) => cartItem._id === item._id
  );

  let updatedCart;

  if (existingItem) {
    updatedCart = existingCart.map((cartItem) =>
      cartItem._id === item._id
        ? {
            ...cartItem,
            quantity: cartItem.quantity + 1,
          }
        : cartItem
    );
  } else {
    updatedCart = [
      ...existingCart,
      {
        ...item,
        quantity: 1,
      },
    ];
  }

  localStorage.setItem(
    "cart",
    JSON.stringify(updatedCart)
  );

  // Update navbar cart badge immediately
  window.dispatchEvent(
    new Event("cartUpdated")
  );
};

// =====================================================
// CANTEEN MENU
// =====================================================

const CanteenMenu = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [addedItem, setAddedItem] = useState("");

  // =====================================================
  // FETCH FOOD ITEMS
  // =====================================================

  useEffect(() => {
    const fetchFoodItems = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/food"
        );

        setFoodItems(response.data);
      } catch (err) {
        console.error(
          "Error fetching food items:",
          err
        );

        setError(
          "Food menu load nahi ho saka."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFoodItems();
  }, []);

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
  // FILTER
  // =====================================================

  const availableItems = foodItems.filter(
    (item) => item.isAvailable
  );

  const filteredItems = availableItems.filter(
    (item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory =
        category === "All" ||
        item.category === category;

      return (
        matchesSearch &&
        matchesCategory
      );
    }
  );

  // =====================================================
  // ADD ITEM
  // =====================================================

  const handleAddToCart = (item) => {
    addToCart(item);

    setAddedItem(item._id);

    setTimeout(() => {
      setAddedItem("");
    }, 1200);
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div
        className="container py-5 text-center"
        style={{ minHeight: "70vh" }}
      >
        <div
          className="spinner-border text-primary"
          role="status"
        ></div>

        <h5 className="fw-bold mt-3">
          Loading menu...
        </h5>

        <p className="text-muted">
          Please wait while we fetch today's menu.
        </p>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div
        className="container py-5"
        style={{ minHeight: "70vh" }}
      >
        <div className="alert alert-danger text-center">
          <div
            style={{ fontSize: "45px" }}
          >
            ⚠️
          </div>

          <h5 className="fw-bold mt-2">
            Unable to Load Menu
          </h5>

          <p className="mb-0">
            {error}
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f8fc",
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
                🍴 TODAY'S MENU
              </span>

              <h1
                className="fw-bold mb-3"
                style={{
                  fontSize:
                    "clamp(32px, 5vw, 52px)",
                }}
              >
                Choose Your Favourite Food
              </h1>

              <p
                className="mb-0"
                style={{
                  maxWidth: "650px",
                  fontSize: "17px",
                  opacity: 0.9,
                  lineHeight: 1.7,
                }}
              >
                Browse the available canteen items,
                add your favourites to the cart and
                place your order online.
              </p>

            </div>

            <div className="col-lg-4 text-center mt-4 mt-lg-0">

              <div
                style={{
                  fontSize: "90px",
                  lineHeight: 1,
                }}
              >
                🍔
              </div>

              <div className="mt-3">
                <span className="badge bg-light text-primary px-3 py-2">
                  🎫 Smart Token System
                </span>
              </div>

            </div>

          </div>

        </div>
      </section>

      {/* ================================================= */}
      {/* MENU CONTENT */}
      {/* ================================================= */}

      <div className="container py-5">

        {/* ================================================= */}
        {/* TOP INFORMATION */}
        {/* ================================================= */}

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">

          <div>

            <h2 className="fw-bold mb-1">
              Canteen Menu
            </h2>

            <p className="text-muted mb-0">
              {availableItems.length} food items
              available
            </p>

          </div>

          <Link
            to="/cart"
            className="btn btn-primary"
          >
            🛒 View Cart
          </Link>

        </div>

        {/* ================================================= */}
        {/* SEARCH */}
        {/* ================================================= */}

        <div className="card p-3 mb-4">

          <div className="row g-3 align-items-center">

            <div className="col-lg-7">

              <div className="input-group">

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

            <div className="col-lg-5">

              <div className="d-flex flex-wrap gap-2">

                {categories.map((cat) => (

                  <button
                    key={cat}
                    type="button"
                    className={`btn btn-sm ${
                      category === cat
                        ? "btn-primary"
                        : "btn-outline-primary"
                    }`}
                    onClick={() =>
                      setCategory(cat)
                    }
                  >
                    {cat}
                  </button>

                ))}

              </div>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* FOOD GRID */}
        {/* ================================================= */}

        {filteredItems.length > 0 ? (

          <div className="row g-4">

            {filteredItems.map((item) => (

              <div
                className="col-sm-6 col-lg-4"
                key={item._id}
              >

                <div className="card h-100 overflow-hidden">

                  {/* FOOD IMAGE */}

                  <div
                    style={{
                      height: "220px",
                      background: "#eef2f7",
                      position: "relative",
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
                          transition:
                            "transform 0.4s ease",
                        }}
                      />

                    ) : (

                      <div
                        style={{
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "75px",
                        }}
                      >
                        🍽️
                      </div>

                    )}

                    {/* AVAILABLE BADGE */}

                    <span
                      className="badge bg-success"
                      style={{
                        position: "absolute",
                        top: "12px",
                        left: "12px",
                        padding: "7px 10px",
                      }}
                    >
                      ✓ Available
                    </span>

                  </div>

                  {/* FOOD BODY */}

                  <div className="card-body p-4 d-flex flex-column">

                    <div className="d-flex justify-content-between align-items-start gap-2">

                      <h5 className="fw-bold mb-1">
                        {item.name}
                      </h5>

                      <span
                        className="badge bg-light text-primary"
                        style={{
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.category}
                      </span>

                    </div>

                    <p
                      className="text-muted mt-2"
                      style={{
                        minHeight: "48px",
                        fontSize: "14px",
                      }}
                    >
                      {item.description ||
                        "Freshly prepared from our canteen."}
                    </p>

                    {/* PRICE + BUTTON */}

                    <div className="mt-auto pt-3 border-top">

                      <div className="d-flex justify-content-between align-items-center">

                        <div>

                          <small className="text-muted d-block">
                            Price
                          </small>

                          <span
                            className="fw-bold text-success"
                            style={{
                              fontSize: "22px",
                            }}
                          >
                            ₹{item.price}
                          </span>

                          <small className="text-muted">
                            {" "} / item
                          </small>

                        </div>

                        <button
                          type="button"
                          className={`btn ${
                            addedItem === item._id
                              ? "btn-success"
                              : "btn-primary"
                          }`}
                          onClick={() =>
                            handleAddToCart(item)
                          }
                        >
                          {addedItem === item._id
                            ? "✓ Added"
                            : "🛒 Add to Cart"}
                        </button>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            ))}

          </div>

        ) : (

          /* ================================================= */
          /* NO RESULTS */
          /* ================================================= */

          <div className="card text-center py-5">

            <div
              style={{
                fontSize: "65px",
              }}
            >
              🔎
            </div>

            <h4 className="fw-bold mt-3">
              No Food Items Found
            </h4>

            <p className="text-muted">
              Try another search or select a
              different category.
            </p>

            <button
              type="button"
              className="btn btn-outline-primary mx-auto"
              onClick={() => {
                setSearch("");
                setCategory("All");
              }}
            >
              Reset Filters
            </button>

          </div>

        )}

      </div>

      {/* ================================================= */}
      {/* ORDER INFORMATION */}
      {/* ================================================= */}

      <section className="container pb-5">

        <div
          className="card overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, #073b7a, #0d6efd)",
            color: "#fff",
          }}
        >

          <div className="card-body p-4 p-md-5">

            <div className="row align-items-center">

              <div className="col-lg-8">

                <span className="badge bg-warning text-dark mb-3">
                  🎫 SMART ORDERING
                </span>

                <h3 className="fw-bold">
                  Order Now & Skip The Queue
                </h3>

                <p
                  className="mb-0"
                  style={{ opacity: 0.9 }}
                >
                  Add food to your cart, make a secure
                  online payment and get your unique
                  token number instantly.
                </p>

              </div>

              <div className="col-lg-4 text-lg-end mt-4 mt-lg-0">

                <Link
                  to="/cart"
                  className="btn btn-warning btn-lg fw-bold px-4"
                >
                  🛒 Go To Cart →
                </Link>

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

          <div style={{ fontSize: "28px" }}>
            🍴
          </div>

          <h5 className="fw-bold mt-2">
            Smart Canteen
          </h5>

          <p className="text-white-50 mb-1">
            Pre-Order & Token Management System
          </p>

          <small className="text-white-50">
            © 2026 Smart Canteen System
          </small>

        </div>

      </footer>

    </div>
  );
};

export default CanteenMenu;