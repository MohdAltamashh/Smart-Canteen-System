import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const Navbar = () => {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

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
        role: decoded.role ? String(decoded.role).toLowerCase() : "",
      });
    } catch (error) {
      console.error("Invalid token:", error);
      localStorage.removeItem("token");
      setUser(null);
    }
  };

  useEffect(() => {
    loadUser();
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleAuthChange = () => loadUser();
    window.addEventListener("authChanged", handleAuthChange);
    return () => window.removeEventListener("authChanged", handleAuthChange);
  }, []);

  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        setCartCount(
          cart.reduce((total, item) => total + Number(item.quantity || 0), 0)
        );
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

  const closeMenus = () => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setCartCount(0);
    closeMenus();
    window.dispatchEvent(new Event("authChanged"));
    window.location.href = "/";
  };

  const handleLogin = () => {
    closeMenus();
    window.location.href = "/login/student";
  };

  const handleRegister = () => {
    closeMenus();
    window.location.href = "/register/student";
  };

  const active = (path) =>
    location.pathname === path ||
    (path !== "/" && location.pathname.startsWith(path));

  const navClass = (path) =>
    `cb-nav-link${active(path) ? " cb-nav-active" : ""}`;

  return (
    <>
      <style>{`
        .cb-navbar {
          position: sticky;
          top: 0;
          z-index: 1050;
          padding: 10px 0;
          background: rgba(10, 13, 20, .94);
          border-bottom: 1px solid rgba(255, 178, 91, .22);
          box-shadow: 0 8px 28px rgba(0,0,0,.22);
          backdrop-filter: blur(16px);
        }
        .cb-navbar .container { gap: 16px; }
        .cb-brand {
          display: inline-flex; align-items: center; gap: 10px;
          text-decoration: none; min-width: 0; flex-shrink: 0;
        }
        .cb-logo {
          width: 43px; height: 43px; object-fit: contain;
          border-radius: 13px; flex-shrink: 0;
          background: rgba(255,255,255,.06);
          border: 1px solid rgba(255,255,255,.09); padding: 3px;
        }
        .cb-brand-title {
          color: #fff8ee; font-size: 22px; line-height: 1;
          font-weight: 850; letter-spacing: -.7px; margin: 0;
        }
        .cb-brand-title span { color: #ffb45c; }
        .cb-brand-subtitle {
          margin-top: 5px; color: #aeb7c6; font-size: 8px;
          font-weight: 700; letter-spacing: 1.15px;
          text-transform: uppercase; white-space: nowrap;
        }
        .cb-navbar .navbar-toggler {
          border: 1px solid rgba(255,255,255,.2); border-radius: 12px;
          padding: 8px 10px; box-shadow: none;
        }
        .cb-navbar .navbar-toggler:focus { box-shadow: 0 0 0 3px rgba(255,180,92,.2); }
        .cb-nav-list { gap: 4px; }
        .cb-nav-link {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 7px; color: #d5dbe5 !important; text-decoration: none;
          font-size: 13px; font-weight: 700; padding: 10px 13px !important;
          border: 1px solid transparent; border-radius: 12px;
          white-space: nowrap; transition: background .18s ease, color .18s ease, border .18s ease;
        }
        .cb-nav-link:hover {
          color: #fff !important; background: rgba(255,255,255,.07);
          border-color: rgba(255,255,255,.07);
        }
        .cb-nav-link.cb-nav-active {
          color: #20160b !important; background: #ffb45c;
          border-color: #ffb45c; box-shadow: 0 5px 16px rgba(255,180,92,.15);
        }
        .cb-cart-count {
          min-width: 19px; height: 19px; display: inline-flex;
          align-items: center; justify-content: center; padding: 0 5px;
          border-radius: 999px; background: #fff4e5; color: #7a3d00;
          font-size: 10px; font-weight: 900;
        }
        .cb-auth-btn {
          display: inline-flex; align-items: center; justify-content: center;
          min-height: 40px; padding: 9px 15px; border-radius: 12px;
          font-size: 13px; font-weight: 800; text-decoration: none;
          transition: transform .18s ease, background .18s ease;
          white-space: nowrap;
        }
        .cb-auth-btn:hover { transform: translateY(-1px); }
        .cb-login { color: #21170b; background: #ffb45c; border: 1px solid #ffb45c; }
        .cb-login:hover { color: #21170b; background: #ffc780; }
        .cb-register { color: #f4f5f7; background: transparent; border: 1px solid rgba(255,255,255,.25); }
        .cb-register:hover { color: #fff; background: rgba(255,255,255,.08); }
        .cb-user-wrap { position: relative; }
        .cb-user-btn {
          display: inline-flex; align-items: center; gap: 9px;
          max-width: 210px; padding: 6px 11px 6px 7px;
          color: #f7f7f8; background: rgba(255,255,255,.07);
          border: 1px solid rgba(255,255,255,.13); border-radius: 14px;
          font-size: 13px; font-weight: 700;
        }
        .cb-user-btn:hover, .cb-user-btn[aria-expanded="true"] {
          background: rgba(255,255,255,.12); border-color: rgba(255,180,92,.4);
        }
        .cb-avatar {
          width: 31px; height: 31px; display: inline-flex; align-items: center;
          justify-content: center; border-radius: 10px;
          background: #ffb45c; color: #21170b; font-weight: 900; flex-shrink: 0;
        }
        .cb-user-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cb-user-menu {
          position: absolute; top: calc(100% + 10px); right: 0;
          width: 260px; padding: 9px; border-radius: 16px;
          background: #171b24; border: 1px solid #343946;
          box-shadow: 0 18px 45px rgba(0,0,0,.38); z-index: 1200;
        }
        .cb-user-info {
          padding: 13px; border-radius: 12px; background: #202531;
          margin-bottom: 7px; overflow-wrap: anywhere;
        }
        .cb-user-info-name { color: #fff; font-size: 14px; font-weight: 800; }
        .cb-user-info-email { color: #aeb7c6; font-size: 11px; margin-top: 4px; }
        .cb-role-pill {
          display: inline-flex; margin-top: 8px; padding: 4px 8px;
          border-radius: 999px; color: #ffcc91; background: rgba(255,180,92,.12);
          font-size: 10px; font-weight: 800; text-transform: capitalize;
        }
        .cb-user-menu .dropdown-item {
          padding: 10px 11px; border-radius: 10px; color: #dce1e9;
          font-size: 13px; font-weight: 650;
        }
        .cb-user-menu .dropdown-item:hover { color: #fff; background: #292f3b; }
        .cb-user-menu .dropdown-divider { border-color: #343946; }
        @media (max-width: 991.98px) {
          .cb-navbar { padding: 9px 0; }
          .cb-navbar .navbar-collapse {
            margin-top: 12px; padding: 12px;
            background: #141923; border: 1px solid #2c3340; border-radius: 16px;
          }
          .cb-nav-list { align-items: stretch !important; gap: 4px; }
          .cb-nav-link { width: 100%; justify-content: flex-start; padding: 12px 13px !important; }
          .cb-auth-actions { display: grid !important; grid-template-columns: 1fr 1fr; gap: 8px !important; padding-top: 12px; margin-top: 8px; border-top: 1px solid #303744; }
          .cb-auth-btn { width: 100%; }
          .cb-user-wrap { margin-top: 8px; }
          .cb-user-btn { width: 100%; max-width: none; justify-content: flex-start; }
          .cb-user-menu { position: static; width: 100%; margin-top: 8px; }
        }
        @media (max-width: 420px) {
          .cb-brand { gap: 8px; }
          .cb-logo { width: 37px; height: 37px; border-radius: 11px; }
          .cb-brand-title { font-size: 19px; }
          .cb-brand-subtitle { font-size: 7px; letter-spacing: .65px; }
          .cb-navbar .container { padding-left: 12px; padding-right: 12px; }
        }
      `}</style>

      <nav className="navbar navbar-expand-lg navbar-dark cb-navbar">
        <div className="container">
          <Link className="cb-brand" to="/" onClick={closeMenus} aria-label="Campus Bite Home">
            <img
              src="/campus-bite-logo.png"
              alt="Campus Bite"
              className="cb-logo"
              onError={(event) => { event.currentTarget.style.display = "none"; }}
            />
            <span>
              <span className="cb-brand-title">Campus <span>Bite</span></span>
              <span className="cb-brand-subtitle d-block">Smart Pre-Order · Easy Pickup</span>
            </span>
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileMenuOpen}
            onClick={() => {
              setMobileMenuOpen((open) => !open);
              setUserMenuOpen(false);
            }}
          >
            <span className="navbar-toggler-icon" />
          </button>

          <div className={`collapse navbar-collapse ${mobileMenuOpen ? "show" : ""}`}>
            <ul className="navbar-nav ms-auto align-items-lg-center cb-nav-list">
              <li className="nav-item">
                <Link className={navClass("/")} to="/" onClick={closeMenus}>
                  <span aria-hidden="true">⌂</span> Home
                </Link>
              </li>

              {user?.role === "student" && (
                <>
                  <li className="nav-item">
                    <Link className={navClass("/canteen-menu")} to="/canteen-menu" onClick={closeMenus}>
                      <span aria-hidden="true">🍔</span> Menu
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className={navClass("/cart")} to="/cart" onClick={closeMenus}>
                      <span aria-hidden="true">🛒</span> Cart
                      {cartCount > 0 && <span className="cb-cart-count">{cartCount}</span>}
                    </Link>
                  </li>
                  <li className="nav-item">
                    <Link className={navClass("/my-orders")} to="/my-orders" onClick={closeMenus}>
                      <span aria-hidden="true">📦</span> My Orders
                    </Link>
                  </li>
                </>
              )}

              {user?.role === "staff" && (
                <li className="nav-item">
                  <Link className={navClass("/staff/dashboard")} to="/staff/dashboard" onClick={closeMenus}>
                    <span aria-hidden="true">👨‍🍳</span> Staff Dashboard
                  </Link>
                </li>
              )}

              {user?.role === "admin" && (
                <li className="nav-item">
                  <Link className={navClass("/admin/dashboard")} to="/admin/dashboard" onClick={closeMenus}>
                    <span aria-hidden="true">▦</span> Admin Dashboard
                  </Link>
                </li>
              )}

              {!user && (
                <li className="nav-item ms-lg-2">
                  <div className="d-flex gap-2 cb-auth-actions">
                    <button type="button" className="cb-auth-btn cb-login" onClick={handleLogin}>Login</button>
                    <button type="button" className="cb-auth-btn cb-register" onClick={handleRegister}>Register</button>
                  </div>
                </li>
              )}

              {user && (
                <li className="nav-item ms-lg-2">
                  <div className="cb-user-wrap">
                    <button
                      type="button"
                      className="cb-user-btn"
                      aria-expanded={userMenuOpen}
                      onClick={() => setUserMenuOpen((open) => !open)}
                    >
                      <span className="cb-avatar">
                        {(user.name || user.email || "U").charAt(0).toUpperCase()}
                      </span>
                      <span className="cb-user-name">{user.name || user.email || "User"}</span>
                      <span aria-hidden="true">⌄</span>
                    </button>

                    {userMenuOpen && (
                      <div className="cb-user-menu">
                        <div className="cb-user-info">
                          <div className="cb-user-info-name">{user.name || "Campus Bite User"}</div>
                          <div className="cb-user-info-email">{user.email}</div>
                          <span className="cb-role-pill">{user.role}</span>
                        </div>

                        {user.role === "student" && (
                          <>
                            <Link className="dropdown-item" to="/canteen-menu" onClick={closeMenus}>🍔 Canteen Menu</Link>
                            <Link className="dropdown-item" to="/cart" onClick={closeMenus}>🛒 Cart {cartCount > 0 ? `(${cartCount})` : ""}</Link>
                            <Link className="dropdown-item" to="/my-orders" onClick={closeMenus}>📦 My Orders</Link>
                          </>
                        )}
                        {user.role === "staff" && (
                          <Link className="dropdown-item" to="/staff/dashboard" onClick={closeMenus}>👨‍🍳 Staff Dashboard</Link>
                        )}
                        {user.role === "admin" && (
                          <Link className="dropdown-item" to="/admin/dashboard" onClick={closeMenus}>▦ Admin Dashboard</Link>
                        )}
                        <div className="dropdown-divider" />
                        <button type="button" className="dropdown-item text-danger" onClick={handleLogout}>↪ Logout</button>
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
