import React, { useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";

const Register = () => {
  const history = useHistory();

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000/api";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !department.trim()
    ) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/auth/send-otp`,
        {
          name: name.trim(),
          email: email.trim(),
          password,
          department: department.trim(),
        }
      );

      setOtpSent(true);
      setSuccess(
        response.data.message || "OTP sent successfully."
      );
    } catch (err) {
      console.error("Send OTP error:", err);
      setError(
        err.response?.data?.message ||
          "Failed to send OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const enteredOTP = otp.trim();

    if (!/^\d{6}$/.test(enteredOTP)) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);

      const response = await axios.post(
        `${API_URL}/auth/verify-otp`,
        {
          email: email.trim(),
          otp: enteredOTP,
        }
      );

      setSuccess(
        response.data.message || "Registration successful!"
      );

      setTimeout(() => {
        history.push("/login/student");
      }, 1200);
    } catch (err) {
      console.error("Verify OTP error:", err);
      setError(
        err.response?.data?.message ||
          "OTP verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangeDetails = () => {
    setOtpSent(false);
    setOtp("");
    setError("");
    setSuccess("");
  };

  return (
    <div className="campus-register">
      <style>{`
        .campus-register {
          --cr-bg: #080d18;
          --cr-panel: #111c2e;
          --cr-blue: #3984ff;
          --cr-orange: #ffad66;
          --cr-muted: #a4b1c5;

          min-height: 100vh;
          width: 100%;
          padding: 28px 20px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #f8fafc;
          background:
            radial-gradient(
              ellipse at 12% 15%,
              rgba(38, 99, 235, 0.20),
              transparent 38%
            ),
            radial-gradient(
              ellipse at 90% 85%,
              rgba(255, 157, 86, 0.09),
              transparent 30%
            ),
            var(--cr-bg);
          font-family:
            Inter, -apple-system, BlinkMacSystemFont,
            "Segoe UI", sans-serif;
          position: relative;
          isolation: isolate;
          overflow-x: hidden;
        }

        .campus-register *,
        .campus-register *::before,
        .campus-register *::after {
          box-sizing: border-box;
        }

        .cr-header,
        .cr-layout,
        .cr-footer {
          width: 100%;
          max-width: 1040px;
        }

        .cr-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          margin-bottom: 22px;
        }

        .cr-brand {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .cr-logo {
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

        .cr-brand-name {
          font-size: 20px;
          line-height: 1.2;
          font-weight: 850;
          color: #fff;
        }

        .cr-brand-name span {
          color: var(--cr-orange);
        }

        .cr-brand-tagline {
          margin-top: 5px;
          font-size: 9px;
          font-weight: 750;
          letter-spacing: 1.4px;
          color: var(--cr-muted);
        }

        .cr-home-button {
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 10px;
          padding: 10px 15px;
          color: #f8fafc;
          background: rgba(255,255,255,.045);
          cursor: pointer;
          font-size: 12px;
          font-weight: 750;
          white-space: nowrap;
        }

        .cr-home-button:hover {
          border-color: var(--cr-orange);
          color: var(--cr-orange);
        }

        .cr-layout {
          display: grid;
          grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
          align-items: stretch;
          border: 1px solid rgba(255,255,255,.13);
          border-radius: 22px;
          overflow: hidden;
          background: #0d1728;
          box-shadow: 0 28px 85px rgba(0,0,0,.35);
        }

        .cr-intro {
          min-width: 0;
          padding: 42px 32px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background:
            radial-gradient(
              circle at 5% 95%,
              rgba(255,173,102,.10),
              transparent 38%
            ),
            linear-gradient(145deg, #172b49, #0c1729);
          border-right: 1px solid rgba(255,255,255,.10);
        }

        .cr-badge {
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

        .cr-dot {
          width: 6px;
          height: 6px;
          flex-shrink: 0;
          border-radius: 50%;
          background: var(--cr-orange);
        }

        .cr-intro h1 {
          margin: 0 0 17px;
          color: #fff;
          font-size: clamp(30px, 3.3vw, 42px);
          line-height: 1.12;
          letter-spacing: -1.5px;
          font-weight: 900;
        }

        .cr-intro h1 span {
          color: var(--cr-orange);
        }

        .cr-intro-description {
          margin: 0 0 27px;
          color: #b1bfd3;
          font-size: 12px;
          line-height: 1.9;
        }

        .cr-feature-list {
          display: grid;
          gap: 18px;
        }

        .cr-feature {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .cr-feature-icon {
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

        .cr-feature-title {
          color: #f8fafc;
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .cr-feature-text {
          color: #99abc3;
          font-size: 10px;
          line-height: 1.6;
        }

        .cr-form-panel {
          min-width: 0;
          padding: 36px clamp(20px, 3.5vw, 42px);
          background: rgba(10,18,32,.92);
        }

        .cr-form-title {
          margin: 0 0 8px;
          color: #fff;
          font-size: 27px;
          font-weight: 850;
          letter-spacing: -.8px;
        }

        .cr-form-subtitle {
          margin: 0;
          color: var(--cr-muted);
          font-size: 12px;
          line-height: 1.8;
        }

        .cr-progress {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 23px 0;
        }

        .cr-progress-label {
          flex-shrink: 0;
          color: #c1cede;
          font-size: 10px;
          font-weight: 800;
        }

        .cr-progress-track {
          height: 4px;
          flex: 1;
          border-radius: 10px;
          overflow: hidden;
          background: rgba(255,255,255,.10);
        }

        .cr-progress-fill {
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg,#3984ff,#83b8ff);
          transition: width .25s ease;
        }

        .cr-field {
          margin-bottom: 16px;
        }

        .cr-label {
          display: block;
          margin-bottom: 8px;
          color: #dce6f5;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: .8px;
        }

        .cr-input-wrap {
          position: relative;
        }

        .cr-input,
        .cr-select {
          display: block;
          width: 100%;
          height: 47px;
          padding: 0 13px;
          border: 1px solid rgba(255,255,255,.13);
          border-radius: 10px;
          outline: none;
          color: #f8fafc;
          background: rgba(255,255,255,.045);
          font-family: inherit;
          font-size: 12px;
          transition: border-color .2s, box-shadow .2s;
        }

        .cr-input::placeholder {
          color: #74869f;
        }

        .cr-input:focus,
        .cr-select:focus {
          border-color: var(--cr-blue);
          box-shadow: 0 0 0 3px rgba(57,132,255,.12);
        }

        .cr-select option {
          color: #fff;
          background: #111c2e;
        }

        .cr-password-input {
          padding-right: 48px;
        }

        .cr-eye {
          position: absolute;
          top: 50%;
          right: 12px;
          transform: translateY(-50%);
          padding: 5px;
          border: 0;
          background: transparent;
          color: #c1cede;
          cursor: pointer;
          font-size: 17px;
        }

        .cr-help {
          display: block;
          margin-top: 6px;
          color: #8092aa;
          font-size: 10px;
        }

        .cr-button {
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

        .cr-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 11px 25px rgba(255,158,94,.22);
        }

        .cr-button:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .cr-spinner {
          display: inline-block;
          width: 13px;
          height: 13px;
          margin-right: 8px;
          vertical-align: -2px;
          border: 2px solid rgba(27,32,43,.25);
          border-top-color: #1b202b;
          border-radius: 50%;
          animation: cr-spin .7s linear infinite;
        }

        @keyframes cr-spin {
          to { transform: rotate(360deg); }
        }

        .cr-alert {
          padding: 11px 13px;
          margin-bottom: 15px;
          border-radius: 9px;
          font-size: 12px;
          line-height: 1.6;
          overflow-wrap: anywhere;
        }

        .cr-alert-error {
          color: #ffb8c1;
          background: rgba(225,29,72,.10);
          border: 1px solid rgba(251,113,133,.25);
        }

        .cr-alert-success {
          color: #a7f3d0;
          background: rgba(16,185,129,.09);
          border: 1px solid rgba(52,211,153,.22);
        }

        .cr-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 22px 0;
          color: #73849b;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 1px;
        }

        .cr-divider::before,
        .cr-divider::after {
          content: "";
          height: 1px;
          flex: 1;
          background: rgba(255,255,255,.10);
        }

        .cr-login-text {
          text-align: center;
          color: #a4b1c5;
          font-size: 11px;
        }

        .cr-link {
          padding: 0;
          margin-left: 5px;
          border: 0;
          background: transparent;
          color: var(--cr-orange);
          font: inherit;
          font-weight: 850;
          cursor: pointer;
        }

        .cr-link:hover {
          text-decoration: underline;
        }

        .cr-security {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-top: 21px;
          padding: 12px;
          border: 1px solid rgba(57,132,255,.17);
          border-radius: 10px;
          background: rgba(57,132,255,.055);
          color: #a4b4ca;
          font-size: 10px;
          line-height: 1.8;
        }

        .cr-security strong {
          color: #e5edf8;
        }

        .cr-otp-card {
          padding: 19px 14px;
          margin-bottom: 23px;
          text-align: center;
          border: 1px solid rgba(57,132,255,.22);
          border-radius: 13px;
          background: linear-gradient(
            135deg,
            rgba(57,132,255,.10),
            rgba(255,255,255,.025)
          );
        }

        .cr-otp-email {
          margin-top: 7px;
          color: var(--cr-orange);
          font-size: 12px;
          font-weight: 800;
          overflow-wrap: anywhere;
        }

        .cr-otp-input {
          height: 57px;
          text-align: center;
          font-size: 24px;
          font-weight: 850;
          letter-spacing: 8px;
          padding-left: 18px;
        }

        .cr-back-button {
          width: 100%;
          height: 44px;
          margin-top: 10px;
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 10px;
          color: #d5deeb;
          background: rgba(255,255,255,.04);
          font-family: inherit;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
        }

        .cr-back-button:hover:not(:disabled) {
          background: rgba(255,255,255,.08);
        }

        .cr-footer {
          margin-top: 18px;
          text-align: center;
          color: #7789a2;
          font-size: 10px;
          line-height: 1.8;
        }

        @media (max-width: 760px) {
          .campus-register {
            padding: 20px 12px;
            justify-content: flex-start;
          }

          .cr-header {
            margin-bottom: 18px;
          }

          .cr-layout {
            grid-template-columns: minmax(0, 1fr);
            max-width: 490px;
          }

          .cr-intro {
            display: none;
          }

          .cr-form-panel {
            padding: 28px 22px;
          }

          .cr-form-title {
            font-size: 25px;
          }
        }

        @media (max-width: 380px) {
          .campus-register {
            padding: 15px 9px;
          }

          .cr-brand-name {
            font-size: 18px;
          }

          .cr-brand-tagline {
            font-size: 8px;
            letter-spacing: 1px;
          }

          .cr-home-button {
            padding: 9px 11px;
          }

          .cr-form-panel {
            padding: 23px 16px;
          }

          .cr-otp-input {
            letter-spacing: 5px;
          }
        }
      `}</style>

      {/* HEADER */}

      <header className="cr-header">
        <div className="cr-brand">
          <div className="cr-logo">🍔</div>

          <div>
            <div className="cr-brand-name">
              Campus <span>Bite</span>
            </div>

            <div className="cr-brand-tagline">
              SMART PRE-ORDER · EASY PICKUP
            </div>
          </div>
        </div>

        <button
          type="button"
          className="cr-home-button"
          onClick={() => history.push("/")}
        >
          ← Home
        </button>
      </header>

      {/* MAIN CARD */}

      <main className="cr-layout">
        <section className="cr-intro">
          <div className="cr-badge">
            <span className="cr-dot" />
            CAMPUS BITE / SMART FOOD EXPERIENCE
          </div>

          <h1>
            Your campus.
            <br />
            Your cravings.
            <br />
            <span>Your way.</span>
          </h1>

          <p className="cr-intro-description">
            Create your account and enjoy a smarter
            way to order campus food. Discover food
            courts, order ahead and spend less time
            waiting in queues.
          </p>

          <div className="cr-feature-list">
            <div className="cr-feature">
              <div className="cr-feature-icon">🍔</div>
              <div>
                <div className="cr-feature-title">
                  Easy Food Ordering
                </div>
                <div className="cr-feature-text">
                  Explore menus and order your favourites.
                </div>
              </div>
            </div>

            <div className="cr-feature">
              <div className="cr-feature-icon">🎟️</div>
              <div>
                <div className="cr-feature-title">
                  Smart Digital Tokens
                </div>
                <div className="cr-feature-text">
                  Get your token for convenient pickup.
                </div>
              </div>
            </div>

            <div className="cr-feature">
              <div className="cr-feature-icon">✉️</div>
              <div>
                <div className="cr-feature-title">
                  Email Verification
                </div>
                <div className="cr-feature-text">
                  Secure your account with a 6-digit OTP.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="cr-form-panel">
          <h2 className="cr-form-title">
            {otpSent
              ? "Verify your email."
              : "Create your account."}
          </h2>

          <p className="cr-form-subtitle">
            {otpSent
              ? "Enter the verification code sent to your inbox."
              : "Join Campus Bite for a smarter campus food experience."}
          </p>

          <div className="cr-progress">
            <span className="cr-progress-label">
              {otpSent ? "STEP 2 OF 2" : "STEP 1 OF 2"}
            </span>

            <div className="cr-progress-track">
              <div
                className="cr-progress-fill"
                style={{ width: otpSent ? "100%" : "50%" }}
              />
            </div>
          </div>

          {error && (
            <div className="cr-alert cr-alert-error" role="alert">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div
              className="cr-alert cr-alert-success"
              role="status"
            >
              ✓ {success}
            </div>
          )}

          {!otpSent ? (
            <form onSubmit={handleSendOTP}>
              <div className="cr-field">
                <label className="cr-label" htmlFor="cr-name">
                  FULL NAME
                </label>

                <input
                  id="cr-name"
                  type="text"
                  className="cr-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="cr-field">
                <label className="cr-label" htmlFor="cr-email">
                  EMAIL ADDRESS
                </label>

                <input
                  id="cr-email"
                  type="email"
                  className="cr-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="cr-field">
                <label className="cr-label" htmlFor="cr-password">
                  PASSWORD
                </label>

                <div className="cr-input-wrap">
                  <input
                    id="cr-password"
                    type={showPassword ? "text" : "password"}
                    className="cr-input cr-password-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    placeholder="Create a password"
                    minLength={6}
                    required
                  />

                  <button
                    type="button"
                    className="cr-eye"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>

                <small className="cr-help">
                  Minimum 6 characters.
                </small>
              </div>

              <div className="cr-field">
                <label
                  className="cr-label"
                  htmlFor="cr-department"
                >
                  DEPARTMENT / COURSE
                </label>

                <select
                  id="cr-department"
                  className="cr-select"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                >
                  <option value="">Select your course</option>
                  <option value="MCA">MCA</option>
                  <option value="BCA">BCA</option>
                  <option value="BBA">BBA</option>
                  <option value="MBA">MBA</option>
                  <option value="B.Tech">B.Tech</option>
                  <option value="B.Pharmacy">B.Pharmacy</option>
                  <option value="BMRIT">BMRIT</option>
                  <option value="B.Com">B.Com</option>
                  <option value="BA">BA</option>
                  <option value="LLB">LLB</option>
                  <option value="B.Sc">B.Sc</option>
                  <option value="D.Pharmacy">D.Pharmacy</option>
                  <option value="BAMS">BAMS</option>
                </select>
              </div>

              <button
                type="submit"
                className="cr-button"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="cr-spinner" />
                    Sending OTP...
                  </>
                ) : (
                  "Send OTP  →"
                )}
              </button>

              <div className="cr-divider">
                ACCOUNT ACCESS
              </div>

              <div className="cr-login-text">
                Already have an account?

                <button
                  type="button"
                  className="cr-link"
                  onClick={() => history.push("/login/student")}
                >
                  Login
                </button>
              </div>

              <div className="cr-security">
                <span>🔐</span>
                <span>
                  <strong>Secure email verification</strong>
                  <br />
                  Verify your email before completing registration.
                </span>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              <div className="cr-otp-card">
                <div style={{ fontSize: "29px" }}>✉️</div>

                <div
                  style={{
                    color: "#a4b1c5",
                    fontSize: "10px",
                    letterSpacing: "1px",
                    marginTop: "9px",
                  }}
                >
                  OTP SENT TO
                </div>

                <div className="cr-otp-email">{email}</div>
              </div>

              <div className="cr-field">
                <label className="cr-label" htmlFor="cr-otp">
                  ENTER YOUR 6-DIGIT OTP
                </label>

                <input
                  id="cr-otp"
                  type="text"
                  className="cr-input cr-otp-input"
                  value={otp}
                  onChange={(e) => {
                    setOtp(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    );
                  }}
                  placeholder="000000"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                />

                <small className="cr-help">
                  Check your inbox and spam folder.
                </small>
              </div>

              <button
                type="submit"
                className="cr-button"
                disabled={loading || otp.length !== 6}
              >
                {loading ? (
                  <>
                    <span className="cr-spinner" />
                    Verifying OTP...
                  </>
                ) : (
                  "Verify OTP & Register  →"
                )}
              </button>

              <button
                type="button"
                className="cr-back-button"
                onClick={handleChangeDetails}
                disabled={loading}
              >
                ← Change Registration Details
              </button>

              <div className="cr-security">
                <span>⏱️</span>
                <span>
                  <strong>OTP validity: 5 minutes.</strong>
                  <br />
                  Verify your email to finish registration.
                </span>
              </div>
            </form>
          )}
        </section>
      </main>

      <footer className="cr-footer">
        © {new Date().getFullYear()} Campus Bite
        <br />
        SMART PRE-ORDER · EASY PICKUP
      </footer>
    </div>
  );
};

export default Register;