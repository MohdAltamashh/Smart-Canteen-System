import React, { useState } from "react";
import auth from "../../api/auth";
import { useHistory, useParams } from "react-router-dom";

const Login = ({ setIsLoggedIn, onLoginSuccess }) => {
  const history = useHistory();
  const { role: urlRole } = useParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(urlRole || "student");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // =====================================================
  // LOGIN
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await auth.login({
        email,
        password,
        role,
      });

      console.log("Login response:", response);

      const token =
        response?.token ||
        response?.data?.token;

      if (!token) {
        throw new Error(
          "Login successful but token was not received."
        );
      }

      localStorage.setItem("token", token);

      setIsLoggedIn(true);

      window.dispatchEvent(
        new Event("authChanged")
      );

      if (onLoginSuccess) {
        onLoginSuccess(
          response?.data
            ? response
            : {
                data: response,
              },
          history
        );

        return;
      }

      if (role === "staff") {
        history.push("/staff/dashboard");
      } else if (role === "admin") {
        history.push("/admin/dashboard");
      } else {
        history.push("/");
      }

    } catch (err) {
      console.error("Login error:", err);

      setError(
        err?.response?.data?.message ||
        err?.message ||
        "Login failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REGISTER
  // =====================================================

  const goToRegister = () => {
    history.push(`/register/${role}`);
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="auth-page">

      <div className="auth-container">

        {/* ================================================= */}
        {/* BRAND / INTRO */}
        {/* ================================================= */}

        <div className="auth-intro">

          <div className="auth-logo">
            🎟️
          </div>

          <h1>
            Smart Canteen
          </h1>

          <p>
            Smart ordering, digital tokens
            and faster campus dining.
          </p>

          <div className="auth-features">

            <div>
              🍔
              <span>
                Easy Food Ordering
              </span>
            </div>

            <div>
              🎟️
              <span>
                Digital Token System
              </span>
            </div>

            <div>
              🔔
              <span>
                Real-Time Order Updates
              </span>
            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* LOGIN CARD */}
        {/* ================================================= */}

        <div className="auth-card">

          <div className="text-center mb-4">

            <div className="auth-card-icon">
              🔐
            </div>

            <h2 className="fw-bold mb-1">
              Welcome Back
            </h2>

            <p className="text-muted mb-0">
              Login to your Smart Canteen account
            </p>

          </div>

          {/* ================================================= */}
          {/* ERROR */}
          {/* ================================================= */}

          {error && (
            <div
              className="alert alert-danger d-flex align-items-start"
              role="alert"
            >
              <span className="me-2">
                ⚠️
              </span>

              <div>
                {error}
              </div>
            </div>
          )}

          {/* ================================================= */}
          {/* FORM */}
          {/* ================================================= */}

          <form onSubmit={handleSubmit}>

            {/* EMAIL */}

            <div className="mb-3">

              <label
                htmlFor="loginEmail"
                className="form-label fw-semibold"
              >
                Email Address
              </label>

              <div className="input-group">

                <span className="input-group-text">
                  📧
                </span>

                <input
                  id="loginEmail"
                  type="email"
                  className="form-control"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  autoComplete="email"
                  required
                />

              </div>

            </div>

            {/* PASSWORD */}

            <div className="mb-3">

              <label
                htmlFor="loginPassword"
                className="form-label fw-semibold"
              >
                Password
              </label>

              <div className="input-group">

                <span className="input-group-text">
                  🔑
                </span>

                <input
                  id="loginPassword"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  autoComplete="current-password"
                  required
                />

                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() =>
                    setShowPassword(
                      (previous) =>
                        !previous
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword
                    ? "🙈"
                    : "👁️"}
                </button>

              </div>

            </div>

            {/* ROLE */}

            <div className="mb-4">

              <label
                htmlFor="loginRole"
                className="form-label fw-semibold"
              >
                Login As
              </label>

              <select
                id="loginRole"
                className="form-select"
                value={role}
                onChange={(e) =>
                  setRole(e.target.value)
                }
              >

                <option value="student">
                  👨‍🎓 Student
                </option>

                <option value="staff">
                  👨‍🍳 Faculty / Staff
                </option>

                <option value="admin">
                  👨‍💼 Admin
                </option>

              </select>

            </div>

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              className="btn btn-primary w-100 py-2 fw-bold"
              disabled={loading}
            >

              {loading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                    aria-hidden="true"
                  ></span>

                  Logging in...
                </>
              ) : (
                <>
                  🔐 Login
                </>
              )}

            </button>

          </form>

          {/* ================================================= */}
          {/* REGISTER */}
          {/* ================================================= */}

          <div className="text-center mt-4 pt-3 border-top">

            <p className="text-muted mb-2">
              Don't have an account?
            </p>

            <button
              type="button"
              className="btn btn-outline-primary"
              onClick={goToRegister}
            >
              📝 Create Student Account
            </button>

          </div>

          {/* ================================================= */}
          {/* SECURITY */}
          {/* ================================================= */}

          <div className="auth-security mt-4">

            <span>
              🔒
            </span>

            <small>
              Your login information is securely
              handled by the application.
            </small>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;