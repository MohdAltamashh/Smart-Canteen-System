import React, { useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  Redirect,
} from "react-router-dom";

import Navbar from "./components/Navbar";

// =====================================================
// MAIN PAGES
// =====================================================

import Home from "./pages/Home";
import CanteenMenu from "./pages/CanteenMenu";
import Cart from "./pages/Cart";
import MyOrders from "./pages/MyOrders";

// =====================================================
// AUTHENTICATION
// =====================================================

import Login from "./components/Auth/Login";
import Register from "./components/Auth/Register";

// =====================================================
// STAFF & ADMIN
// =====================================================

import StaffDashboard from "./pages/StaffDashboard";
import TokenDisplay from "./pages/TokenDisplay";
import AdminDashboard from "./pages/AdminDashboard";

// =====================================================
// JWT
// =====================================================

import { jwtDecode } from "jwt-decode";

const App = () => {

  // =====================================================
  // USER STATE
  // =====================================================

  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const [userRole, setUserRole] = useState("");

  const [userEmail, setUserEmail] = useState("");

  const [userInfo, setUserInfo] = useState({});


  // =====================================================
  // LOAD USER FROM TOKEN
  // =====================================================

  useEffect(() => {

    const token = localStorage.getItem("token");

    if (!token) {

      setIsLoggedIn(false);
      setUserRole("");
      setUserEmail("");
      setUserInfo({});

      return;
    }

    try {

      const decoded = jwtDecode(token);

      setIsLoggedIn(true);

      setUserRole(decoded.role || "");

      setUserEmail(
        decoded.role === "admin"
          ? "Admin"
          : decoded.email || ""
      );

      setUserInfo({

        name: decoded.name || "",

        department:
          decoded.department || "",

        email:
          decoded.email || "",

      });

    } catch (error) {

      console.error(
        "Invalid token:",
        error
      );

      localStorage.removeItem("token");

      setIsLoggedIn(false);
      setUserRole("");
      setUserEmail("");
      setUserInfo({});

    }

  }, []);


  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {

    localStorage.removeItem("token");

    setIsLoggedIn(false);

    setUserRole("");

    setUserEmail("");

    setUserInfo({});

    window.location.href = "/";

  };


  // =====================================================
  // LOGIN SUCCESS
  // =====================================================

  const handleLoginSuccess = (
    response,
    history
  ) => {

    const token =
      response.data.token;

    const user =
      response.data.user;

    localStorage.setItem(
      "token",
      token
    );

    setIsLoggedIn(true);

    setUserRole(user.role);

    setUserEmail(
      user.role === "admin"
        ? "Admin"
        : user.email
    );

    setUserInfo({

      name: user.name,

      department:
        user.department,

      email:
        user.email,

    });

    // =================================================
    // ROLE BASED REDIRECT
    // =================================================

    if (user.role === "admin") {

      history.push(
        "/admin/dashboard"
      );

    } else if (user.role === "staff") {

      history.push(
        "/staff/dashboard"
      );

    } else {

      history.push("/");

    }

  };


  // =====================================================
  // APP
  // =====================================================

  return (

    <Router>

      {/* ================================================= */}
      {/* NAVBAR */}
      {/* ================================================= */}

      <Navbar
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        userRole={userRole}
        userEmail={userEmail}
        userInfo={userInfo}
      />


      {/* ================================================= */}
      {/* ROUTES */}
      {/* ================================================= */}

      <Switch>

        {/* ================================================= */}
        {/* LOGIN */}
        {/* ================================================= */}

        <Route
          path="/login/:role"
          render={(props) => (

            isLoggedIn ? (

              <Redirect to="/" />

            ) : (

              <Login
                {...props}
                setIsLoggedIn={
                  setIsLoggedIn
                }
                onLoginSuccess={
                  handleLoginSuccess
                }
              />

            )

          )}
        />


        {/* ================================================= */}
        {/* REGISTER */}
        {/* ================================================= */}

        <Route
          path="/register/:role"
          render={(props) => (

            isLoggedIn ? (

              <Redirect to="/" />

            ) : (

              <Register
                {...props}
              />

            )

          )}
        />


        {/* ================================================= */}
        {/* STUDENT - CANTEEN MENU */}
        {/* ================================================= */}

        <Route path="/canteen-menu">

          {isLoggedIn &&
          userRole === "student" ? (

            <CanteenMenu />

          ) : (

            <Redirect to="/" />

          )}

        </Route>


        {/* ================================================= */}
        {/* STUDENT - CART */}
        {/* ================================================= */}

        <Route path="/cart">

          {isLoggedIn &&
          userRole === "student" ? (

            <Cart />

          ) : (

            <Redirect to="/" />

          )}

        </Route>


        {/* ================================================= */}
        {/* STUDENT - MY ORDERS */}
        {/* ================================================= */}

        <Route path="/my-orders">

          {isLoggedIn &&
          userRole === "student" ? (

            <MyOrders />

          ) : (

            <Redirect to="/" />

          )}

        </Route>


        {/* ================================================= */}
        {/* STAFF DASHBOARD */}
        {/* ================================================= */}

        <Route path="/staff/dashboard">

          {isLoggedIn &&
          userRole === "staff" ? (

            <StaffDashboard />

          ) : (

            <Redirect to="/login/staff" />

          )}

        </Route>


        {/* ================================================= */}
        {/* STAFF - TOKEN DISPLAY */}
        {/* ================================================= */}

        <Route path="/token-display">

          {isLoggedIn &&
          userRole === "staff" ? (

            <TokenDisplay />

          ) : (

            <Redirect to="/login/staff" />

          )}

        </Route>


        {/* ================================================= */}
        {/* ADMIN DASHBOARD */}
        {/* ================================================= */}

        <Route path="/admin/dashboard">

          {isLoggedIn &&
          userRole === "admin" ? (

            <AdminDashboard />

          ) : (

            <Redirect to="/login/admin" />

          )}

        </Route>


        {/* ================================================= */}
        {/* HOME */}
        {/* ================================================= */}

        <Route
          path="/"
          exact
        >

          <Home
            userEmail={userEmail}
            userRole={userRole}
            isLoggedIn={isLoggedIn}
          />

        </Route>


        {/* ================================================= */}
        {/* FALLBACK */}
        {/* ================================================= */}

        <Route path="*">

          <Redirect to="/" />

        </Route>

      </Switch>

    </Router>

  );

};

export default App;