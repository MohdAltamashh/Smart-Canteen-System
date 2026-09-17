import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const Navbar = () => {
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // =====================================================
  // LOAD USER
  // =====================================================

  const loadUser = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUser(null);
      return;
    }

    try {
      const decoded = jwtDecode(token);

      setUser({
        ...decoded,
        role: decoded.role
          ? String(decoded.role).toLowerCase()
          : "",
      });
    } catch (error) {
      console.error("Invalid token:", error);

      localStorage.removeItem("token");
      setUser(null);
    }
  };

  // =====================================================
  // USER / TOKEN CHECK
  // =====================================================

  useEffect(() => {
    loadUser();
  }, [location.pathname]);

  // =====================================================
  // AUTH CHANGE LISTENER
  // =====================================================

  useEffect(() => {
    const handleAuthChange = () => {
      loadUser();
    };

    window.addEventListener("authChanged", handleAuthChange);

    return () => {
      window.removeEventListener(
        "authChanged",
        handleAuthChange
      );
    };
  }, []);

  // =====================================================
  // CART COUNT
  // =====================================================

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart =
          JSON.parse(localStorage.getItem("cart")) || [];

        const count = cart.reduce(
          (total, item) =>
            total + Number(item.quantity || 0),
          0
        );

        setCartCount(count);
      } catch (error) {
        console.error("Cart count error:", error);
        setCartCount(0);
      }
    };

    updateCartCount();

    window.addEventListener(
      "cartUpdated",
      updateCartCount
    );

    window.addEventListener(
      "storage",
      updateCartCount
    );

    return () => {
      window.removeEventListener(
        "cartUpdated",
        updateCartCount
      );

      window.removeEventListener(
        "storage",
        updateCartCount
      );
    };
  }, []);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");

    setUser(null);
    setCartCount(0);
    setUserMenuOpen(false);
    setMobileMenuOpen(false);

    window.dispatchEvent(
      new Event("authChanged")
    );

    window.location.href = "/";
  };

  // =====================================================
  // LOGIN
  // =====================================================

  const handleLogin = () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);

    window.location.href = "/login/student";
  };

  // =====================================================
  // REGISTER
  // =====================================================

  const handleRegister = () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);

    window.location.href = "/register/student";
  };

  // =====================================================
  // CLOSE MOBILE MENU
  // =====================================================

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // =====================================================
  // ACTIVE LINK
  // =====================================================

  const getActiveClass = (path) => {
    return location.pathname === path ? "active" : "";
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark sticky-top smart-navbar">

      <div className="container">

        {/* ================================================= */}
        {/* BRAND */}
        {/* ================================================= */}

        <Link
          className="navbar-brand d-flex align-items-center"
          to="/"
          onClick={closeMobileMenu}
        >
          <span className="brand-icon me-2">
            🍴
          </span>

          <div>
            <div className="brand-title">
              Smart Canteen
            </div>

            <div className="brand-subtitle">
              Pre-Order & Token System
            </div>
          </div>
        </Link>

        {/* ================================================= */}
        {/* MOBILE BUTTON */}
        {/* ================================================= */}

        <button
          className="navbar-toggler"
          type="button"
          aria-label="Toggle navigation"
          onClick={() =>
            setMobileMenuOpen(!mobileMenuOpen)
          }
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* ================================================= */}
        {/* NAVIGATION */}
        {/* ================================================= */}

        <div
          className={`collapse navbar-collapse ${
            mobileMenuOpen ? "show" : ""
          }`}
        >
          <ul className="navbar-nav ms-auto align-items-lg-center">

            {/* ================================================= */}
            {/* HOME */}
            {/* ================================================= */}

            <li className="nav-item">
              <Link
                className={`nav-link ${getActiveClass("/")}`}
                to="/"
                onClick={closeMobileMenu}
              >
                🏠 Home
              </Link>
            </li>

            {/* ================================================= */}
            {/* STUDENT */}
            {/* ================================================= */}

            {user?.role === "student" && (
              <>
                <li className="nav-item">
                  <Link
                    className={`nav-link ${getActiveClass(
                      "/canteen-menu"
                    )}`}
                    to="/canteen-menu"
                    onClick={closeMobileMenu}
                  >
                    🍔 Menu
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    className={`nav-link ${getActiveClass(
                      "/cart"
                    )}`}
                    to="/cart"
                    onClick={closeMobileMenu}
                  >
                    🛒 Cart

                    {cartCount > 0 && (
                      <span className="cart-badge">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </li>

                <li className="nav-item">
                  <Link
                    className={`nav-link ${getActiveClass(
                      "/my-orders"
                    )}`}
                    to="/my-orders"
                    onClick={closeMobileMenu}
                  >
                    📦 My Orders
                  </Link>
                </li>
              </>
            )}

            {/* ================================================= */}
            {/* STAFF */}
            {/* ================================================= */}

            {user?.role === "staff" && (
              <li className="nav-item">
                <Link
                  className={`nav-link ${getActiveClass(
                    "/staff/dashboard"
                  )}`}
                  to="/staff/dashboard"
                  onClick={closeMobileMenu}
                >
                  👨‍🍳 Orders
                </Link>
              </li>
            )}

            {/* ================================================= */}
            {/* ADMIN */}
            {/* ================================================= */}

            {user?.role === "admin" && (
              <li className="nav-item">
                <Link
                  className={`nav-link ${getActiveClass(
                    "/admin/dashboard"
                  )}`}
                  to="/admin/dashboard"
                  onClick={closeMobileMenu}
                >
                  📊 Dashboard
                </Link>
              </li>
            )}

            {/* ================================================= */}
            {/* LOGGED OUT */}
            {/* ================================================= */}

            {!user && (
              <li className="nav-item ms-lg-3 mt-3 mt-lg-0">
                <div className="d-flex gap-2">

                  <button
                    type="button"
                    className="nav-login"
                    onClick={handleLogin}
                  >
                    🔐 Login
                  </button>

                  <button
                    type="button"
                    className="nav-register"
                    onClick={handleRegister}
                  >
                    📝 Register
                  </button>

                </div>
              </li>
            )}

            {/* ================================================= */}
            {/* LOGGED IN USER */}
            {/* ================================================= */}

            {user && (
              <li className="nav-item ms-lg-3 mt-3 mt-lg-0">

                <div className="position-relative">

                  {/* USER BUTTON */}

                  <button
                    type="button"
                    className="user-button dropdown-toggle"
                    onClick={() =>
                      setUserMenuOpen(!userMenuOpen)
                    }
                  >
                    👤{" "}
                    {user.name ||
                      user.email ||
                      "User"}
                  </button>

                  {/* ================================================= */}
                  {/* USER DROPDOWN */}
                  {/* ================================================= */}

                  {userMenuOpen && (
                    <div
                      className="user-dropdown"
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "calc(100% + 8px)",
                      }}
                    >

                      {/* USER INFORMATION */}

                      <div className="user-info">

                        <div className="user-name">
                          {user.name || "User"}
                        </div>

                        <div className="user-email">
                          {user.email}
                        </div>

                        <span className="badge bg-primary mt-2 text-capitalize">
                          {user.role}
                        </span>

                      </div>

                      {/* ================================================= */}
                      {/* STUDENT OPTIONS */}
                      {/* ================================================= */}

                      {user.role === "student" && (
                        <>
                          <Link
                            className="dropdown-item"
                            to="/canteen-menu"
                            onClick={() =>
                              setUserMenuOpen(false)
                            }
                          >
                            🍔 Canteen Menu
                          </Link>

                          <Link
                            className="dropdown-item"
                            to="/cart"
                            onClick={() =>
                              setUserMenuOpen(false)
                            }
                          >
                            🛒 Cart
                          </Link>

                          <Link
                            className="dropdown-item"
                            to="/my-orders"
                            onClick={() =>
                              setUserMenuOpen(false)
                            }
                          >
                            📦 My Orders
                          </Link>
                        </>
                      )}

                      {/* ================================================= */}
                      {/* STAFF */}
                      {/* ================================================= */}

                      {user.role === "staff" && (
                        <Link
                          className="dropdown-item"
                          to="/staff/dashboard"
                          onClick={() =>
                            setUserMenuOpen(false)
                          }
                        >
                          👨‍🍳 Staff Orders
                        </Link>
                      )}

                      {/* ================================================= */}
                      {/* ADMIN */}
                      {/* ================================================= */}

                      {user.role === "admin" && (
                        <Link
                          className="dropdown-item"
                          to="/admin/dashboard"
                          onClick={() =>
                            setUserMenuOpen(false)
                          }
                        >
                          📊 Admin Dashboard
                        </Link>
                      )}

                      <div className="dropdown-divider"></div>

                      {/* ================================================= */}
                      {/* LOGOUT */}
                      {/* ================================================= */}

                      <button
                        type="button"
                        className="dropdown-item text-danger"
                        onClick={handleLogout}
                      >
                        🚪 Logout
                      </button>

                    </div>
                  )}

                </div>

              </li>
            )}

          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;