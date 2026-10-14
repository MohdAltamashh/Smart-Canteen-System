
import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import CanteenMenu from "./pages/CanteenMenu";
import Cart from "./pages/Cart";
import MyOrders from "./pages/MyOrders";

import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";

import StaffDashboard from "./pages/StaffDashboard";
import TokenDisplay from "./pages/TokenDisplay";
import AdminDashboard from "./pages/AdminDashboard";

import { jwtDecode } from "jwt-decode";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userInfo, setUserInfo] = useState({});

  // ==========================================
  // CLEAR USER SESSION
  // ==========================================

  const clearSession = () => {
    localStorage.removeItem("token");

    setIsLoggedIn(false);
    setUserRole("");
    setUserEmail("");
    setUserInfo({});
  };

  // ==========================================
  // LOAD EXISTING TOKEN ON APP START
  // ==========================================

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      clearSession();
      return;
    }

    try {
      const decoded = jwtDecode(token);

      // Reject expired or invalid-expiry tokens.
      if (
        !decoded.exp ||
        decoded.exp * 1000 <= Date.now()
      ) {
        const role = decoded.role;

        clearSession();

        window.alert(
          "Your session has expired. Please login again."
        );

        window.location.replace(
          `/login/${
            ["student", "staff", "admin"].includes(role)
              ? role
              : "student"
          }`
        );

        return;
      }

      setIsLoggedIn(true);
      setUserRole(decoded.role || "");

      setUserEmail(
        decoded.role === "admin"
          ? "Admin"
          : decoded.email || ""
      );

      setUserInfo({
        name: decoded.name || "",
        department: decoded.department || "",
        email: decoded.email || "",
      });
    } catch (error) {
      console.error("Invalid token:", error.message);

      clearSession();
    }
  }, []);

  // ==========================================
  // AUTOMATIC JWT EXPIRY HANDLING
  // ==========================================

  useEffect(() => {
    if (!isLoggedIn) {
      return undefined;
    }

    const token = localStorage.getItem("token");

    if (!token) {
      clearSession();
      return undefined;
    }

    let timeoutId;

    try {
      const decoded = jwtDecode(token);

      const role = ["student", "staff", "admin"].includes(
        decoded.role
      )
        ? decoded.role
        : "student";

      if (!decoded.exp) {
        clearSession();
        return undefined;
      }

      const expiresIn = decoded.exp * 1000 - Date.now();

      const handleExpiredSession = () => {
        localStorage.removeItem("token");

        setIsLoggedIn(false);
        setUserRole("");
        setUserEmail("");
        setUserInfo({});

        window.alert(
          "Your session has expired. Please login again."
        );

        window.location.replace(`/login/${role}`);
      };

      if (expiresIn <= 0) {
        handleExpiredSession();
        return undefined;
      }

      // Schedule popup for the exact expiry time.
      timeoutId = setTimeout(
        handleExpiredSession,
        Math.min(expiresIn, 2147483647)
      );

      return () => {
        clearTimeout(timeoutId);
      };
    } catch (error) {
      console.error("Token expiry check failed:", error.message);

      clearSession();
      return undefined;
    }
  }, [isLoggedIn]);

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    clearSession();
    window.location.href = "/";
  };

  // ==========================================
  // LOGIN SUCCESS
  // ==========================================

  const handleLoginSuccess = (response, history) => {
    const token = response?.data?.token;
    const user = response?.data?.user;

    if (!token || !user) {
      window.alert(
        "Login response was incomplete. Please try again."
      );
      return;
    }

    localStorage.setItem("token", token);

    setIsLoggedIn(true);
    setUserRole(user.role);

    setUserEmail(
      user.role === "admin" ? "Admin" : user.email
    );

    setUserInfo({
      name: user.name || "",
      department: user.department || "",
      email: user.email || "",
    });

    if (user.role === "admin") {
      history.push("/admin/dashboard");
    } else if (user.role === "staff") {
      history.push("/staff/dashboard");
    } else {
      history.push("/");
    }
  };

  // ==========================================
  // APP ROUTES
  // ==========================================

  return (
    <Router>
      <Navbar
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        userRole={userRole}
        userEmail={userEmail}
        userInfo={userInfo}
      />

      <Switch>
        {/* LOGIN */}
        <Route
          path="/login/:role"
          render={(props) =>
            isLoggedIn ? (
              <Redirect to="/" />
            ) : (
              <Login
                {...props}
                setIsLoggedIn={setIsLoggedIn}
                onLoginSuccess={handleLoginSuccess}
              />
            )
          }
        />

        {/* REGISTER */}
        <Route
          path="/register/:role"
          render={(props) =>
            isLoggedIn ? (
              <Redirect to="/" />
            ) : (
              <Register {...props} />
            )
          }
        />

        {/* STUDENT - CANTEEN MENU */}
        <Route path="/canteen-menu">
          {isLoggedIn && userRole === "student" ? (
            <CanteenMenu />
          ) : (
            <Redirect to="/" />
          )}
        </Route>

        {/* STUDENT - CART */}
        <Route path="/cart">
          {isLoggedIn && userRole === "student" ? (
            <Cart />
          ) : (
            <Redirect to="/" />
          )}
        </Route>

        {/* STUDENT - MY ORDERS */}
        <Route path="/my-orders">
          {isLoggedIn && userRole === "student" ? (
            <MyOrders />
          ) : (
            <Redirect to="/" />
          )}
        </Route>

        {/* STAFF DASHBOARD */}
        <Route path="/staff/dashboard">
          {isLoggedIn && userRole === "staff" ? (
            <StaffDashboard />
          ) : (
            <Redirect to="/login/staff" />
          )}
        </Route>

        {/* STAFF - TOKEN DISPLAY */}
        <Route path="/token-display">
          {isLoggedIn && userRole === "staff" ? (
            <TokenDisplay />
          ) : (
            <Redirect to="/login/staff" />
          )}
        </Route>

        {/* ADMIN DASHBOARD */}
        <Route path="/admin/dashboard">
          {isLoggedIn && userRole === "admin" ? (
            <AdminDashboard />
          ) : (
            <Redirect to="/login/admin" />
          )}
        </Route>

        {/* HOME */}
        <Route path="/" exact>
          <Home
            userEmail={userEmail}
            userRole={userRole}
            isLoggedIn={isLoggedIn}
          />
        </Route>

        {/* FALLBACK */}
        <Route path="*">
          <Redirect to="/" />
        </Route>
      </Switch>
    </Router>
  );
};

export default App;
