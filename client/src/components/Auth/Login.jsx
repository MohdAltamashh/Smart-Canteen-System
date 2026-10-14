
import React, { useState } from "react";
import axios from "axios";
import auth from "../../api/auth";
import { useHistory, useParams } from "react-router-dom";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const Login = ({ setIsLoggedIn, onLoginSuccess }) => {
  const history = useHistory();
  const { role: urlRole } = useParams();

  // Existing login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(urlRole || "student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password state
  const [forgotMode, setForgotMode] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOtp, setResetOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // ==========================================
  // EXISTING LOGIN
  // ==========================================

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

      const token = response?.token || response?.data?.token;

      if (!token) {
        throw new Error(
          "Login successful but token was not received."
        );
      }

      localStorage.setItem("token", token);

      if (setIsLoggedIn) {
        setIsLoggedIn(true);
      }

      window.dispatchEvent(new Event("authChanged"));

      if (onLoginSuccess) {
        onLoginSuccess(
          response?.data ? response : { data: response },
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
          "Login failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // OPEN FORGOT PASSWORD
  // ==========================================

  const openForgotPassword = () => {
    setResetEmail(email.trim());
    setResetStep(1);
    setResetOtp("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
    setResetMessage("");
    setError("");
    setForgotMode(true);
  };

  // ==========================================
  // BACK TO LOGIN
  // ==========================================

  const backToLogin = () => {
    setForgotMode(false);
    setResetStep(1);
    setResetOtp("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setResetError("");
    setResetMessage("");
    setResetLoading(false);
  };

  // ==========================================
  // STEP 1: SEND PASSWORD RESET OTP
  // ==========================================

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    setResetError("");
    setResetMessage("");

    const cleanEmail = resetEmail.trim().toLowerCase();

    if (!cleanEmail) {
      setResetError("Please enter your registered email.");
      return;
    }

    setResetLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/auth/forgot-password`,
        { email: cleanEmail }
      );

      setResetEmail(cleanEmail);
      setResetStep(2);

      setResetMessage(
        response.data?.message ||
          "If an eligible account exists, an OTP will be sent."
      );
    } catch (err) {
      setResetError(
        err?.response?.data?.message ||
          "Unable to request OTP. Please try again."
      );
    } finally {
      setResetLoading(false);
    }
  };

  // ==========================================
  // STEP 2: VERIFY OTP
  // ==========================================

  const handleVerifyResetOtp = async (e) => {
    e.preventDefault();

    setResetError("");
    setResetMessage("");

    if (!/^\d{6}$/.test(resetOtp)) {
      setResetError("Please enter the valid 6-digit OTP.");
      return;
    }

    setResetLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/auth/verify-reset-otp`,
        {
          email: resetEmail.trim().toLowerCase(),
          otp: resetOtp.trim(),
        }
      );

      if (!response.data?.resetToken) {
        throw new Error("Reset token was not received.");
      }

      setResetToken(response.data.resetToken);
      setResetStep(3);
      setResetMessage(
        "OTP verified successfully. Set your new password."
      );
    } catch (err) {
      setResetError(
        err?.response?.data?.message ||
          err?.message ||
          "OTP verification failed. Please try again."
      );
    } finally {
      setResetLoading(false);
    }
  };

  // ==========================================
  // STEP 3: RESET PASSWORD
  // ==========================================

  const handleResetPassword = async (e) => {
    e.preventDefault();

    setResetError("");
    setResetMessage("");

    if (newPassword.length < 6) {
      setResetError(
        "Password must be at least 6 characters long."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    if (!resetToken) {
      setResetError(
        "Reset session is missing. Please start again."
      );
      return;
    }

    setResetLoading(true);

    try {
      const response = await axios.post(
        `${API_URL}/auth/reset-password`,
        {
          resetToken,
          password: newPassword,
        }
      );

      setResetMessage(
        response.data?.message ||
          "Password reset successfully. Please log in."
      );

      setPassword("");
      setEmail(resetEmail.trim().toLowerCase());
      setNewPassword("");
      setConfirmPassword("");
      setResetOtp("");
      setResetToken("");
      setResetStep(1);
      setForgotMode(false);
    } catch (err) {
      setResetError(
        err?.response?.data?.message ||
          "Password reset failed. Please try again."
      );
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="campus-login">
      <style>{`
        .campus-login {
          --cl-bg: #080d18;
          --cl-blue: #3984ff;
          --cl-orange: #ffad66;
          --cl-muted: #a4b1c5;
          min-height: 100vh;
          width: 100%;
          padding: 28px 20px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          isolation: isolate;
          overflow-x: hidden;
          color: #f8fafc;
          background:
            radial-gradient(ellipse at 12% 15%, rgba(38,99,235,.20), transparent 38%),
            radial-gradient(ellipse at 90% 85%, rgba(255,157,86,.09), transparent 30%),
            var(--cl-bg);
          font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        }

        .campus-login *,
        .campus-login *::before,
        .campus-login *::after {
          box-sizing: border-box;
        }

        .cl-header,
        .cl-layout,
        .cl-footer {
          width: 100%;
          max-width: 1040px;
        }

        .cl-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 22px;
        }

        .cl-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .cl-logo {
          width: 46px;
          height: 46px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(93,153,255,.3);
          border-radius: 14px;
          background: rgba(57,132,255,.13);
          font-size: 24px;
        }

        .cl-brand-name {
          font-size: 20px;
          line-height: 1.2;
          font-weight: 850;
          color: #fff;
        }

        .cl-brand-name span {
          color: var(--cl-orange);
        }

        .cl-brand-tagline {
          margin-top: 5px;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 1.4px;
          color: var(--cl-muted);
        }

        .cl-home-button {
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 10px;
          padding: 10px 15px;
          color: #f8fafc;
          background: rgba(255,255,255,.045);
          cursor: pointer;
          font-size: 12px;
          font-weight: 750;
          white-space: nowrap;
          transition: .2s ease;
        }

        .cl-home-button:hover {
          border-color: var(--cl-orange);
          color: var(--cl-orange);
        }

        .cl-layout {
          display: grid;
          grid-template-columns: minmax(0,.9fr) minmax(0,1.1fr);
          align-items: stretch;
          border: 1px solid rgba(255,255,255,.13);
          border-radius: 22px;
          overflow: hidden;
          background: #0d1728;
          box-shadow: 0 28px 85px rgba(0,0,0,.35);
        }

        .cl-intro {
          min-width: 0;
          padding: 42px 32px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background:
            radial-gradient(circle at 5% 95%, rgba(255,173,102,.10), transparent 38%),
            linear-gradient(145deg,#172b49,#0c1729);
          border-right: 1px solid rgba(255,255,255,.10);
        }

        .cl-badge {
          width: fit-content;
          max-width: 100%;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 23px;
          padding: 8px 11px;
          border: 1px solid rgba(255,173,102,.25);
          border-radius: 30px;
          background: rgba(255,173,102,.07);
          color: #ffd0a7;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1.2px;
        }

        .cl-dot {
          width: 6px;
          height: 6px;
          flex-shrink: 0;
          border-radius: 50%;
          background: var(--cl-orange);
        }

        .cl-intro h1 {
          margin: 0 0 17px;
          color: #fff;
          font-size: clamp(30px,3.3vw,42px);
          line-height: 1.12;
          letter-spacing: -1.5px;
          font-weight: 900;
        }

        .cl-intro h1 span {
          color: var(--cl-orange);
        }

        .cl-intro-description {
          margin: 0 0 27px;
          color: #b1bfd3;
          font-size: 12px;
          line-height: 1.9;
        }

        .cl-feature-list {
          display: grid;
          gap: 18px;
        }

        .cl-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .cl-feature-icon {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(86,146,255,.20);
          border-radius: 12px;
          background: rgba(57,132,255,.10);
          font-size: 19px;
        }

        .cl-feature-title {
          color: #f8fafc;
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .cl-feature-text {
          color: #99abc3;
          font-size: 10px;
          line-height: 1.6;
        }

        .cl-form-panel {
          min-width: 0;
          padding: 36px clamp(20px,3.5vw,42px);
          background: rgba(10,18,32,.92);
        }

        .cl-form-title {
          margin: 0 0 8px;
          color: #fff;
          font-size: 27px;
          font-weight: 850;
          letter-spacing: -.8px;
        }

        .cl-form-subtitle {
          margin: 0;
          color: var(--cl-muted);
          font-size: 12px;
          line-height: 1.8;
        }

        .cl-role-tabs {
          display: grid;
          grid-template-columns: repeat(3,minmax(0,1fr));
          gap: 8px;
          margin: 24px 0;
        }

        .cl-role-option {
          min-width: 0;
          min-height: 70px;
          padding: 10px 5px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 11px;
          background: rgba(255,255,255,.035);
          color: #a4b1c5;
          font-family: inherit;
          font-size: 10px;
          font-weight: 750;
          cursor: pointer;
          transition: .2s ease;
        }

        .cl-role-option:hover {
          border-color: rgba(57,132,255,.45);
        }

        .cl-role-option.active {
          color: #fff;
          border-color: rgba(57,132,255,.75);
          background: rgba(57,132,255,.12);
          box-shadow: inset 0 0 0 1px rgba(57,132,255,.12);
        }

        .cl-role-icon {
          font-size: 20px;
          line-height: 1;
        }

        .cl-field {
          margin-bottom: 17px;
        }

        .cl-label {
          display: block;
          margin-bottom: 8px;
          color: #dce6f5;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .8px;
        }

        .cl-input-wrap {
          position: relative;
        }

        .cl-input-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #92a5c0;
          font-size: 15px;
          pointer-events: none;
        }

        .cl-input {
          display: block;
          width: 100%;
          height: 48px;
          padding: 0 43px;
          border: 1px solid rgba(255,255,255,.13);
          border-radius: 10px;
          outline: none;
          color: #f8fafc;
          background: rgba(255,255,255,.045);
          font-family: inherit;
          font-size: 12px;
          transition: border-color .2s, box-shadow .2s;
        }

        .cl-input::placeholder {
          color: #74869f;
        }

        .cl-input:focus {
          border-color: var(--cl-blue);
          box-shadow: 0 0 0 3px rgba(57,132,255,.12);
        }

        .cl-password-input {
          padding-right: 47px;
        }

        .cl-eye {
          position: absolute;
          right: 11px;
          top: 50%;
          transform: translateY(-50%);
          padding: 5px;
          border: 0;
          background: transparent;
          color: #c1cede;
          cursor: pointer;
          font-size: 16px;
        }

        .cl-alert {
          padding: 11px 13px;
          margin-bottom: 16px;
          border-radius: 9px;
          font-size: 12px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .cl-alert-error {
          color: #ffb8c1;
          background: rgba(225,29,72,.10);
          border: 1px solid rgba(251,113,133,.25);
        }

        .cl-alert-success {
          color: #a7f3d0;
          background: rgba(16,185,129,.10);
          border: 1px solid rgba(52,211,153,.25);
        }

        .cl-button {
          width: 100%;
          min-height: 48px;
          padding: 12px 15px;
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 10px;
          color: #1b202b;
          background: linear-gradient(105deg,#ffc17f,#ff9e5e);
          box-shadow: 0 8px 22px rgba(255,158,94,.13);
          font-family: inherit;
          font-size: 12px;
          font-weight: 900;
          cursor: pointer;
          transition: transform .2s, box-shadow .2s, opacity .2s;
        }

        .cl-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 11px 25px rgba(255,158,94,.22);
        }

        .cl-button:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .cl-spinner {
          display: inline-block;
          width: 13px;
          height: 13px;
          margin-right: 8px;
          vertical-align: -2px;
          border: 2px solid rgba(27,32,43,.25);
          border-top-color: #1b202b;
          border-radius: 50%;
          animation: cl-spin .7s linear infinite;
        }

        @keyframes cl-spin {
          to { transform: rotate(360deg); }
        }

        .cl-register {
          margin-top: 23px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,.10);
          text-align: center;
        }

        .cl-register-text {
          margin-bottom: 13px;
          color: #a4b1c5;
          font-size: 11px;
        }

        .cl-register-button {
          width: 100%;
          min-height: 44px;
          padding: 10px 14px;
          border: 1px solid rgba(255,173,102,.32);
          border-radius: 10px;
          background: rgba(255,173,102,.055);
          color: #ffc18e;
          font-family: inherit;
          font-size: 11px;
          font-weight: 850;
          cursor: pointer;
          transition: .2s ease;
        }

        .cl-register-button:hover {
          background: rgba(255,173,102,.12);
          border-color: var(--cl-orange);
        }

        .cl-security {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 20px;
          padding: 12px;
          border: 1px solid rgba(57,132,255,.17);
          border-radius: 10px;
          background: rgba(57,132,255,.055);
          color: #a4b4ca;
          font-size: 10px;
          line-height: 1.8;
        }

        .cl-security strong {
          color: #e5edf8;
        }

        .cl-text-button {
          border: 0;
          padding: 8px 0;
          background: transparent;
          color: #ffad66;
          cursor: pointer;
          font-size: 12px;
          font-weight: 750;
        }

        .cl-text-button:hover {
          color: #ffd0a7;
          text-decoration: underline;
        }

        .cl-footer {
          margin-top: 18px;
          text-align: center;
          color: #7789a2;
          font-size: 10px;
          line-height: 1.8;
        }

        @media (max-width: 760px) {
          .campus-login {
            padding: 20px 12px;
            justify-content: flex-start;
          }

          .cl-header {
            margin-bottom: 18px;
          }

          .cl-layout {
            grid-template-columns: minmax(0,1fr);
            max-width: 490px;
          }

          .cl-intro {
            display: none;
          }

          .cl-form-panel {
            padding: 28px 22px;
          }

          .cl-form-title {
            font-size: 25px;
          }
        }

        @media (max-width: 380px) {
          .campus-login {
            padding: 15px 9px;
          }

          .cl-brand-name {
            font-size: 18px;
          }

          .cl-brand-tagline {
            font-size: 8px;
            letter-spacing: 1px;
          }

          .cl-home-button {
            padding: 9px 11px;
          }

          .cl-form-panel {
            padding: 23px 16px;
          }

          .cl-role-tabs {
            gap: 5px;
          }

          .cl-role-option {
            font-size: 9px;
          }
        }
      `}</style>

      {/* HEADER */}

      <header className="cl-header">
        <div className="cl-brand">
          <div className="cl-logo">🍔</div>

          <div>
            <div className="cl-brand-name">
              Campus <span>Bite</span>
            </div>

            <div className="cl-brand-tagline">
              SMART PRE-ORDER · EASY PICKUP
            </div>
          </div>
        </div>

        <button
          type="button"
          className="cl-home-button"
          onClick={() => history.push("/")}
        >
          ← Home
        </button>
      </header>

      {/* MAIN */}

      <main className="cl-layout">
        {/* INTRO PANEL */}

        <section className="cl-intro">
          <div className="cl-badge">
            <span className="cl-dot" />
            CAMPUS BITE / WELCOME BACK
          </div>

          <h1>
            Your campus.
            <br />
            Your cravings.
            <br />
            <span>Your way.</span>
          </h1>

          <p className="cl-intro-description">
            Your campus food experience starts here.
            Sign in to discover food courts, place orders
            and pick up your favourites with a smart
            digital token.
          </p>

          <div className="cl-feature-list">
            <div className="cl-feature">
              <div className="cl-feature-icon">🍔</div>
              <div>
                <div className="cl-feature-title">
                  Easy Food Ordering
                </div>
                <div className="cl-feature-text">
                  Explore menus and order your favourites.
                </div>
              </div>
            </div>

            <div className="cl-feature">
              <div className="cl-feature-icon">🎟️</div>
              <div>
                <div className="cl-feature-title">
                  Smart Digital Tokens
                </div>
                <div className="cl-feature-text">
                  Skip the queue and enjoy easy pickup.
                </div>
              </div>
            </div>

            <div className="cl-feature">
              <div className="cl-feature-icon">🔔</div>
              <div>
                <div className="cl-feature-title">
                  Live Order Updates
                </div>
                <div className="cl-feature-text">
                  Stay updated on your order status.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FORM PANEL */}

        <section className="cl-form-panel">
          <h2 className="cl-form-title">
            {forgotMode ? "Reset Password." : "Welcome back."}
          </h2>

          <p className="cl-form-subtitle">
            {forgotMode
              ? "Recover access to your Campus Bite account."
              : "Sign in to continue your Campus Bite experience."}
          </p>

          {/* ROLE SELECTOR: PRESERVED */}

          {!forgotMode && (
            <div className="cl-role-tabs">
              <button
                type="button"
                className={`cl-role-option ${
                  role === "student" ? "active" : ""
                }`}
                onClick={() => setRole("student")}
                aria-pressed={role === "student"}
              >
                <span className="cl-role-icon">🎓</span>
                Student
              </button>

              <button
                type="button"
                className={`cl-role-option ${
                  role === "staff" ? "active" : ""
                }`}
                onClick={() => setRole("staff")}
                aria-pressed={role === "staff"}
              >
                <span className="cl-role-icon">👨‍🍳</span>
                Staff
              </button>

              <button
                type="button"
                className={`cl-role-option ${
                  role === "admin" ? "active" : ""
                }`}
                onClick={() => setRole("admin")}
                aria-pressed={role === "admin"}
              >
                <span className="cl-role-icon">🛡️</span>
                Admin
              </button>
            </div>
          )}

          {/* RESET MESSAGES */}

          {resetMessage && (
            <div
              className="cl-alert cl-alert-success"
              role="status"
            >
              {resetMessage}
            </div>
          )}

          {resetError && (
            <div
              className="cl-alert cl-alert-error"
              role="alert"
            >
              ⚠️ {resetError}
            </div>
          )}

          {/* ======================================
              FORGOT PASSWORD FLOW
          ====================================== */}

          {forgotMode ? (
            <>
              <p
                className="cl-form-subtitle"
                style={{ marginTop: 16, marginBottom: 20 }}
              >
                {resetStep === 1 &&
                  "Step 1 of 3 — Enter your registered email."}

                {resetStep === 2 &&
                  "Step 2 of 3 — Enter the 6-digit OTP sent to your email."}

                {resetStep === 3 &&
                  "Step 3 of 3 — Create your new password."}
              </p>

              {/* STEP 1: EMAIL */}

              {resetStep === 1 && (
                <form onSubmit={handleForgotPassword}>
                  <div className="cl-field">
                    <label
                      className="cl-label"
                      htmlFor="reset-email"
                    >
                      REGISTERED EMAIL
                    </label>

                    <div className="cl-input-wrap">
                      <span className="cl-input-icon">✉</span>

                      <input
                        id="reset-email"
                        type="email"
                        className="cl-input"
                        placeholder="Enter your registered email"
                        value={resetEmail}
                        onChange={(e) =>
                          setResetEmail(e.target.value)
                        }
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="cl-button"
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <>
                        <span className="cl-spinner" />
                        Sending OTP...
                      </>
                    ) : (
                      "Send OTP →"
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: VERIFY OTP */}

              {resetStep === 2 && (
                <form onSubmit={handleVerifyResetOtp}>
                  <div className="cl-field">
                    <label
                      className="cl-label"
                      htmlFor="reset-otp"
                    >
                      6-DIGIT OTP
                    </label>

                    <input
                      id="reset-otp"
                      type="text"
                      className="cl-input"
                      style={{ paddingLeft: 14 }}
                      placeholder="Enter OTP"
                      value={resetOtp}
                      onChange={(e) =>
                        setResetOtp(
                          e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 6)
                        )
                      }
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      maxLength={6}
                      autoComplete="one-time-code"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="cl-button"
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <>
                        <span className="cl-spinner" />
                        Verifying OTP...
                      </>
                    ) : (
                      "Verify OTP →"
                    )}
                  </button>

                  <div style={{ marginTop: 12 }}>
                    <button
                      type="button"
                      className="cl-text-button"
                      onClick={() => {
                        setResetStep(1);
                        setResetOtp("");
                        setResetToken("");
                        setResetError("");
                        setResetMessage("");
                      }}
                    >
                      Change email
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 3: NEW PASSWORD */}

              {resetStep === 3 && (
                <form onSubmit={handleResetPassword}>
                  <div className="cl-field">
                    <label
                      className="cl-label"
                      htmlFor="new-password"
                    >
                      NEW PASSWORD
                    </label>

                    <input
                      id="new-password"
                      type="password"
                      className="cl-input"
                      style={{ paddingLeft: 14 }}
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) =>
                        setNewPassword(e.target.value)
                      }
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </div>

                  <div className="cl-field">
                    <label
                      className="cl-label"
                      htmlFor="confirm-password"
                    >
                      CONFIRM NEW PASSWORD
                    </label>

                    <input
                      id="confirm-password"
                      type="password"
                      className="cl-input"
                      style={{ paddingLeft: 14 }}
                      placeholder="Enter password again"
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(e.target.value)
                      }
                      autoComplete="new-password"
                      minLength={6}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="cl-button"
                    disabled={resetLoading}
                  >
                    {resetLoading ? (
                      <>
                        <span className="cl-spinner" />
                        Updating Password...
                      </>
                    ) : (
                      "Reset Password →"
                    )}
                  </button>
                </form>
              )}

              <button
                type="button"
                className="cl-register-button"
                style={{ marginTop: 16 }}
                onClick={backToLogin}
              >
                ← Back to Login
              </button>
            </>
          ) : (
            <>
              {/* EXISTING LOGIN ERROR */}

              {error && (
                <div
                  className="cl-alert cl-alert-error"
                  role="alert"
                >
                  ⚠️ {error}
                </div>
              )}

              {/* EXISTING LOGIN FORM */}

              <form onSubmit={handleSubmit}>
                <div className="cl-field">
                  <label
                    className="cl-label"
                    htmlFor="cl-email"
                  >
                    EMAIL ADDRESS
                  </label>

                  <div className="cl-input-wrap">
                    <span className="cl-input-icon">✉</span>

                    <input
                      id="cl-email"
                      type="email"
                      className="cl-input"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="cl-field">
                  <label
                    className="cl-label"
                    htmlFor="cl-password"
                  >
                    PASSWORD
                  </label>

                  <div className="cl-input-wrap">
                    <span className="cl-input-icon">🔑</span>

                    <input
                      id="cl-password"
                      type={showPassword ? "text" : "password"}
                      className="cl-input cl-password-input"
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
                      className="cl-eye"
                      onClick={() =>
                        setShowPassword((previous) => !previous)
                      }
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? "🙈" : "👁️"}
                    </button>
                  </div>
                </div>

                <div style={{ textAlign: "right", marginTop: -5, marginBottom: 16 }}>
                  <button
                    type="button"
                    className="cl-text-button"
                    onClick={openForgotPassword}
                  >
                    Forgot Password?
                  </button>
                </div>

                <button
                  type="submit"
                  className="cl-button"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="cl-spinner" />
                      Logging in...
                    </>
                  ) : (
                    "Login to Campus Bite →"
                  )}
                </button>
              </form>

              {/* EXISTING STUDENT REGISTRATION */}

              {role === "student" && (
                <div className="cl-register">
                  <div className="cl-register-text">
                    New to Campus Bite?
                  </div>

                  <button
                    type="button"
                    className="cl-register-button"
                    onClick={() =>
                      history.push("/register/student")
                    }
                  >
                    Create Student Account ↗️
                  </button>
                </div>
              )}

              {/* EXISTING SECURITY MESSAGE */}

              <div className="cl-security">
                <span>🔒</span>

                <span>
                  <strong>Secure sign in</strong>
                  <br />
                  Your login is handled by the Campus Bite
                  authentication system.
                </span>
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="cl-footer">
        ©️ {new Date().getFullYear()} Campus Bite
        <br />
        SMART PRE-ORDER · EASY PICKUP
      </footer>
    </div>
  );
};

export default Login;
