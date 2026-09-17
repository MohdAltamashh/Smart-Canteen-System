import React, { useState } from "react";
import axios from "axios";
import { useHistory } from "react-router-dom";

// =====================================================
// REGISTER PAGE
// =====================================================

const Register = () => {
  const history = useHistory();

  // =====================================================
  // FORM STATES
  // =====================================================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");

  // =====================================================
  // OTP STATES
  // =====================================================

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  // =====================================================
  // UI STATES
  // =====================================================

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // SEND OTP
  // =====================================================

  const handleSendOTP = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    // Validate fields
    if (
      !name.trim() ||
      !email.trim() ||
      !password.trim() ||
      !department.trim()
    ) {
      setError("All fields are required.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters long."
      );
      return;
    }

    try {
      setLoading(true);

      // IMPORTANT:
      // Keep the original working OTP endpoint.
      const response = await axios.post(
        "http://localhost:5000/api/auth/send-otp",
        {
          name: name.trim(),
          email: email.trim(),
          password,
          department: department.trim(),
        }
      );

      setOtpSent(true);

      setSuccess(
        response.data.message ||
          "OTP sent successfully to your email."
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

  // =====================================================
  // VERIFY OTP
  // =====================================================

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    const enteredOTP = otp.trim();

    if (!enteredOTP) {
      setError("Please enter the OTP.");
      return;
    }

    if (!/^\d{6}$/.test(enteredOTP)) {
      setError("OTP must be exactly 6 digits.");
      return;
    }

    try {
      setLoading(true);

      // IMPORTANT:
      // Keep the original working OTP endpoint.
      const response = await axios.post(
        "http://localhost:5000/api/auth/verify-otp",
        {
          email: email.trim(),
          otp: enteredOTP,
        }
      );

      setSuccess(
        response.data.message ||
          "Registration successful!"
      );

      // Redirect to student login
      setTimeout(() => {
        history.push("/login/student");
      }, 1200);
    } catch (err) {
      console.error(
        "Verify OTP error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "OTP verification failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CHANGE DETAILS
  // =====================================================

  const handleChangeDetails = () => {
    setOtpSent(false);
    setOtp("");
    setError("");
    setSuccess("");
  };

  // =====================================================
  // GO TO LOGIN
  // =====================================================

  const goToLogin = () => {
    history.push("/login/student");
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #061f49 0%, #073b7a 45%, #0d6efd 100%)",
        padding: "40px 15px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="container"
        style={{
          maxWidth: "1000px",
        }}
      >
        <div
          className="row g-0 shadow-lg"
          style={{
            background: "#ffffff",
            borderRadius: "22px",
            overflow: "hidden",
          }}
        >
          {/* ================================================= */}
          {/* LEFT INFORMATION PANEL */}
          {/* ================================================= */}

          <div
            className="col-lg-5 d-none d-lg-flex"
            style={{
              background:
                "linear-gradient(160deg, #061f49, #073b7a)",
              color: "white",
              padding: "45px 35px",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "65px",
                height: "65px",
                borderRadius: "18px",
                background:
                  "rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "30px",
                marginBottom: "22px",
              }}
            >
              🍽️
            </div>

            <div
              style={{
                fontSize: "13px",
                letterSpacing: "2px",
                fontWeight: "700",
                opacity: 0.75,
                marginBottom: "8px",
              }}
            >
              SMART CANTEEN
            </div>

            <h1
              className="fw-bold"
              style={{
                fontSize: "34px",
                lineHeight: "1.2",
                marginBottom: "18px",
              }}
            >
              Smart Ordering
              <br />
              Made Simple
            </h1>

            <p
              style={{
                color:
                  "rgba(255,255,255,0.75)",
                lineHeight: "1.7",
              }}
            >
              Create your student account
              and enjoy a faster and smarter
              canteen experience.
            </p>

            {/* FEATURES */}

            <div
              style={{
                marginTop: "25px",
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <span
                  style={{
                    fontSize: "23px",
                  }}
                >
                  🍔
                </span>

                <div>
                  <div className="fw-bold">
                    Easy Food Ordering
                  </div>

                  <small
                    style={{
                      opacity: 0.65,
                    }}
                  >
                    Order food without waiting
                    in long queues.
                  </small>
                </div>
              </div>

              <div className="d-flex align-items-center gap-3">
                <span
                  style={{
                    fontSize: "23px",
                  }}
                >
                  🎟️
                </span>

                <div>
                  <div className="fw-bold">
                    Digital Token
                  </div>

                  <small
                    style={{
                      opacity: 0.65,
                    }}
                  >
                    Get your token instantly
                    after ordering.
                  </small>
                </div>
              </div>

              <div className="d-flex align-items-center gap-3">
                <span
                  style={{
                    fontSize: "23px",
                  }}
                >
                  🔔
                </span>

                <div>
                  <div className="fw-bold">
                    Live Order Updates
                  </div>

                  <small
                    style={{
                      opacity: 0.65,
                    }}
                  >
                    Know when your order is
                    ready.
                  </small>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================= */}
          {/* RIGHT FORM PANEL */}
          {/* ================================================= */}

          <div
            className="col-lg-7"
            style={{
              padding:
                "40px clamp(25px, 5vw, 55px)",
            }}
          >
            {/* HEADER */}

            <div className="text-center mb-4">
              <div
                style={{
                  width: "58px",
                  height: "58px",
                  margin: "0 auto 15px",
                  borderRadius: "16px",
                  background: "#eef4ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "27px",
                }}
              >
                {otpSent ? "✉️" : "👨‍🎓"}
              </div>

              <h2
                className="fw-bold mb-2"
                style={{
                  color: "#13294b",
                }}
              >
                {otpSent
                  ? "Verify Your Email"
                  : "Student Registration"}
              </h2>

              <p className="text-muted mb-0">
                {otpSent
                  ? "Enter the 6-digit OTP sent to your email"
                  : "Create your Smart Canteen account"}
              </p>
            </div>

            {/* ================================================= */}
            {/* ALERTS */}
            {/* ================================================= */}

            {error && (
              <div
                className="alert alert-danger border-0"
                style={{
                  borderRadius: "11px",
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {success && (
              <div
                className="alert alert-success border-0"
                style={{
                  borderRadius: "11px",
                }}
              >
                ✅ {success}
              </div>
            )}

            {/* ================================================= */}
            {/* REGISTRATION FORM */}
            {/* ================================================= */}

            {!otpSent ? (
              <form
                onSubmit={handleSendOTP}
                autoComplete="off"
              >
                {/* FULL NAME */}

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Full Name
                  </label>

                  <input
                    type="text"
                    className="form-control"
                    value={name}
                    onChange={(e) =>
                      setName(
                        e.target.value
                      )
                    }
                    autoComplete="name"
                    placeholder="Enter your full name"
                    required
                    style={{
                      height: "48px",
                      borderRadius: "10px",
                    }}
                  />
                </div>

                {/* EMAIL */}

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Email Address
                  </label>

                  <input
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) =>
                      setEmail(
                        e.target.value
                      )
                    }
                    autoComplete="email"
                    placeholder="Enter your email address"
                    required
                    style={{
                      height: "48px",
                      borderRadius: "10px",
                    }}
                  />
                </div>

                {/* PASSWORD */}

                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Password
                  </label>

                  <div
                    style={{
                      position: "relative",
                    }}
                  >
                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      className="form-control"
                      value={password}
                      onChange={(e) =>
                        setPassword(
                          e.target.value
                        )
                      }
                      autoComplete="new-password"
                      placeholder="Create a password"
                      minLength="6"
                      required
                      style={{
                        height: "48px",
                        borderRadius: "10px",
                        paddingRight: "50px",
                      }}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) =>
                            !current
                        )
                      }
                      style={{
                        position:
                          "absolute",
                        right: "12px",
                        top: "50%",
                        transform:
                          "translateY(-50%)",
                        border: "none",
                        background:
                          "transparent",
                        cursor: "pointer",
                        fontSize: "18px",
                      }}
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

                  <small className="text-muted">
                    Minimum 6 characters
                  </small>
                </div>

                {/* DEPARTMENT */}

                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Department / Course
                  </label>

                  <select
                    className="form-select"
                    value={department}
                    onChange={(e) =>
                      setDepartment(
                        e.target.value
                      )
                    }
                    required
                    style={{
                      height: "48px",
                      borderRadius: "10px",
                    }}
                  >
                    <option value="">
                      Select Department / Course
                    </option>

                    <option value="MCA">
                      MCA
                    </option>

                    <option value="BCA">
                      BCA
                    </option>

                    <option value="BBA">
                      BBA
                    </option>

                    <option value="MBA">
                      MBA
                    </option>

                    <option value="B.Tech">
                      B.Tech
                    </option>

                    <option value="B.Pharmacy">
                      B.Pharmacy
                    </option>

                    <option value="BMRIT">
                      BMRIT
                    </option>

                    <option value="B.Com">
                      B.Com
                    </option>

                    <option value="BA">
                      BA
                    </option>

                    <option value="LLB">
                      LLB
                    </option>

                    <option value="B.Sc">
                      B.Sc
                    </option>

                    <option value="D.Pharmacy">
                      D.Pharmacy
                    </option>

                    <option value="BAMS">
                      BAMS
                    </option>
                  </select>
                </div>

                {/* SEND OTP */}

                <button
                  type="submit"
                  className="btn btn-primary w-100 fw-bold"
                  disabled={loading}
                  style={{
                    height: "50px",
                    borderRadius: "10px",
                    fontSize: "16px",
                  }}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      />
                      Sending OTP...
                    </>
                  ) : (
                    "📩 Send OTP"
                  )}
                </button>

                {/* LOGIN */}

                <div className="text-center mt-4">
                  <span className="text-muted">
                    Already have an account?
                  </span>{" "}

                  <button
                    type="button"
                    onClick={goToLogin}
                    style={{
                      border: "none",
                      background:
                        "transparent",
                      color: "#0d6efd",
                      fontWeight: "700",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    Login
                  </button>
                </div>

                {/* SECURITY */}

                <div
                  className="mt-4"
                  style={{
                    background: "#f3f7ff",
                    border:
                      "1px solid #dce9ff",
                    borderRadius: "11px",
                    padding: "13px 15px",
                    color: "#42617f",
                    fontSize: "13px",
                  }}
                >
                  🔐 Your email will be
                  verified using a secure
                  6-digit OTP.
                </div>
              </form>
            ) : (
              /* ================================================= */
              /* OTP VERIFICATION */
              /* ================================================= */

              <form
                onSubmit={handleVerifyOTP}
              >
                {/* EMAIL DISPLAY */}

                <div
                  className="text-center mb-4"
                  style={{
                    background: "#f7f9fc",
                    border:
                      "1px solid #e5e9ef",
                    borderRadius: "12px",
                    padding: "15px",
                  }}
                >
                  <small className="text-muted d-block mb-1">
                    OTP sent to
                  </small>

                  <strong
                    style={{
                      color: "#17365d",
                      wordBreak:
                        "break-word",
                    }}
                  >
                    {email}
                  </strong>
                </div>

                {/* OTP INPUT */}

                <div className="mb-4">
                  <label className="form-label fw-semibold">
                    Enter 6-Digit OTP
                  </label>

                  <input
                    type="text"
                    className="form-control text-center"
                    value={otp}
                    onChange={(e) => {
                      const value =
                        e.target.value
                          .replace(
                            /\D/g,
                            ""
                          )
                          .slice(
                            0,
                            6
                          );

                      setOtp(value);
                    }}
                    placeholder="000000"
                    maxLength="6"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    style={{
                      height: "58px",
                      borderRadius: "10px",
                      fontSize: "25px",
                      fontWeight: "700",
                      letterSpacing: "8px",
                    }}
                  />

                  <small className="text-muted d-block text-center mt-2">
                    Enter the OTP received
                    on your email.
                  </small>
                </div>

                {/* VERIFY OTP */}

                <button
                  type="submit"
                  className="btn btn-primary w-100 fw-bold"
                  disabled={
                    loading ||
                    otp.length !== 6
                  }
                  style={{
                    height: "50px",
                    borderRadius: "10px",
                    fontSize: "16px",
                  }}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      />

                      Verifying...
                    </>
                  ) : (
                    "✅ Verify OTP"
                  )}
                </button>

                {/* CHANGE DETAILS */}

                <button
                  type="button"
                  className="btn btn-outline-secondary w-100 mt-2"
                  onClick={
                    handleChangeDetails
                  }
                  disabled={loading}
                  style={{
                    height: "48px",
                    borderRadius: "10px",
                  }}
                >
                  ← Change Details
                </button>

                {/* OTP INFO */}

                <div
                  className="text-center mt-4"
                  style={{
                    background: "#f3f7ff",
                    border:
                      "1px solid #dce9ff",
                    borderRadius: "11px",
                    padding: "13px",
                    color: "#42617f",
                    fontSize: "13px",
                  }}
                >
                  ⏱️ OTP is valid for
                  5 minutes.
                </div>
              </form>
            )}
          </div>
        </div>

        {/* FOOTER */}

        <div
          className="text-center mt-3"
          style={{
            color:
              "rgba(255,255,255,0.75)",
            fontSize: "13px",
          }}
        >
          Smart Canteen Management System
        </div>
      </div>
    </div>
  );
};

export default Register;