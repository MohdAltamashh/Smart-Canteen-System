// client/src/pages/Home.jsx

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Home = ({ userRole }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("token"))
  );

  // Keep login state updated
  useEffect(() => {
    const checkLogin = () => {
      setIsLoggedIn(Boolean(localStorage.getItem("token")));
    };

    window.addEventListener("storage", checkLogin);
    window.addEventListener("authChanged", checkLogin);

    return () => {
      window.removeEventListener("storage", checkLogin);
      window.removeEventListener("authChanged", checkLogin);
    };
  }, []);

  const features = [
    {
      icon: "⚡",
      number: "01",
      title: "Quick Pre-Ordering",
      description:
        "Browse the menu and place your order before reaching the counter.",
      color: "#ffb36b",
      background: "rgba(255,179,107,0.11)",
    },
    {
      icon: "🎟️",
      number: "02",
      title: "Smart Token System",
      description:
        "Receive a unique order token and make your food pickup easier.",
      color: "#91e5c0",
      background: "rgba(83,214,160,0.10)",
    },
    {
      icon: "💳",
      number: "03",
      title: "Online Checkout",
      description:
        "Complete your order through the integrated payment experience.",
      color: "#b8b5ff",
      background: "rgba(153,146,255,0.12)",
    },
    {
      icon: "📡",
      number: "04",
      title: "Order Tracking",
      description:
        "Follow your order status and know when it is ready for pickup.",
      color: "#91d9ff",
      background: "rgba(85,190,255,0.11)",
    },
  ];

  const steps = [
    {
      number: "01",
      icon: "🧭",
      title: "Explore",
      text: "Choose a food court and explore its available menu.",
    },
    {
      number: "02",
      icon: "🛒",
      title: "Place Order",
      text: "Select your favourites and review your cart.",
    },
    {
      number: "03",
      icon: "💳",
      title: "Checkout",
      text: "Complete the payment process for your order.",
    },
    {
      number: "04",
      icon: "🎟️",
      title: "Pick Up",
      text: "Use your order token to collect your food.",
    },
  ];

  const getPrimaryAction = () => {
    if (!isLoggedIn) {
      return (
        <Link to="/login/student" className="cb-home-primary">
          Get Started <span>↗</span>
        </Link>
      );
    }

    if (userRole === "student") {
      return (
        <Link to="/canteen-menu" className="cb-home-primary">
          Explore Food Courts <span>↗</span>
        </Link>
      );
    }

    if (userRole === "staff") {
      return (
        <Link to="/staff/dashboard" className="cb-home-primary">
          Open Staff Dashboard <span>↗</span>
        </Link>
      );
    }

    if (userRole === "admin") {
      return (
        <Link to="/admin/dashboard" className="cb-home-primary">
          Open Admin Dashboard <span>↗</span>
        </Link>
      );
    }

    return (
      <Link to="/canteen-menu" className="cb-home-primary">
        Explore Menu <span>↗</span>
      </Link>
    );
  };

  return (
    <div className="cb-home">

      {/* ==================================================
          PAGE STYLES
      ================================================== */}

      <style>{`
        .cb-home {
          --cb-bg: #0b1220;
          --cb-panel: #111c2f;
          --cb-text: #f6f7fb;
          --cb-muted: #9ba8bd;
          --cb-orange: #ffad68;
          --cb-border: rgba(255,255,255,.09);

          background: #f6f7fb;
          color: #172238;
          font-family: Inter, "Segoe UI", Arial, sans-serif;
          overflow: hidden;
        }

        .cb-home * {
          box-sizing: border-box;
        }

        .cb-home a {
          text-decoration: none;
        }

        .cb-home-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding-left: 26px;
          padding-right: 26px;
        }

        .cb-home-hero {
          position: relative;
          overflow: hidden;
          color: #fff;
          background:
            radial-gradient(
              ellipse at 80% 35%,
              rgba(87, 111, 183, .23),
              transparent 38%
            ),
            radial-gradient(
              ellipse at 12% 0%,
              rgba(255, 173, 104, .11),
              transparent 35%
            ),
            linear-gradient(130deg, #0b1220, #111e34 58%, #192544);
        }

        .cb-home-hero::before {
          content: "";
          position: absolute;
          inset: 0;
          opacity: .17;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px);
          background-size: 46px 46px;
          mask-image: linear-gradient(to bottom, black, transparent 95%);
        }

        .cb-home-hero-content {
          position: relative;
          z-index: 1;
          padding-top: 86px;
          padding-bottom: 108px;
        }

        .cb-home-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 9px;
          padding: 9px 13px;
          border: 1px solid rgba(255,173,104,.23);
          border-radius: 999px;
          background: rgba(255,173,104,.08);
          color: #ffc38f;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 1.7px;
        }

        .cb-home-title {
          margin: 25px 0 20px;
          max-width: 700px;
          font-size: clamp(42px, 6vw, 76px);
          line-height: 1.055;
          letter-spacing: -3.4px;
          font-weight: 900;
        }

        .cb-home-title-accent {
          color: #ffb477;
          background: linear-gradient(100deg, #ffd0a0, #ff9252);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .cb-home-description {
          max-width: 550px;
          color: #aebbd0;
          font-size: 15px;
          line-height: 1.95;
          margin-bottom: 29px;
        }

        .cb-home-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          min-height: 51px;
          padding: 0 20px;
          border: 1px solid transparent;
          border-radius: 13px;
          background: linear-gradient(135deg, #ffc58e, #ff9457);
          color: #172033 !important;
          font-size: 13px;
          font-weight: 900;
          box-shadow: 0 9px 25px rgba(255,146,87,.16);
          transition: transform .2s ease, box-shadow .2s ease;
        }

        .cb-home-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 14px 30px rgba(255,146,87,.25);
        }

        .cb-home-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          min-height: 51px;
          padding: 0 18px;
          border: 1px solid rgba(255,255,255,.16);
          border-radius: 13px;
          color: #f1f4fa !important;
          background: rgba(255,255,255,.045);
          font-size: 13px;
          font-weight: 750;
          transition: background .2s ease;
        }

        .cb-home-secondary:hover {
          background: rgba(255,255,255,.10);
        }

        .cb-home-visual {
          position: relative;
          max-width: 400px;
          margin: 0 auto;
          padding: 17px;
          border: 1px solid rgba(255,255,255,.14);
          border-radius: 32px;
          background: linear-gradient(
            145deg,
            rgba(255,255,255,.105),
            rgba(255,255,255,.025)
          );
          box-shadow: 0 35px 85px rgba(0,0,0,.22);
          backdrop-filter: blur(16px);
          transform: rotate(1.5deg);
        }

        .cb-home-visual-inner {
          min-height: 340px;
          padding: 26px;
          border: 1px solid rgba(255,255,255,.06);
          border-radius: 23px;
          background: linear-gradient(155deg, #1c2b44, #121c30);
        }

        .cb-home-visual-label {
          color: #9baac0;
          font-size: 10px;
          font-weight: 850;
          letter-spacing: 1.5px;
        }

        .cb-home-food-art {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 160px;
          margin: 15px 0;
          border: 1px solid rgba(255,255,255,.07);
          border-radius: 20px;
          background:
            radial-gradient(circle, rgba(255,177,111,.14), transparent 70%),
            rgba(255,255,255,.025);
          font-size: 92px;
        }

        .cb-home-token {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 15px;
          border: 1px solid rgba(255,255,255,.09);
          border-radius: 15px;
          background: rgba(255,255,255,.035);
        }

        .cb-home-status-dot {
          width: 8px;
          height: 8px;
          display: inline-block;
          border-radius: 50%;
          background: #61dba7;
          box-shadow: 0 0 12px rgba(97,219,167,.55);
        }

        .cb-home-floating {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 13px 15px;
          border: 1px solid rgba(255,255,255,.12);
          border-radius: 15px;
          background: rgba(21,33,54,.93);
          color: #f4f6fb;
          box-shadow: 0 15px 40px rgba(0,0,0,.22);
          backdrop-filter: blur(14px);
        }

        .cb-home-floating-one {
          top: 36px;
          right: -23px;
        }

        .cb-home-floating-two {
          bottom: 35px;
          left: -27px;
        }

        .cb-home-statbar {
          position: relative;
          z-index: 2;
          margin-top: -37px;
        }

        .cb-home-stat {
          height: 100%;
          padding: 23px 19px;
          border: 1px solid #e9edf4;
          border-radius: 19px;
          background: #fff;
          box-shadow: 0 13px 35px rgba(19,35,64,.055);
        }

        .cb-home-stat-icon {
          width: 43px;
          height: 43px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 13px;
          background: #fff2e7;
          font-size: 20px;
          margin-bottom: 16px;
        }

        .cb-home-stat-title {
          color: #1a2941;
          font-size: 14px;
          font-weight: 850;
          margin-bottom: 6px;
        }

        .cb-home-stat-text {
          color: #8490a2;
          font-size: 12px;
          line-height: 1.7;
          margin: 0;
        }

        .cb-home-section {
          padding-top: 88px;
          padding-bottom: 88px;
        }

        .cb-home-section-kicker {
          color: #d77e42;
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 2px;
          margin-bottom: 12px;
        }

        .cb-home-section-title {
          color: #172238;
          font-size: clamp(29px, 4vw, 43px);
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: -1.6px;
          margin-bottom: 14px;
        }

        .cb-home-section-description {
          max-width: 610px;
          color: #7e8a9d;
          font-size: 14px;
          line-height: 1.9;
          margin: 0 auto;
        }

        .cb-home-feature {
          height: 100%;
          min-height: 250px;
          padding: 27px;
          border: 1px solid #e9edf4;
          border-radius: 22px;
          background: #fff;
          transition: transform .22s ease, box-shadow .22s ease;
        }

        .cb-home-feature:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 45px rgba(24,40,70,.08);
        }

        .cb-home-feature-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 29px;
        }

        .cb-home-feature-icon {
          width: 54px;
          height: 54px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 17px;
          font-size: 25px;
        }

        .cb-home-feature-number {
          color: #a7afbd;
          font-size: 12px;
          font-weight: 850;
          letter-spacing: 1px;
        }

        .cb-home-feature h3 {
          color: #1b2940;
          font-size: 17px;
          font-weight: 900;
          margin-bottom: 11px;
        }

        .cb-home-feature p {
          color: #7e8a9d;
          font-size: 13px;
          line-height: 1.85;
          margin-bottom: 0;
        }

        .cb-home-process {
          background: #fff;
          border-top: 1px solid #edf0f5;
          border-bottom: 1px solid #edf0f5;
        }

        .cb-home-step {
          position: relative;
          height: 100%;
          padding: 24px;
          border: 1px solid #edf0f5;
          border-radius: 19px;
          background: #fafbfe;
        }

        .cb-home-step-number {
          color: #df874e;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .cb-home-step-icon {
          margin: 22px 0 17px;
          font-size: 32px;
        }

        .cb-home-step h3 {
          font-size: 16px;
          font-weight: 900;
          margin-bottom: 9px;
        }

        .cb-home-step p {
          color: #7e8a9d;
          font-size: 12px;
          line-height: 1.8;
          margin: 0;
        }

        .cb-home-cta {
          position: relative;
          overflow: hidden;
          padding: 66px 25px;
          color: #fff;
          text-align: center;
          background:
            radial-gradient(circle at 15% 50%, rgba(255,178,112,.13), transparent 25%),
            radial-gradient(circle at 85% 20%, rgba(126,151,255,.15), transparent 28%),
            linear-gradient(125deg,#111b30,#1c2c4b);
        }

        .cb-home-footer {
          background: #0a1120;
          color: #f6f7fb;
          padding: 43px 26px 0;
        }

        .cb-home-footer-link {
          color: #a5b2c7;
          font-size: 13px;
          text-decoration: none;
          transition: color .2s ease;
        }

        .cb-home-footer-link:hover {
          color: #ffbd83;
        }

        .cb-home-footer-bottom {
          border-top: 1px solid rgba(255,255,255,.09);
          margin-top: 31px;
          padding: 20px 0;
          color: #8997ae;
          font-size: 11px;
        }

        .cb-home-developer {
          border-top: 1px solid rgba(255,255,255,.07);
          padding: 21px 0 25px;
          text-align: center;
        }

        @media (max-width: 991px) {
          .cb-home-hero-content {
            padding-top: 67px;
            padding-bottom: 80px;
          }

          .cb-home-title {
            letter-spacing: -2px;
          }

          .cb-home-visual {
            max-width: 355px;
            margin-top: 32px;
          }

          .cb-home-section {
            padding-top: 68px;
            padding-bottom: 68px;
          }

          .cb-home-floating-one {
            right: -8px;
          }

          .cb-home-floating-two {
            left: -8px;
          }
        }

        @media (max-width: 575px) {
          .cb-home-container {
            padding-left: 19px;
            padding-right: 19px;
          }

          .cb-home-hero-content {
            padding-top: 54px;
            padding-bottom: 72px;
          }

          .cb-home-title {
            font-size: 43px;
            letter-spacing: -2.1px;
          }

          .cb-home-description {
            font-size: 13px;
          }

          .cb-home-visual-inner {
            min-height: 305px;
            padding: 20px;
          }

          .cb-home-food-art {
            min-height: 130px;
            font-size: 78px;
          }

          .cb-home-floating {
            padding: 10px 11px;
            font-size: 11px;
          }

          .cb-home-floating-one {
            top: 20px;
            right: -5px;
          }

          .cb-home-floating-two {
            bottom: 17px;
            left: -5px;
          }

          .cb-home-section {
            padding-top: 58px;
            padding-bottom: 58px;
          }

          .cb-home-feature {
            min-height: auto;
            padding: 22px;
          }

          .cb-home-stat {
            padding: 17px 14px;
          }

          .cb-home-stat-icon {
            margin-bottom: 12px;
          }

          .cb-home-footer {
            padding-left: 20px;
            padding-right: 20px;
          }
        }
      `}</style>

      {/* ==================================================
          HERO SECTION
      ================================================== */}

      <section className="cb-home-hero">
        <div className="cb-home-container cb-home-hero-content">
          <div className="row align-items-center g-5">

            {/* LEFT CONTENT */}

            <div className="col-lg-7">
              <div className="cb-home-eyebrow">
                <span>✦</span>
                CAMPUS BITE
                <span style={{ opacity: 0.45 }}>/</span>
                SMART FOOD EXPERIENCE
              </div>

              <h1 className="cb-home-title">
                Your campus.
                <br />
                Your cravings.
                <br />
                <span className="cb-home-title-accent">
                  Your way.
                </span>
              </h1>

              <p className="cb-home-description">
                Meet a smarter way to enjoy campus food. Discover
                food courts, order ahead, get your token and spend
                less time waiting in queues.
              </p>

              <div className="d-flex flex-wrap gap-3">
                {getPrimaryAction()}

                {!isLoggedIn && (
                  <Link
                    to="/register/student"
                    className="cb-home-secondary"
                  >
                    Create Account <span>↗</span>
                  </Link>
                )}

                {isLoggedIn && userRole === "student" && (
                  <Link
                    to="/my-orders"
                    className="cb-home-secondary"
                  >
                    My Orders <span>↗</span>
                  </Link>
                )}

                {isLoggedIn &&
                  userRole !== "student" &&
                  userRole !== "admin" &&
                  userRole !== "staff" && (
                    <Link
                      to="/canteen-menu"
                      className="cb-home-secondary"
                    >
                      Browse Menu <span>↗</span>
                    </Link>
                  )}
              </div>

              <div
                className="d-flex flex-wrap gap-4 mt-4 pt-2"
                style={{
                  color: "#9eacc1",
                  fontSize: "11px",
                  fontWeight: 700,
                }}
              >
                <span>✓ Easy ordering</span>
                <span>✓ Smart tokens</span>
                <span>✓ Convenient pickup</span>
              </div>
            </div>

            {/* RIGHT VISUAL */}

            <div className="col-lg-5">
              <div className="cb-home-visual">

                <div className="cb-home-visual-inner">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <div className="cb-home-visual-label">
                        THE CAMPUS EXPERIENCE
                      </div>

                      <div
                        style={{
                          color: "#fff",
                          fontSize: "18px",
                          fontWeight: 900,
                          marginTop: "7px",
                        }}
                      >
                        Made for your day.
                      </div>
                    </div>

                    <span
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(255,173,104,.12)",
                        fontSize: "20px",
                      }}
                    >
                      ✦
                    </span>
                  </div>

                  <div className="cb-home-food-art">
                    🍔
                  </div>

                  <div className="cb-home-token">
                    <div>
                      <div
                        style={{
                          color: "#8e9db5",
                          fontSize: "10px",
                          fontWeight: 800,
                          letterSpacing: "1px",
                        }}
                      >
                        YOUR NEXT ORDER
                      </div>

                      <div
                        style={{
                          color: "#fff",
                          fontWeight: 850,
                          fontSize: "13px",
                          marginTop: "6px",
                        }}
                      >
                        Simple. Smart. Convenient.
                      </div>
                    </div>

                    <div
                      style={{
                        width: "37px",
                        height: "37px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "12px",
                        background: "rgba(255,255,255,.07)",
                        fontSize: "18px",
                      }}
                    >
                      🎟️
                    </div>
                  </div>
                </div>

                {/* FLOATING STATUS CARD */}

                <div className="cb-home-floating cb-home-floating-one">
                  <span style={{ fontSize: "23px" }}>⚡</span>

                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 900,
                      }}
                    >
                      Quick Ordering
                    </div>

                    <div
                      style={{
                        color: "#a8b5c9",
                        fontSize: "10px",
                        marginTop: "3px",
                      }}
                    >
                      A smarter routine
                    </div>
                  </div>
                </div>

                <div className="cb-home-floating cb-home-floating-two">
                  <span style={{ fontSize: "22px" }}>🎟️</span>

                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: 900,
                      }}
                    >
                      Smart Token
                    </div>

                    <div
                      style={{
                        color: "#a8b5c9",
                        fontSize: "10px",
                        marginTop: "3px",
                      }}
                    >
                      Easy order pickup
                    </div>
                  </div>

                  <span className="cb-home-status-dot" />
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================================================
          QUICK HIGHLIGHTS
      ================================================== */}

      <section className="cb-home-statbar">
        <div className="cb-home-container">
          <div className="row g-3">

            <div className="col-6 col-lg-3">
              <div className="cb-home-stat">
                <div className="cb-home-stat-icon">🍽️</div>
                <div className="cb-home-stat-title">
                  Multiple Food Courts
                </div>
                <p className="cb-home-stat-text">
                  Discover campus food spots in one place.
                </p>
              </div>
            </div>

            <div className="col-6 col-lg-3">
              <div className="cb-home-stat">
                <div className="cb-home-stat-icon">⚡</div>
                <div className="cb-home-stat-title">
                  Easy Pre-Order
                </div>
                <p className="cb-home-stat-text">
                  Order in advance with a few simple steps.
                </p>
              </div>
            </div>

            <div className="col-6 col-lg-3">
              <div className="cb-home-stat">
                <div className="cb-home-stat-icon">🎟️</div>
                <div className="cb-home-stat-title">
                  Digital Tokens
                </div>
                <p className="cb-home-stat-text">
                  Use your order token for convenient pickup.
                </p>
              </div>
            </div>

            <div className="col-6 col-lg-3">
              <div className="cb-home-stat">
                <div className="cb-home-stat-icon">📦</div>
                <div className="cb-home-stat-title">
                  Order Tracking
                </div>
                <p className="cb-home-stat-text">
                  Check the progress of your placed orders.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ==================================================
          FEATURES
      ================================================== */}

      <section className="cb-home-section">
        <div className="cb-home-container">

          <div className="text-center mb-5">
            <div className="cb-home-section-kicker">
              THE CAMPUS BITE ADVANTAGE
            </div>

            <h2 className="cb-home-section-title">
              More than just ordering.
              <br />
              <span style={{ color: "#d98248" }}>
                A better experience.
              </span>
            </h2>

            <p className="cb-home-section-description">
              Everything comes together in one convenient platform,
              designed around the way your campus works.
            </p>
          </div>

          <div className="row g-4">
            {features.map((feature) => (
              <div
                className="col-sm-6 col-lg-3"
                key={feature.number}
              >
                <article className="cb-home-feature">

                  <div className="cb-home-feature-top">
                    <div
                      className="cb-home-feature-icon"
                      style={{
                        background: feature.background,
                        color: feature.color,
                      }}
                    >
                      {feature.icon}
                    </div>

                    <span className="cb-home-feature-number">
                      {feature.number}
                    </span>
                  </div>

                  <h3>{feature.title}</h3>

                  <p>{feature.description}</p>

                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================
          HOW IT WORKS
      ================================================== */}

      <section className="cb-home-process">
        <div
          className="cb-home-container"
          style={{
            paddingTop: "79px",
            paddingBottom: "79px",
          }}
        >

          <div className="text-center mb-5">
            <div className="cb-home-section-kicker">
              SIMPLE BY DESIGN
            </div>

            <h2 className="cb-home-section-title">
              From craving to collection.
            </h2>

            <p className="cb-home-section-description">
              Four simple steps. A smoother campus food experience.
            </p>
          </div>

          <div className="row g-3">
            {steps.map((step) => (
              <div
                className="col-6 col-lg-3"
                key={step.number}
              >
                <article className="cb-home-step">

                  <div className="cb-home-step-number">
                    STEP {step.number}
                  </div>

                  <div className="cb-home-step-icon">
                    {step.icon}
                  </div>

                  <h3>{step.title}</h3>

                  <p>{step.text}</p>

                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================
          CALL TO ACTION
      ================================================== */}

      <section className="cb-home-cta">
        <div className="cb-home-container">

          <div
            style={{
              fontSize: "34px",
              marginBottom: "18px",
            }}
          >
            ✦
          </div>

          <div
            style={{
              color: "#ffbd83",
              fontSize: "10px",
              fontWeight: 900,
              letterSpacing: "2px",
              marginBottom: "14px",
            }}
          >
            YOUR NEXT CAMPUS FAVOURITE AWAITS
          </div>

          <h2
            style={{
              fontSize: "clamp(30px,4vw,45px)",
              lineHeight: 1.2,
              fontWeight: 900,
              letterSpacing: "-1.5px",
              marginBottom: "15px",
            }}
          >
            Make every break a little better.
          </h2>

          <p
            style={{
              maxWidth: "560px",
              margin: "0 auto 27px",
              color: "#aebbd0",
              fontSize: "14px",
              lineHeight: 1.9,
            }}
          >
            Spend less time waiting and more time enjoying your day.
            Your smarter campus food experience starts here.
          </p>

          <div className="d-flex flex-wrap justify-content-center gap-3">
            {getPrimaryAction()}

            {!isLoggedIn && (
              <Link
                to="/register/student"
                className="cb-home-secondary"
              >
                Create Your Account ↗
              </Link>
            )}

            {isLoggedIn && userRole === "student" && (
              <Link
                to="/my-orders"
                className="cb-home-secondary"
              >
                Track My Orders ↗
              </Link>
            )}
          </div>

        </div>
      </section>

      {/* ==================================================
          PROFESSIONAL FOOTER
      ================================================== */}

      <footer className="cb-home-footer">
        <div className="cb-home-container">

          <div className="row g-4">

            {/* BRAND */}

            <div className="col-lg-6 col-md-7">
              <Link
                to="/"
                className="d-inline-flex align-items-center gap-3 mb-3"
                style={{ color: "#fff" }}
              >
                <span
                  style={{
                    width: "47px",
                    height: "47px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "15px",
                    background:
                      "linear-gradient(135deg,#ffd09d,#ff955b)",
                    fontSize: "24px",
                  }}
                >
                  🍔
                </span>

                <span
                  style={{
                    fontSize: "25px",
                    fontWeight: 900,
                    letterSpacing: "-1px",
                  }}
                >
                  Campus<span style={{ color: "#ffb477" }}>Bite</span>
                </span>
              </Link>

              <p
                style={{
                  maxWidth: "405px",
                  color: "#9ba8bd",
                  fontSize: "13px",
                  lineHeight: 1.9,
                }}
              >
                A smarter campus food ordering platform built to
                simplify pre-orders, token generation and pickup.
              </p>

              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  border: "1px solid rgba(255,255,255,.10)",
                  borderRadius: "999px",
                  padding: "9px 12px",
                  color: "#b5c2d5",
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: ".7px",
                }}
              >
                <span style={{ color: "#5cdda6" }}>●</span>
                SMART PRE-ORDER & TOKEN SYSTEM
              </div>
            </div>

            {/* QUICK LINKS */}

            <div className="col-6 col-md-2">
              <h6
                style={{
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 900,
                  letterSpacing: "1px",
                  marginBottom: "19px",
                }}
              >
                EXPLORE
              </h6>

              <div className="d-flex flex-column gap-3">
                <Link to="/" className="cb-home-footer-link">
                  Home
                </Link>

                <Link
                  to="/canteen-menu"
                  className="cb-home-footer-link"
                >
                  Food Courts
                </Link>

                <Link to="/cart" className="cb-home-footer-link">
                  My Cart
                </Link>

                <Link
                  to="/my-orders"
                  className="cb-home-footer-link"
                >
                  My Orders
                </Link>
              </div>
            </div>

            {/* ACCOUNT */}

            <div className="col-6 col-md-4 col-lg-3">
              <h6
                style={{
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 900,
                  letterSpacing: "1px",
                  marginBottom: "19px",
                }}
              >
                YOUR ACCOUNT
              </h6>

              <div className="d-flex flex-column gap-3">
                {!isLoggedIn && (
                  <>
                    <Link
                      to="/login/student"
                      className="cb-home-footer-link"
                    >
                      Student Login
                    </Link>

                    <Link
                      to="/register/student"
                      className="cb-home-footer-link"
                    >
                      Create Account
                    </Link>
                  </>
                )}

                {isLoggedIn && userRole === "student" && (
                  <Link
                    to="/my-orders"
                    className="cb-home-footer-link"
                  >
                    Track Your Orders
                  </Link>
                )}

                {isLoggedIn && userRole === "staff" && (
                  <Link
                    to="/staff/dashboard"
                    className="cb-home-footer-link"
                  >
                    Staff Dashboard
                  </Link>
                )}

                {isLoggedIn && userRole === "admin" && (
                  <Link
                    to="/admin/dashboard"
                    className="cb-home-footer-link"
                  >
                    Admin Dashboard
                  </Link>
                )}

                <span className="cb-home-footer-link">
                  Smart Token Pickup
                </span>
              </div>
            </div>

          </div>

          {/* COPYRIGHT */}

          <div className="cb-home-footer-bottom d-flex flex-wrap justify-content-between align-items-center gap-2">
            <span>
              © {new Date().getFullYear()} Campus Bite. All rights reserved.
            </span>

            <span>
              Built for a smarter campus experience.
            </span>
          </div>

          {/* DEVELOPER CREDIT — LAST ELEMENT */}

          <div className="cb-home-developer">
            <div
              style={{
                color: "#8796ad",
                fontSize: "9px",
                fontWeight: 900,
                letterSpacing: "2.3px",
                marginBottom: "8px",
              }}
            >
              DESIGNED & DEVELOPED BY
            </div>

            <div
              style={{
                color: "#fff",
                fontSize: "17px",
                fontWeight: 900,
                letterSpacing: ".3px",
              }}
            >
              Mohd <span style={{ color: "#ffb477" }}>Altamash</span>
            </div>

            <div
              style={{
                color: "#7f8ba0",
                fontSize: "10px",
                marginTop: "6px",
              }}
            >
              MCA · Campus Bite Project
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};

export default Home;