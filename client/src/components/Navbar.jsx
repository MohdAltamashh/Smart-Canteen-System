import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const Navbar = () => {
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Load logged-in user
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

  useEffect(() => {
    loadUser();
  }, [location.pathname]);

  // Listen for login/logout changes
  useEffect(() => {
    const handleAuthChange = () => {
      loadUser();
    };

    window.addEventListener("authChanged", handleAuthChange);

    return () => {
      window.removeEventListener("authChanged", handleAuthChange);
    };
  }, []);

  // Update cart count
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

    window.addEventListener("cartUpdated", updateCartCount);
    window.addEventListener("storage", updateCartCount);

    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
      window.removeEventListener("storage", updateCartCount);
    };
  }, []);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");

    setUser(null);
    setCartCount(0);
    setUserMenuOpen(false);
    setMobileMenuOpen(false);

    window.dispatchEvent(new Event("authChanged"));
    window.location.href = "/";
  };

  // Login
  const handleLogin = () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    window.location.href = "/login/student";
  };

  // Register
  const handleRegister = () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    window.location.href = "/register/student";
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  const getActiveClass = (path) => {
    return location.pathname === path ? "cb-active" : "";
  };

  return (
    <>
      <style>{`
        .campus-navbar {
          background: linear-gradient(110deg, #071a35 0%, #0b2c52 55%, #103b66 100%);
          border-bottom: 1px solid rgba(255,255,255,0.10);
          box-shadow: 0 8px 28px rgba(3, 15, 35, 0.20);
          padding: 12px 0;
          z-index: 1050;
        }

        .campus-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
          min-width: 0;
        }

        .campus-logo {
          width: 48px;
          height: 48px;
          object-fit: contain;
          border-radius: 14px;
          background: rgba(255,255,255,0.08);
          padding: 3px;
          flex-shrink: 0;
        }

        .campus-brand-title {
          color: #ffffff;
          font-size: 23px;
          line-height: 1.1;
          font-weight: 800;
          letter-spacing: -0.6px;
          margin: 0;
        }

        .campus-brand-title span {
          color: #ffc857;
        }

        .campus-brand-subtitle {
          color: #b8c9df;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 1.25px;
          text-transform: uppercase;
          margin-top: 5px;
        }

        .campus-navbar .navbar-toggler {
          border: 1px solid rgba(255,255,255,0.25);
          border-radius: 10px;
          padding: 8px 11px;
          box-shadow: none;
        }

        .campus-navbar .navbar-toggler:focus {
          box-shadow: 0 0 0 3px rgba(255,200,87,0.18);
        }

        .campus-nav-link {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: #dbe7f5 !important;
          font-size: 14px;
          font-weight: 600;
          padding: 11px 14px !important;
          margin: 0 2px;
          border-radius: 11px;
          text-decoration: none;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .campus-nav-link:hover,
        .campus-nav-link.cb-active {
          color: #ffffff !important;
          background: rgba(255,255,255,0.12);
        }

        .campus-nav-link.cb-active {
          box-shadow: inset 0 -2px 0 #ffc857;
        }

        .campus-cart-badge {
          display: inline-flex;
          justify-content: center;
          align-items: center;
          min-width: 20px;
          height: 20px;
          padding: 0 5px;
          border-radius: 20px;
          background: #ffc857;
          color: #14213d;
          font-size: 11px;
          font-weight: 800;
          margin-left: 2px;
        }

        .campus-login-btn,
        .campus-register-btn {
          border-radius: 11px;
          padding: 10px 17px;
          font-size: 14px;
          font-weight: 700;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .campus-login-btn {
          background: #ffc857;
          border: 1px solid #ffc857;
          color: #13243c;
        }

        .campus-login-btn:hover {
          background: #ffda85;
          border-color: #ffda85;
          color: #13243c;
          transform: translateY(-1px);
        }

        .campus-register-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.35);
          color: #ffffff;
        }

        .campus-register-btn:hover {
          background: rgba(255,255,255,0.12);
          border-color: #ffffff;
          color: #ffffff;
          transform: translateY(-1px);
        }

        .campus-user-btn {
          display: flex;
          align-items: center;
          gap: 9px;
          background: rgba(255,255,255,0.10);
          color: #ffffff;
          border: 1px solid rgba(255,255,255,0.18);
          border-radius: 12px;
          padding: 9px 13px;
          font-size: 14px;
          font-weight: 600;
          max-width: 220px;
        }

        .campus-user-btn:hover {
          background: rgba(255,255,255,0.17);
          color: #ffffff;
        }

        .campus-user-avatar {
          width: 29px;
          height: 29px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 9px;
          background: #ffc857;
          color: #13243c;
          font-size: 14px;
          flex-shrink: 0;
        }

        .campus-user-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 135px;
        }

        .campus-user-dropdown {
          width: 255px;
          background: #ffffff;
          border: 1px solid #e5eaf1;
          border-radius: 15px;
          box-shadow: 0 16px 45px rgba(0,0,0,0.20);
          padding: 9px;
          z-index: 2000;
        }

        .campus-user-info {
          padding: 13px;
          border-radius: 11px;
          background: #f3f6fb;
          margin-bottom: 7px;
          overflow-wrap: anywhere;
        }

        .campus-user-info-name {
          color: #14213d;
          font-size: 15px;
          font-weight: 800;
        }

        .campus-user-info-email {
          color: #64748b;
          font-size: 12px;
          margin-top: 4px;
        }

        .campus-user-dropdown .dropdown-item {
          padding: 10px 12px;
          border-radius: 9px;
          font-size: 14px;
          font-weight: 600;
          color: #334155;
        }

        .campus-user-dropdown .dropdown-item:hover {
          background: #edf3fb;
          color: #0b4a82;
        }

        @media (max-width: 991.98px) {
          .campus-navbar .navbar-collapse {
            margin-top: 14px;
            padding: 12px;
            background: rgba(3, 16, 34, 0.45);
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 15px;
          }

          .campus-nav-link {
            width: 100%;
            padding: 12px 14px !important;
            margin: 2px 0;
          }

          .campus-auth-actions {
            padding-top: 12px;
            margin-top: 8px;
            border-top: 1px solid rgba(255,255,255,0.12);
          }

          .campus-user-dropdown {
            position: static !important;
            width: 100%;
            margin-top: 10px;
          }

          .campus-user-btn {
            width: 100%;
            max-width: none;
            justify-content: flex-start;
          }
        }

        @media (max-width: 480px) {
          .campus-navbar {
            padding: 9px 0;
          }

          .campus-logo {
            width: 41px;
            height: 41px;
          }

          .campus-brand {
            gap: 9px;
          }

          .campus-brand-title {
            font-size: 20px;
          }

          .campus-brand-subtitle {
            font-size: 8px;
            letter-spacing: 0.8px;
          }
        }
      `}</style>

      <nav className="navbar navbar-expand-lg navbar-dark sticky-top campus-navbar">
        <div className="container">

          {/* BRAND / LOGO */}
          <Link
            className="campus-brand"
            to="/"
            onClick={closeMobileMenu}
          >
            <img
              src="/campus-bite-logo.png"
              alt="Campus Bite Logo"
              className="campus-logo"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />

            <div>
              <div className="campus-brand-title">
                Campus <span>Bite</span>
              </div>

              <div className="campus-brand-subtitle">
                Smart Pre-Order · Easy Pickup
              </div>
            </div>
          </Link>

          {/* MOBILE MENU BUTTON */}
          <button
            className="navbar-toggler"
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={mobileMenuOpen}
            onClick={() => {
              setMobileMenuOpen(!mobileMenuOpen);
              setUserMenuOpen(false);
            }}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* NAVIGATION */}
          <div
            className={`collapse navbar-collapse ${
              mobileMenuOpen ? "show" : ""
            }`}
          >
            <ul className="navbar-nav ms-auto align-items-lg-center">

              {/* HOME */}
              <li className="nav-item">
                <Link
                  className={`campus-nav-link ${getActiveClass("/")}`}
                  to="/"
                  onClick={closeMobileMenu}
                >
                  <span>⌂</span> Home
                </Link>
              </li>

              {/* STUDENT LINKS */}
              {user?.role === "student" && (
                <>
                  <li className="nav-item">
                    <Link
                      className={`campus-nav-link ${getActiveClass(
                        "/canteen-menu"
                      )}`}
                      to="/canteen-menu"
                      onClick={closeMobileMenu}
                    >
                      <span>🍔</span> Menu
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link
                      className={`campus-nav-link ${getActiveClass(
                        "/cart"
                      )}`}
                      to="/cart"
                      onClick={closeMobileMenu}
                    >
                      <span>🛒</span> Cart
                      {cartCount > 0 && (
                        <span className="campus-cart-badge">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                  </li>

                  <li className="nav-item">
                    <Link
                      className={`campus-nav-link ${getActiveClass(
                        "/my-orders"
                      )}`}
                      to="/my-orders"
                      onClick={closeMobileMenu}
                    >
                      <span>📦</span> My Orders
                    </Link>
                  </li>
                </>
              )}

              {/* STAFF */}
              {user?.role === "staff" && (
                <li className="nav-item">
                  <Link
                    className={`campus-nav-link ${getActiveClass(
                      "/staff/dashboard"
                    )}`}
                    to="/staff/dashboard"
                    onClick={closeMobileMenu}
                  >
                    <span>👨‍🍳</span> Orders
                  </Link>
                </li>
              )}

              {/* ADMIN */}
              {user?.role === "admin" && (
                <li className="nav-item">
                  <Link
                    className={`campus-nav-link ${getActiveClass(
                      "/admin/dashboard"
                    )}`}
                    to="/admin/dashboard"
                    onClick={closeMobileMenu}
                  >
                    <span>📊</span> Dashboard
                  </Link>
                </li>
              )}

              {/* LOGGED OUT */}
              {!user && (
                <li className="nav-item ms-lg-3 mt-2 mt-lg-0 campus-auth-actions">
                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      type="button"
                      className="campus-login-btn"
                      onClick={handleLogin}
                    >
                      Login
                    </button>

                    <button
                      type="button"
                      className="campus-register-btn"
                      onClick={handleRegister}
                    >
                      Register
                    </button>
                  </div>
                </li>
              )}

              {/* LOGGED IN USER */}
              {user && (
                <li className="nav-item ms-lg-3 mt-2 mt-lg-0">
                  <div className="position-relative">

                    <button
                      type="button"
                      className="campus-user-btn"
                      aria-expanded={userMenuOpen}
                      onClick={() =>
                        setUserMenuOpen(!userMenuOpen)
                      }
                    >
                      <span className="campus-user-avatar">
                        {(
                          user.name ||
                          user.email ||
                          "U"
                        ).charAt(0).toUpperCase()}
                      </span>

                      <span className="campus-user-name">
                        {user.name || user.email || "User"}
                      </span>

                      <span>▾</span>
                    </button>

                    {/* USER DROPDOWN */}
                    {userMenuOpen && (
                      <div
                        className="campus-user-dropdown"
                        style={{
                          position: "absolute",
                          right: 0,
                          top: "calc(100% + 10px)",
                        }}
                      >
                        <div className="campus-user-info">
                          <div className="campus-user-info-name">
                            {user.name || "User"}
                          </div>

                          <div className="campus-user-info-email">
                            {user.email}
                          </div>

                          <span className="badge bg-primary mt-2 text-capitalize">
                            {user.role}
                          </span>
                        </div>

                        {/* STUDENT OPTIONS */}
                        {user.role === "student" && (
                          <>
                            <Link
                              className="dropdown-item"
                              to="/canteen-menu"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              🍔 Canteen Menu
                            </Link>

                            <Link
                              className="dropdown-item"
                              to="/cart"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              🛒 Cart
                              {cartCount > 0 && (
                                <span className="campus-cart-badge">
                                  {cartCount}
                                </span>
                              )}
                            </Link>

                            <Link
                              className="dropdown-item"
                              to="/my-orders"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              📦 My Orders
                            </Link>
                          </>
                        )}

                        {/* STAFF OPTIONS */}
                        {user.role === "staff" && (
                          <Link
                            className="dropdown-item"
                            to="/staff/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            👨‍🍳 Staff Orders
                          </Link>
                        )}

                        {/* ADMIN OPTIONS */}
                        {user.role === "admin" && (
                          <Link
                            className="dropdown-item"
                            to="/admin/dashboard"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            📊 Admin Dashboard
                          </Link>
                        )}

                        <div className="dropdown-divider"></div>

                        {/* LOGOUT */}
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
    </>
  );
};

export default Navbar;