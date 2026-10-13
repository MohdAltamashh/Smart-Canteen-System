// client/src/pages/CanteenMenu.jsx

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";
import { Link } from "react-router-dom";

// =====================================================
// CONFIGURATION
// =====================================================

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const CATEGORIES = [
  "All",
  "Breakfast",
  "Lunch",
  "Snacks",
  "Beverages",
  "Fast Food",
];

// =====================================================
// IMAGE HELPER
// =====================================================

const getImageUrl = (imageUrl) => {
  if (!imageUrl) return "";

  if (
    imageUrl.startsWith("http://") ||
    imageUrl.startsWith("https://")
  ) {
    return imageUrl;
  }

  if (imageUrl.startsWith("/uploads/food/")) {
    return `${API_URL}/food${imageUrl}`;
  }

  return `${API_URL}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
};

// =====================================================
// FOOD COURT ID HELPER
// =====================================================

const getFoodCourtId = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }

  return String(value);
};

// =====================================================
// CART STORAGE HELPERS
// =====================================================

const getCart = () => {
  try {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    return Array.isArray(cart) ? cart : [];
  } catch (error) {
    console.error("Cart loading error:", error);
    return [];
  }
};

const saveCart = (cart) => {
  localStorage.setItem("cart", JSON.stringify(cart));

  window.dispatchEvent(new Event("cartUpdated"));
};

// =====================================================
// CART FOOD COURT DETECTION
// =====================================================

const getCartFoodCourtId = (cart) => {
  if (!Array.isArray(cart) || cart.length === 0) {
    return "";
  }

  const firstItem = cart[0];

  return getFoodCourtId(
    firstItem.foodCourtId ||
      firstItem.foodCourt ||
      firstItem.courtId
  );
};

// =====================================================
// ADD ITEM TO CART
// =====================================================

const addToCart = (item, selectedCourt) => {
  const existingCart = getCart();

  const courtId = String(selectedCourt._id);

  const existingItem = existingCart.find(
    (cartItem) => String(cartItem._id) === String(item._id)
  );

  let updatedCart;

  if (existingItem) {
    updatedCart = existingCart.map((cartItem) =>
      String(cartItem._id) === String(item._id)
        ? {
            ...cartItem,
            foodCourt: courtId,
            foodCourtId: courtId,
            foodCourtName: selectedCourt.name,
            quantity: Number(cartItem.quantity || 0) + 1,
          }
        : cartItem
    );
  } else {
    updatedCart = [
      ...existingCart,
      {
        ...item,
        foodCourt: courtId,
        foodCourtId: courtId,
        foodCourtName: selectedCourt.name,
        quantity: 1,
      },
    ];
  }

  saveCart(updatedCart);
};

// =====================================================
// SMALL REUSABLE ICON
// =====================================================

const FoodIcon = ({ type = "food" }) => {
  const icons = {
    food: "🍽️",
    burger: "🍔",
    drinks: "🥤",
    snacks: "🥟",
    coffee: "☕",
    dessert: "🍰",
    token: "🎟️",
  };

  return <span aria-hidden="true">{icons[type] || icons.food}</span>;
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const CanteenMenu = () => {
  const [foodCourts, setFoodCourts] = useState([]);
  const [foodItems, setFoodItems] = useState([]);

  const [selectedCourt, setSelectedCourt] = useState(null);

  const [loadingCourts, setLoadingCourts] = useState(true);
  const [loadingMenu, setLoadingMenu] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const [addedItem, setAddedItem] = useState("");

  // =====================================================
  // CART CONFIRMATION MODAL
  // =====================================================

  const [showCartModal, setShowCartModal] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  const [pendingCourt, setPendingCourt] = useState(null);

  const [cartCount, setCartCount] = useState(0);

  // =====================================================
  // REFRESH CART COUNT
  // =====================================================

  const refreshCartCount = useCallback(() => {
    const cart = getCart();

    const count = cart.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    );

    setCartCount(count);
  }, []);

  useEffect(() => {
    refreshCartCount();

    window.addEventListener("cartUpdated", refreshCartCount);

    window.addEventListener("storage", refreshCartCount);

    return () => {
      window.removeEventListener("cartUpdated", refreshCartCount);

      window.removeEventListener("storage", refreshCartCount);
    };
  }, [refreshCartCount]);

  // =====================================================
  // LOAD FOOD COURTS AND ITEM COUNTS
  // =====================================================

  const loadFoodCourts = useCallback(async () => {
    setLoadingCourts(true);
    setError("");

    try {
      const [courtsResponse, foodResponse] = await Promise.all([
        axios.get(`${API_URL}/public/food-courts`),
        axios.get(`${API_URL}/food`),
      ]);

      const allFoodItems = Array.isArray(foodResponse.data)
        ? foodResponse.data
        : [];

      const activeCourts = Array.isArray(courtsResponse.data)
        ? courtsResponse.data.filter(
            (court) => court.isActive !== false
          )
        : [];

      const courtsWithCounts = activeCourts.map((court) => {
        const availableItems = allFoodItems.filter((item) => {
          const itemCourtId = getFoodCourtId(item.foodCourt);

          return (
            itemCourtId === String(court._id) &&
            item.isAvailable === true
          );
        });

        return {
          ...court,
          _id: String(court._id),
          itemCount: availableItems.length,
        };
      });

      setFoodCourts(courtsWithCounts);
    } catch (err) {
      console.error("Food Court loading error:", err);

      setError(
        err.response?.data?.message ||
          "Food Courts load nahi ho paaye. Please try again."
      );
    } finally {
      setLoadingCourts(false);
    }
  }, []);

  useEffect(() => {
    loadFoodCourts();
  }, [loadFoodCourts]);

  // =====================================================
  // LOAD SELECTED FOOD COURT MENU
  // =====================================================

  useEffect(() => {
    if (!selectedCourt?._id) {
      setFoodItems([]);
      return undefined;
    }

    let cancelled = false;

    const loadMenu = async () => {
      try {
        setLoadingMenu(true);
        setError("");
        setFoodItems([]);

        const response = await axios.get(`${API_URL}/food`, {
          params: {
            foodCourt: selectedCourt._id,
          },
        });

        if (!cancelled) {
          setFoodItems(
            Array.isArray(response.data) ? response.data : []
          );
        }
      } catch (err) {
        console.error("Selected menu loading error:", err);

        if (!cancelled) {
          setFoodItems([]);

          setError(
            err.response?.data?.message ||
              "Food menu load nahi ho saka. Dobara try karein."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingMenu(false);
        }
      }
    };

    loadMenu();

    return () => {
      cancelled = true;
    };
  }, [selectedCourt]);

  // =====================================================
  // FILTER FOOD
  // =====================================================

  const availableItems = useMemo(
    () => foodItems.filter((item) => item.isAvailable === true),
    [foodItems]
  );

  const filteredItems = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return availableItems.filter((item) => {
      const name = String(item.name || "").toLowerCase();

      const description = String(
        item.description || ""
      ).toLowerCase();

      const matchesSearch =
        name.includes(searchText) ||
        description.includes(searchText);

      const matchesCategory =
        category === "All" || item.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [availableItems, search, category]);

  // =====================================================
  // SHOW ADDED FEEDBACK
  // =====================================================

  const showAddedFeedback = (itemId) => {
    setAddedItem(itemId);

    window.setTimeout(() => {
      setAddedItem("");
    }, 1200);
  };

  // =====================================================
  // ADD ITEM TO CART
  // =====================================================

  const handleAddToCart = (item) => {
    if (!selectedCourt?._id) {
      alert("Please select a Food Court first.");
      return;
    }

    const currentCart = getCart();

    const currentCartCourtId = getCartFoodCourtId(currentCart);

    const selectedCourtId = String(selectedCourt._id);

    // First item or same food court:
    // Add normally without showing a popup.
    if (
      currentCart.length === 0 ||
      !currentCartCourtId ||
      currentCartCourtId === selectedCourtId
    ) {
      addToCart(item, selectedCourt);
      showAddedFeedback(item._id);
      return;
    }

    // Another food court already exists in the cart.
    // Ask the user before replacing the cart.
    setPendingItem(item);
    setPendingCourt(selectedCourt);
    setShowCartModal(true);
  };

  // =====================================================
  // CLEAR OLD CART AND ADD NEW FOOD COURT ITEM
  // =====================================================

  const handleClearCartAndAdd = () => {
    if (!pendingItem || !pendingCourt) {
      setShowCartModal(false);
      return;
    }

    const item = pendingItem;
    const court = pendingCourt;

    // Clear previous food court's items first.
    saveCart([]);

    // Then add the newly selected food item.
    addToCart(item, court);

    setShowCartModal(false);
    setPendingItem(null);
    setPendingCourt(null);

    showAddedFeedback(item._id);
  };

  // =====================================================
  // KEEP CURRENT CART
  // =====================================================

  const handleKeepCurrentCart = () => {
    setShowCartModal(false);
    setPendingItem(null);
    setPendingCourt(null);
  };

  // =====================================================
  // NAVIGATION / RESET
  // =====================================================

  const openFoodCourt = (court) => {
    setSearch("");
    setCategory("All");
    setError("");
    setSelectedCourt(court);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const backToFoodCourts = () => {
    setSelectedCourt(null);
    setFoodItems([]);
    setSearch("");
    setCategory("All");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const resetFilters = () => {
    setSearch("");
    setCategory("All");
  };

  // =====================================================
  // SHARED DESIGN TOKENS
  // =====================================================

  const pageStyle = {
    minHeight: "100vh",
    background: "#f7f8fc",
    color: "#172033",
    fontFamily:
      "'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
    overflowX: "hidden",
  };

  const primaryButton = {
    border: "none",
    borderRadius: "12px",
    padding: "12px 18px",
    background: "linear-gradient(135deg, #ff9d42, #ff7139)",
    color: "#ffffff",
    fontWeight: 800,
    cursor: "pointer",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  };

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div style={pageStyle}>
      <style>{`
        .cb-court-card {
          background: #ffffff;
          border: 1px solid #edf0f6;
          border-radius: 22px;
          overflow: hidden;
          height: 100%;
          box-shadow: 0 8px 28px rgba(20, 35, 70, 0.045);
          transition: transform .22s ease, box-shadow .22s ease, border-color .22s ease;
        }

        .cb-court-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 18px 42px rgba(20, 35, 70, 0.11);
          border-color: #ffd6b4;
        }

        .cb-food-card {
          background: #fff;
          border: 1px solid #edf0f6;
          border-radius: 22px;
          height: 100%;
          overflow: hidden;
          box-shadow: 0 8px 28px rgba(20, 35, 70, .045);
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .cb-food-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 36px rgba(20, 35, 70, .10);
        }

        .cb-category {
          border: 1px solid #e5e9f2;
          background: #fff;
          color: #566176;
          padding: 9px 15px;
          border-radius: 999px;
          white-space: nowrap;
          font-size: 13px;
          font-weight: 750;
          transition: all .2s ease;
        }

        .cb-category.active {
          color: #fff;
          background: #172744;
          border-color: #172744;
          box-shadow: 0 5px 14px rgba(23, 39, 68, .16);
        }

        .cb-category:hover {
          border-color: #ffab68;
        }

        .cb-search {
          width: 100%;
          border: 1px solid #e5e9f2;
          border-radius: 14px;
          padding: 14px 16px;
          background: #fff;
          color: #172033;
          outline: none;
          font-size: 14px;
        }

        .cb-search:focus {
          border-color: #ffab68;
          box-shadow: 0 0 0 4px rgba(255, 157, 66, .12);
        }

        .cb-food-image {
          height: 220px;
          width: 100%;
          object-fit: cover;
          display: block;
          transition: transform .35s ease;
        }

        .cb-food-card:hover .cb-food-image {
          transform: scale(1.035);
        }

        .cb-footer-link {
          color: #aebbd1;
          text-decoration: none;
          font-size: 14px;
          transition: color .2s ease;
        }

        .cb-footer-link:hover {
          color: #ffbd83;
        }

        .cb-primary-btn {
          border: none;
          border-radius: 12px;
          padding: 11px 15px;
          background: linear-gradient(135deg, #ff9d42, #ff7139);
          color: #fff;
          font-weight: 800;
          transition: transform .2s ease, box-shadow .2s ease;
          cursor: pointer;
        }

        .cb-primary-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 18px rgba(255, 113, 57, .22);
        }

        .cb-outline-btn {
          border: 1px solid #dfe5ef;
          border-radius: 12px;
          background: #fff;
          color: #29374f;
          padding: 10px 14px;
          font-weight: 750;
          cursor: pointer;
        }

        .cb-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
          background: rgba(8, 15, 30, .68);
          backdrop-filter: blur(5px);
        }

        .cb-cart-modal {
          width: 100%;
          max-width: 455px;
          border-radius: 24px;
          background: #fff;
          padding: 28px;
          box-shadow: 0 28px 90px rgba(0, 0, 0, .28);
          animation: cbModalIn .2s ease-out;
        }

        @keyframes cbModalIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .cb-modal-action {
          width: 100%;
          border: none;
          border-radius: 12px;
          padding: 13px 14px;
          font-weight: 850;
          cursor: pointer;
          transition: transform .15s ease, box-shadow .15s ease;
        }

        .cb-modal-action:hover {
          transform: translateY(-1px);
        }

        .cb-modal-confirm {
          background: linear-gradient(135deg, #ff9d42, #ff7139);
          color: #fff;
          box-shadow: 0 7px 18px rgba(255, 113, 57, .20);
        }

        .cb-modal-cancel {
          border: 1px solid #e0e6ef;
          background: #fff;
          color: #29374f;
        }

        @media (max-width: 576px) {
          .cb-food-image {
            height: 190px;
          }

          .cb-hero-title {
            font-size: 34px !important;
          }

          .cb-section {
            padding-left: 18px !important;
            padding-right: 18px !important;
          }

          .cb-cart-modal {
            padding: 23px;
          }
        }
      `}</style>

      {/* =====================================================
          COMPACT HERO
      ===================================================== */}

      <header
        style={{
          position: "relative",
          background:
            "radial-gradient(circle at 86% 10%, rgba(255,173,92,.18), transparent 24%), linear-gradient(120deg, #101a30 0%, #172b4b 60%, #27335a 100%)",
          color: "#fff",
          overflow: "hidden",
        }}
      >
        <div
          className="cb-section"
          style={{
            maxWidth: "1240px",
            margin: "0 auto",
            padding: "34px 28px 38px",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              borderRadius: "999px",
              padding: "7px 12px",
              background: "rgba(255,255,255,.09)",
              border: "1px solid rgba(255,255,255,.12)",
              color: "#ffd3a8",
              fontSize: "11px",
              fontWeight: 850,
              letterSpacing: "1.4px",
              marginBottom: "17px",
            }}
          >
            <span>✦</span> CAMPUS BITE · FOOD & PICKUP
          </div>

          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <h1
                className="cb-hero-title"
                style={{
                  fontSize: "clamp(32px, 4vw, 47px)",
                  fontWeight: 900,
                  letterSpacing: "-1.6px",
                  lineHeight: 1.1,
                  marginBottom: "14px",
                }}
              >
                Great food.
                <br />
                <span style={{ color: "#ffbd83" }}>
                  Better campus days.
                </span>
              </h1>

              <p
                style={{
                  color: "#c5cede",
                  maxWidth: "570px",
                  fontSize: "15px",
                  lineHeight: 1.8,
                  marginBottom: "19px",
                }}
              >
                Explore campus favourites, order ahead and spend less
                time waiting. Your next favourite bite is just a few
                clicks away.
              </p>

              <div className="d-flex flex-wrap gap-2">
                {[
                  ["✦", "Campus favourites"],
                  ["⚡", "Easy ordering"],
                  ["🎟️", "Smart token"],
                ].map(([icon, label]) => (
                  <span
                    key={label}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      borderRadius: "999px",
                      padding: "8px 11px",
                      background: "rgba(255,255,255,.09)",
                      color: "#edf1f8",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    {icon} {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="col-lg-4 d-none d-lg-flex justify-content-end">
              <div
                style={{
                  width: "164px",
                  height: "164px",
                  borderRadius: "42px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "84px",
                  background:
                    "linear-gradient(145deg, rgba(255,255,255,.15), rgba(255,255,255,.04))",
                  border: "1px solid rgba(255,255,255,.12)",
                  transform: "rotate(5deg)",
                  boxShadow: "0 22px 50px rgba(0,0,0,.15)",
                }}
              >
                🍔
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main
        className="cb-section"
        style={{
          maxWidth: "1240px",
          margin: "0 auto",
          padding: "42px 28px 58px",
        }}
      >
        {/* =====================================================
            FOOD COURT SELECTION
        ===================================================== */}

        {!selectedCourt && (
          <>
            <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
              <div>
                <div
                  style={{
                    color: "#e47f43",
                    fontWeight: 850,
                    fontSize: "11px",
                    letterSpacing: "1.7px",
                    marginBottom: "9px",
                  }}
                >
                  YOUR CAMPUS, YOUR CHOICE
                </div>

                <h2
                  style={{
                    fontWeight: 900,
                    fontSize: "clamp(25px, 3vw, 34px)",
                    letterSpacing: "-.8px",
                    marginBottom: "8px",
                  }}
                >
                  Explore Food Courts
                </h2>

                <p
                  style={{
                    color: "#788398",
                    fontSize: "14px",
                    marginBottom: 0,
                  }}
                >
                  Pick your favourite spot and discover its menu.
                </p>
              </div>

              <div
                style={{
                  border: "1px solid #e7eaf1",
                  borderRadius: "12px",
                  background: "#fff",
                  padding: "10px 14px",
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#526078",
                }}
              >
                {foodCourts.length} Food Court
                {foodCourts.length !== 1 ? "s" : ""}
              </div>
            </div>

            {loadingCourts ? (
              <div
                className="text-center"
                style={{
                  padding: "75px 20px",
                  background: "#fff",
                  borderRadius: "22px",
                  border: "1px solid #edf0f6",
                }}
              >
                <div
                  className="spinner-border"
                  role="status"
                  style={{ color: "#ff8e43" }}
                />

                <p
                  style={{
                    marginTop: "15px",
                    color: "#788398",
                    fontSize: "14px",
                  }}
                >
                  Finding your campus food spots...
                </p>
              </div>
            ) : error ? (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #f3d2d2",
                  borderRadius: "20px",
                  padding: "30px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "36px" }}>⚠️</div>

                <h5 className="fw-bold mt-3">
                  Food Courts load nahi hue
                </h5>

                <p style={{ color: "#788398" }}>{error}</p>

                <button
                  type="button"
                  className="cb-outline-btn"
                  onClick={loadFoodCourts}
                >
                  Try Again
                </button>
              </div>
            ) : foodCourts.length === 0 ? (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #edf0f6",
                  borderRadius: "22px",
                  padding: "48px 24px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "55px" }}>🍽️</div>

                <h4 className="fw-bold mt-3">
                  No Food Courts Yet
                </h4>

                <p style={{ color: "#788398" }}>
                  Active Food Courts will appear here.
                </p>
              </div>
            ) : (
              <div className="row g-4">
                {foodCourts.map((court, index) => {
                  const courtIcons = [
                    "🍔",
                    "🥤",
                    "🍜",
                    "☕",
                    "🥪",
                    "🍕",
                  ];

                  const icon = courtIcons[index % courtIcons.length];

                  return (
                    <div
                      className="col-sm-6 col-lg-4"
                      key={court._id}
                    >
                      <article className="cb-court-card">
                        <div
                          style={{
                            height: "8px",
                            background:
                              index % 3 === 0
                                ? "linear-gradient(90deg,#ffb86b,#ff793f)"
                                : index % 3 === 1
                                ? "linear-gradient(90deg,#9ddcc5,#48ae8b)"
                                : "linear-gradient(90deg,#a9b9ff,#777fe2)",
                          }}
                        />

                        <div style={{ padding: "25px" }}>
                          <div className="d-flex justify-content-between align-items-start gap-3">
                            <div
                              style={{
                                width: "70px",
                                height: "70px",
                                borderRadius: "22px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "36px",
                                background: "#fff4e9",
                                border: "1px solid #ffebd8",
                              }}
                            >
                              {icon}
                            </div>

                            <span
                              style={{
                                color: "#3e9a72",
                                background: "#eaf8f0",
                                borderRadius: "999px",
                                padding: "7px 10px",
                                fontSize: "10px",
                                fontWeight: 850,
                                letterSpacing: ".5px",
                              }}
                            >
                              ● ACTIVE
                            </span>
                          </div>

                          <h3
                            style={{
                              marginTop: "22px",
                              fontSize: "23px",
                              fontWeight: 900,
                              letterSpacing: "-.5px",
                              marginBottom: "8px",
                              overflowWrap: "anywhere",
                            }}
                          >
                            {court.name}
                          </h3>

                          <p
                            style={{
                              color: "#788398",
                              fontSize: "13px",
                              lineHeight: 1.7,
                              minHeight: "44px",
                              marginBottom: "18px",
                            }}
                          >
                            {court.description ||
                              "Discover fresh campus favourites and tasty picks."}
                          </p>

                          <div
                            className="d-flex justify-content-between align-items-center gap-2"
                            style={{
                              borderTop: "1px solid #f0f2f7",
                              paddingTop: "17px",
                            }}
                          >
                            <div>
                              <div
                                style={{
                                  color: "#263651",
                                  fontWeight: 850,
                                  fontSize: "17px",
                                }}
                              >
                                {court.itemCount}{" "}
                                <span
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: 650,
                                    color: "#8993a5",
                                  }}
                                >
                                  available items
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="cb-primary-btn"
                              onClick={() => openFoodCourt(court)}
                            >
                              Explore <span aria-hidden="true">→</span>
                            </button>
                          </div>
                        </div>
                      </article>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* =====================================================
            SELECTED FOOD COURT MENU
        ===================================================== */}

        {selectedCourt && (
          <>
            <button
              type="button"
              className="cb-outline-btn mb-4"
              onClick={backToFoodCourts}
            >
              ← All Food Courts
            </button>

            <div
              style={{
                background: "#fff",
                border: "1px solid #edf0f6",
                borderRadius: "22px",
                padding: "24px",
                marginBottom: "27px",
                boxShadow: "0 8px 28px rgba(20,35,70,.035)",
              }}
            >
              <div className="row align-items-center g-3">
                <div className="col-md">
                  <div
                    style={{
                      color: "#e47f43",
                      fontWeight: 850,
                      fontSize: "11px",
                      letterSpacing: "1.5px",
                      marginBottom: "8px",
                    }}
                  >
                    YOUR PICK, YOUR PLATE
                  </div>

                  <h2
                    style={{
                      fontWeight: 900,
                      fontSize: "clamp(25px,3vw,34px)",
                      letterSpacing: "-.8px",
                      marginBottom: "8px",
                    }}
                  >
                    {selectedCourt.name}
                  </h2>

                  <p
                    style={{
                      color: "#788398",
                      marginBottom: 0,
                      fontSize: "14px",
                    }}
                  >
                    {selectedCourt.description ||
                      "Discover something delicious from this menu."}
                  </p>
                </div>

                <div className="col-md-auto">
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "9px",
                      borderRadius: "13px",
                      background: "#eff8f2",
                      color: "#32835c",
                      padding: "12px 15px",
                      fontSize: "13px",
                      fontWeight: 800,
                    }}
                  >
                    <FoodIcon type="food" />
                    {availableItems.length} available items
                  </div>
                </div>
              </div>
            </div>

            {/* SEARCH AND CATEGORY FILTERS */}

            <div
              style={{
                background: "#fff",
                border: "1px solid #edf0f6",
                borderRadius: "20px",
                padding: "20px",
                marginBottom: "28px",
              }}
            >
              <div className="row g-3 align-items-center">
                <div className="col-lg-5">
                  <input
                    type="search"
                    className="cb-search"
                    placeholder="🔎  Search burgers, coffee, noodles..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search food items"
                  />
                </div>

                <div className="col-lg-7">
                  <div className="d-flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        type="button"
                        key={cat}
                        className={`cb-category ${
                          category === cat ? "active" : ""
                        }`}
                        onClick={() => setCategory(cat)}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {(search || category !== "All") && (
                <div
                  className="d-flex justify-content-between align-items-center flex-wrap gap-2 mt-3 pt-3"
                  style={{
                    borderTop: "1px solid #f0f2f7",
                    fontSize: "13px",
                    color: "#788398",
                  }}
                >
                  <span>
                    Showing <strong>{filteredItems.length}</strong>{" "}
                    result{filteredItems.length !== 1 ? "s" : ""}
                  </span>

                  <button
                    type="button"
                    className="cb-outline-btn"
                    onClick={resetFilters}
                  >
                    Reset filters
                  </button>
                </div>
              )}
            </div>

            {/* MENU LOADING */}

            {loadingMenu ? (
              <div className="text-center py-5">
                <div
                  className="spinner-border"
                  role="status"
                  style={{ color: "#ff8e43" }}
                />

                <p
                  style={{
                    color: "#788398",
                    marginTop: "15px",
                    fontSize: "14px",
                  }}
                >
                  Loading {selectedCourt.name} menu...
                </p>
              </div>
            ) : error ? (
              <div
                style={{
                  padding: "30px",
                  background: "#fff",
                  border: "1px solid #f3d2d2",
                  borderRadius: "20px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: "36px" }}>⚠️</div>

                <h5 className="fw-bold mt-3">
                  Unable to Load Menu
                </h5>

                <p style={{ color: "#788398" }}>{error}</p>

                <button
                  type="button"
                  className="cb-outline-btn"
                  onClick={() => {
                    setError("");
                    setSelectedCourt({ ...selectedCourt });
                  }}
                >
                  Try Again
                </button>
              </div>
            ) : filteredItems.length > 0 ? (
              <div className="row g-4">
                {filteredItems.map((item) => (
                  <div className="col-sm-6 col-lg-4" key={item._id}>
                    <article className="cb-food-card">
                      <div
                        style={{
                          position: "relative",
                          overflow: "hidden",
                          background: "#f0f2f7",
                        }}
                      >
                        {item.imageUrl ? (
                          <img
                            src={getImageUrl(item.imageUrl)}
                            alt={item.name}
                            loading="lazy"
                            className="cb-food-image"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";

                              const fallback =
                                e.currentTarget.parentElement?.querySelector(
                                  ".cb-food-fallback"
                                );

                              if (fallback) {
                                fallback.style.display = "flex";
                              }
                            }}
                          />
                        ) : null}

                        <div
                          className="cb-food-fallback"
                          style={{
                            height: "220px",
                            display: item.imageUrl ? "none" : "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "65px",
                            background:
                              "linear-gradient(135deg,#fff5e9,#f0f2f8)",
                          }}
                        >
                          <FoodIcon type="food" />
                        </div>

                        <span
                          style={{
                            position: "absolute",
                            top: "13px",
                            left: "13px",
                            borderRadius: "999px",
                            padding: "7px 11px",
                            background: "#eaf8f0",
                            color: "#278354",
                            fontSize: "11px",
                            fontWeight: 850,
                            boxShadow: "0 3px 10px rgba(0,0,0,.06)",
                          }}
                        >
                          ✓ Available
                        </span>
                      </div>

                      <div
                        style={{
                          padding: "20px",
                          display: "flex",
                          flexDirection: "column",
                          minHeight: "230px",
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <h3
                            style={{
                              fontSize: "19px",
                              fontWeight: 900,
                              letterSpacing: "-.3px",
                              marginBottom: 0,
                            }}
                          >
                            {item.name}
                          </h3>

                          <span
                            style={{
                              borderRadius: "999px",
                              padding: "6px 9px",
                              background: "#fff3e8",
                              color: "#c16d36",
                              fontSize: "10px",
                              fontWeight: 850,
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.category || "Food"}
                          </span>
                        </div>

                        <p
                          style={{
                            color: "#7c879a",
                            fontSize: "13px",
                            lineHeight: 1.7,
                            marginTop: "11px",
                            marginBottom: "20px",
                            flexGrow: 1,
                          }}
                        >
                          {item.description ||
                            "Freshly prepared for your campus cravings."}
                        </p>

                        <div
                          className="d-flex justify-content-between align-items-center gap-2"
                          style={{
                            borderTop: "1px solid #edf0f6",
                            paddingTop: "17px",
                          }}
                        >
                          <div>
                            <small
                              style={{
                                color: "#8a94a5",
                                fontSize: "11px",
                                display: "block",
                                marginBottom: "3px",
                              }}
                            >
                              PRICE
                            </small>

                            <span
                              style={{
                                color: "#25845a",
                                fontSize: "23px",
                                fontWeight: 900,
                                letterSpacing: "-.5px",
                              }}
                            >
                              ₹{Number(item.price || 0)}
                            </span>
                          </div>

                          <button
                            type="button"
                            className={
                              addedItem === item._id
                                ? "btn btn-success fw-bold"
                                : "cb-primary-btn"
                            }
                            style={{
                              fontSize: "12px",
                              padding: "11px 13px",
                            }}
                            onClick={() => handleAddToCart(item)}
                          >
                            {addedItem === item._id
                              ? "✓ Added"
                              : "＋ Add to Cart"}
                          </button>
                        </div>
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: "55px 24px",
                  textAlign: "center",
                  background: "#fff",
                  border: "1px solid #edf0f6",
                  borderRadius: "22px",
                }}
              >
                <div style={{ fontSize: "58px" }}>🍽️</div>

                <h3
                  style={{
                    fontWeight: 900,
                    marginTop: "15px",
                    fontSize: "23px",
                  }}
                >
                  {availableItems.length === 0
                    ? "Menu Coming Soon"
                    : "No Matching Food Items"}
                </h3>

                <p
                  style={{
                    color: "#788398",
                    fontSize: "14px",
                    marginTop: "9px",
                  }}
                >
                  {availableItems.length === 0
                    ? "This Food Court has no available items right now."
                    : "Try another search or choose a different category."}
                </p>

                {(search || category !== "All") && (
                  <button
                    type="button"
                    className="cb-outline-btn mt-2"
                    onClick={resetFilters}
                  >
                    Reset filters
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* =====================================================
          ORDERING BANNER
      ===================================================== */}

      <section
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "42px 24px",
          background:
            "linear-gradient(115deg,#17243d 0%,#1c3962 58%,#353365 100%)",
          color: "#fff",
        }}
      >
        <div
          className="row align-items-center g-4"
          style={{
            maxWidth: "1184px",
            margin: "0 auto",
          }}
        >
          <div className="col-lg-8">
            <div
              style={{
                color: "#ffbd83",
                fontSize: "11px",
                fontWeight: 850,
                letterSpacing: "1.7px",
                marginBottom: "12px",
              }}
            >
              🎟️ SMART ORDERING
            </div>

            <h2
              style={{
                fontWeight: 900,
                fontSize: "clamp(25px,3vw,36px)",
                letterSpacing: "-1px",
                lineHeight: 1.2,
                marginBottom: "12px",
              }}
            >
              Order ahead. Skip the queue.
            </h2>

            <p
              style={{
                maxWidth: "600px",
                color: "#c2cddd",
                fontSize: "14px",
                lineHeight: 1.8,
                marginBottom: 0,
              }}
            >
              Add your favourites to the cart, place your order and
              make campus food pickup easier.
            </p>
          </div>

          <div className="col-lg-4 text-lg-end">
            <Link
              to="/cart"
              style={{
                ...primaryButton,
                padding: "15px 22px",
                fontSize: "14px",
                boxShadow: "0 9px 24px rgba(255,113,57,.18)",
              }}
            >
              🛒 Go to Cart
              {cartCount > 0 && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: "23px",
                    height: "23px",
                    borderRadius: "999px",
                    background: "#172744",
                    color: "#fff",
                    fontSize: "11px",
                    padding: "0 6px",
                  }}
                >
                  {cartCount}
                </span>
              )}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer
        style={{
          width: "100%",
          boxSizing: "border-box",
          background: "#0c1425",
          color: "#fff",
          padding: "46px 24px 0",
        }}
      >
        <div
          style={{
            maxWidth: "1184px",
            margin: "0 auto",
          }}
        >
          <div className="row g-4 pb-4">
            <div className="col-lg-6 col-md-7">
              <Link
                to="/"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "11px",
                  color: "#fff",
                  textDecoration: "none",
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    width: "47px",
                    height: "47px",
                    borderRadius: "15px",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "linear-gradient(135deg,#ffc47f,#ff793f)",
                    fontSize: "25px",
                  }}
                >
                  🍔
                </span>

                <span
                  style={{
                    fontSize: "25px",
                    fontWeight: 900,
                    letterSpacing: "-.8px",
                  }}
                >
                  Campus
                  <span style={{ color: "#ffb16f" }}>Bite</span>
                </span>
              </Link>

              <p
                style={{
                  maxWidth: "420px",
                  color: "#aebbd1",
                  fontSize: "14px",
                  lineHeight: 1.9,
                  marginBottom: "17px",
                }}
              >
                Your campus food companion. Discover food courts,
                order your favourites and make pickup simpler.
              </p>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#b9c8dc",
                  fontSize: "10px",
                  fontWeight: 850,
                  letterSpacing: "1.1px",
                }}
              >
                <span style={{ color: "#53d6a0" }}>●</span>
                SMART PRE-ORDER · EASY PICKUP
              </div>
            </div>

            <div className="col-lg-3 col-md-5 col-6">
              <h6
                style={{
                  fontSize: "13px",
                  fontWeight: 900,
                  marginBottom: "19px",
                  letterSpacing: ".5px",
                }}
              >
                QUICK LINKS
              </h6>

              <div className="d-flex flex-column gap-3">
                <Link to="/" className="cb-footer-link">
                  Home
                </Link>

                <Link
                  to="/canteen-menu"
                  className="cb-footer-link"
                >
                  Food Courts
                </Link>

                <Link to="/cart" className="cb-footer-link">
                  My Cart
                </Link>

                <Link to="/my-orders" className="cb-footer-link">
                  My Orders
                </Link>
              </div>
            </div>

            <div className="col-lg-3 col-md-12 col-6">
              <h6
                style={{
                  fontSize: "13px",
                  fontWeight: 900,
                  marginBottom: "19px",
                  letterSpacing: ".5px",
                }}
              >
                MADE FOR CAMPUS
              </h6>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "13px",
                  color: "#aebbd1",
                  fontSize: "13px",
                }}
              >
                <span>🍽️ Multiple Food Courts</span>
                <span>⚡ Convenient Ordering</span>
                <span>🎟️ Token-Based Pickup</span>
              </div>
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,.10)",
              padding: "19px 0",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <small
              style={{
                color: "#8795ad",
                fontSize: "12px",
              }}
            >
              ©️ 2026 Campus Bite. All rights reserved.
            </small>

            <small
              style={{
                color: "#8795ad",
                fontSize: "12px",
              }}
            >
              Made for campus cravings ❤️
            </small>
          </div>

          <div
            style={{
              borderTop: "1px solid rgba(255,255,255,.07)",
              padding: "18px 0 23px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                color: "#8996ad",
                fontSize: "10px",
                fontWeight: 800,
                letterSpacing: "2px",
                marginBottom: "7px",
              }}
            >
              DESIGNED & DEVELOPED BY
            </div>

            <div
              style={{
                fontSize: "17px",
                fontWeight: 900,
                letterSpacing: ".2px",
                color: "#fff",
              }}
            >
              Mohd <span style={{ color: "#ffb16f" }}>Altamash</span>
            </div>
          </div>
        </div>
      </footer>

      {/* =====================================================
          DIFFERENT FOOD COURT CONFIRMATION MODAL
      ===================================================== */}

      {showCartModal && pendingItem && pendingCourt && (
        <div
          className="cb-modal-overlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleKeepCurrentCart();
            }
          }}
        >
          <div
            className="cb-cart-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cb-cart-modal-title"
          >
            <div
              style={{
                width: "62px",
                height: "62px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "20px",
                background: "#fff1e5",
                fontSize: "31px",
                marginBottom: "19px",
              }}
            >
              🛒
            </div>

            <h3
              id="cb-cart-modal-title"
              style={{
                color: "#172033",
                fontSize: "23px",
                fontWeight: 900,
                letterSpacing: "-.5px",
                marginBottom: "11px",
              }}
            >
              Switch Food Court?
            </h3>

            <p
              style={{
                color: "#68758b",
                fontSize: "14px",
                lineHeight: 1.8,
                marginBottom: "18px",
              }}
            >
              Your cart contains items from another food court.
              Campus Bite allows one food court per order.
            </p>

            <div
              style={{
                border: "1px solid #e9edf4",
                background: "#f8f9fc",
                borderRadius: "14px",
                padding: "14px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  color: "#8792a5",
                  fontSize: "10px",
                  fontWeight: 850,
                  letterSpacing: "1px",
                  marginBottom: "5px",
                }}
              >
                NEW ITEM
              </div>

              <div
                style={{
                  color: "#172033",
                  fontWeight: 850,
                  fontSize: "15px",
                }}
              >
                {pendingItem.name}
              </div>

              <div
                style={{
                  color: "#68758b",
                  fontSize: "12px",
                  marginTop: "4px",
                }}
              >
                From {pendingCourt.name}
              </div>
            </div>

            <button
              type="button"
              className="cb-modal-action cb-modal-confirm"
              onClick={handleClearCartAndAdd}
            >
              Clear Cart &amp; Add Item
            </button>

            <button
              type="button"
              className="cb-modal-action cb-modal-cancel"
              style={{ marginTop: "10px" }}
              onClick={handleKeepCurrentCart}
            >
              Keep Current Cart
            </button>

            <p
              style={{
                color: "#929bad",
                fontSize: "11px",
                textAlign: "center",
                lineHeight: 1.6,
                margin: "15px 0 0",
              }}
            >
              Keeping your current cart will not remove or change
              any existing items.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanteenMenu;