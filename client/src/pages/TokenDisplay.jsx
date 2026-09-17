import React, { useEffect, useMemo, useState } from "react";

const API_URL = process.env.REACT_APP_API_URL;

const REFRESH_INTERVAL = 5000;
const NEXT_TOKEN_LIMIT = 6;
const READY_TOKEN_LIMIT = 8;

const ACTIVE_STATUSES = [
  "Pending",
  "Preparing",
  "Ready",
];

const STATUS = {
  PENDING: "Pending",
  PREPARING: "Preparing",
  READY: "Ready",
};

const TokenDisplay = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState("");

  // =====================================================
  // FETCH ORDERS
  // =====================================================

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      setError("");

      const token =
        localStorage.getItem("token");

      if (!token) {
        setError("Staff login required.");
        return;
      }

      const response = await fetch(
        `${API_URL}/orders/all`,
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Failed to load token information."
        );
        return;
      }

      if (!Array.isArray(data)) {
        setError(
          "Invalid orders response from server."
        );
        return;
      }

      setOrders(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(
        "Token display fetch error:",
        error
      );

      setError(
        "Unable to connect to the server."
      );
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // =====================================================
  // INITIAL LOAD + AUTO REFRESH
  // =====================================================

  useEffect(() => {
    fetchOrders();

    const interval =
      setInterval(
        () => fetchOrders(true),
        REFRESH_INTERVAL
      );

    return () => {
      clearInterval(interval);
    };
  }, []);

  // =====================================================
  // SORT TOKENS
  // =====================================================

  const sortByToken = (a, b) =>
    Number(a.tokenNumber || 0) -
    Number(b.tokenNumber || 0);

  // =====================================================
  // NOW SERVING
  // =====================================================

  const nowServing = useMemo(() => {
    return orders
      .filter(
        (order) =>
          order.status ===
          STATUS.PREPARING
      )
      .sort(sortByToken);
  }, [orders]);

  // =====================================================
  // READY FOR PICKUP
  // =====================================================

  const readyOrders = useMemo(() => {
    return orders
      .filter(
        (order) =>
          order.status === STATUS.READY
      )
      .sort(sortByToken);
  }, [orders]);

  // =====================================================
  // NEXT TOKENS
  // =====================================================

  const nextTokens = useMemo(() => {
    return orders
      .filter(
        (order) =>
          order.status ===
          STATUS.PENDING
      )
      .sort(sortByToken)
      .slice(0, NEXT_TOKEN_LIMIT);
  }, [orders]);

  // =====================================================
  // ACTIVE ORDER COUNT
  // =====================================================

  const activeCount = useMemo(() => {
    return orders.filter(
      (order) =>
        ACTIVE_STATUSES.includes(
          order.status
        )
    ).length;
  }, [orders]);

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #061a33, #0b3d78)",
        color: "white",
        padding: "25px 15px",
      }}
    >

      <div className="container-fluid">

        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">

          <div>

            <span
              className="badge rounded-pill mb-2"
              style={{
                background:
                  "rgba(255,255,255,0.12)",
                padding: "8px 13px",
              }}
            >
              🎟️ SMART CANTEEN
            </span>

            <h1
              className="fw-bold mb-1"
              style={{
                fontSize:
                  "clamp(28px, 4vw, 48px)",
              }}
            >
              Token Display
            </h1>

            <p
              className="mb-0"
              style={{
                opacity: 0.75,
                fontSize: "17px",
              }}
            >
              Live order token management
            </p>

          </div>

          <div className="text-end">

            <div
              className="badge bg-success px-3 py-2"
              style={{
                fontSize: "14px",
              }}
            >
              ● LIVE
            </div>

            <div
              className="mt-2"
              style={{
                opacity: 0.65,
                fontSize: "13px",
              }}
            >
              Auto refresh enabled
            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div
            className="alert alert-danger border-0 shadow-sm"
            style={{
              borderRadius: "12px",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* ================================================= */}
        {/* LOADING */}
        {/* ================================================= */}

        {loading && (
          <div className="text-center py-5">

            <div
              className="spinner-border text-light"
              role="status"
            />

            <p className="mt-3">
              Loading token display...
            </p>

          </div>
        )}

        {!loading && !error && (
          <>

            {/* ================================================= */}
            {/* MAIN TOKEN AREA */}
            {/* ================================================= */}

            <div className="row g-4 mb-4">

              {/* ================================================= */}
              {/* NOW SERVING */}
              {/* ================================================= */}

              <div className="col-12 col-lg-6">

                <div
                  className="card border-0 shadow-lg h-100"
                  style={{
                    borderRadius: "20px",
                    overflow: "hidden",
                  }}
                >

                  <div
                    className="text-center text-white"
                    style={{
                      background:
                        "linear-gradient(135deg, #198754, #20c997)",
                      padding: "18px",
                    }}
                  >
                    <h2 className="fw-bold mb-0">
                      👨‍🍳 NOW SERVING
                    </h2>
                  </div>

                  <div
                    className="card-body text-center"
                    style={{
                      color: "#212529",
                      padding:
                        "35px 20px",
                    }}
                  >

                    {nowServing.length > 0 ? (
                      <>
                        <div
                          className="fw-bold"
                          style={{
                            fontSize:
                              "clamp(80px, 15vw, 180px)",
                            lineHeight: 1,
                            color: "#198754",
                          }}
                        >
                          #
                          {
                            nowServing[0]
                              .tokenNumber
                          }
                        </div>

                        <div
                          className="mt-3 fw-semibold"
                          style={{
                            fontSize: "19px",
                          }}
                        >
                          Please proceed to
                          collect your order
                        </div>

                        <div className="text-muted mt-2">
                          {
                            nowServing[0]
                              .orderId
                          }
                        </div>
                      </>
                    ) : (
                      <>
                        <div
                          style={{
                            fontSize: "70px",
                          }}
                        >
                          🍽️
                        </div>

                        <h3 className="fw-bold mt-3">
                          No Token Currently Serving
                        </h3>

                        <p className="text-muted mb-0">
                          Please wait for the
                          next order.
                        </p>
                      </>
                    )}

                  </div>

                </div>

              </div>

              {/* ================================================= */}
              {/* READY FOR PICKUP */}
              {/* ================================================= */}

              <div className="col-12 col-lg-6">

                <div
                  className="card border-0 shadow-lg h-100"
                  style={{
                    borderRadius: "20px",
                    overflow: "hidden",
                  }}
                >

                  <div
                    className="text-center text-white"
                    style={{
                      background:
                        "linear-gradient(135deg, #fd7e14, #ffc107)",
                      padding: "18px",
                    }}
                  >
                    <h2 className="fw-bold mb-0">
                      🔔 READY FOR PICKUP
                    </h2>
                  </div>

                  <div
                    className="card-body"
                    style={{
                      color: "#212529",
                      padding: "25px",
                    }}
                  >

                    {readyOrders.length > 0 ? (
                      <div className="row g-3">

                        {readyOrders
                          .slice(
                            0,
                            READY_TOKEN_LIMIT
                          )
                          .map((order) => (
                            <div
                              className="col-6 col-md-4"
                              key={order._id}
                            >

                              <div
                                className="text-center h-100"
                                style={{
                                  background:
                                    "#fff3cd",
                                  border:
                                    "2px solid #ffc107",
                                  borderRadius:
                                    "14px",
                                  padding:
                                    "15px 8px",
                                }}
                              >

                                <small className="text-muted">
                                  TOKEN
                                </small>

                                <div
                                  className="fw-bold"
                                  style={{
                                    fontSize:
                                      "clamp(32px, 5vw, 50px)",
                                    color:
                                      "#dc3545",
                                    lineHeight:
                                      1.1,
                                  }}
                                >
                                  #
                                  {
                                    order.tokenNumber
                                  }
                                </div>

                              </div>

                            </div>
                          ))}

                      </div>
                    ) : (
                      <div
                        className="text-center py-5"
                      >

                        <div
                          style={{
                            fontSize: "65px",
                          }}
                        >
                          🔕
                        </div>

                        <h4 className="fw-bold mt-3">
                          No Orders Ready
                        </h4>

                        <p className="text-muted mb-0">
                          Ready tokens will
                          appear here.
                        </p>

                      </div>
                    )}

                  </div>

                </div>

              </div>

            </div>

            {/* ================================================= */}
            {/* NEXT TOKENS */}
            {/* ================================================= */}

            <div
              className="card border-0 shadow-lg mb-4"
              style={{
                borderRadius: "20px",
                overflow: "hidden",
              }}
            >

              <div
                className="text-center"
                style={{
                  background: "white",
                  color: "#212529",
                  padding: "20px",
                }}
              >

                <h3 className="fw-bold mb-1">
                  ⏭️ NEXT TOKENS
                </h3>

                <small className="text-muted">
                  Upcoming orders in queue
                </small>

              </div>

              <div className="card-body">

                {nextTokens.length > 0 ? (
                  <div className="row g-3">

                    {nextTokens.map(
                      (order, index) => (
                        <div
                          className="col-6 col-md-4 col-lg-2"
                          key={order._id}
                        >

                          <div
                            className="text-center h-100"
                            style={{
                              background:
                                "#eef4ff",
                              border:
                                "2px solid #d8e5ff",
                              borderRadius:
                                "15px",
                              padding:
                                "15px 8px",
                            }}
                          >

                            <small className="text-muted">
                              POSITION #
                              {index + 1}
                            </small>

                            <div
                              className="fw-bold text-primary"
                              style={{
                                fontSize:
                                  "clamp(35px, 5vw, 55px)",
                                lineHeight:
                                  1.1,
                              }}
                            >
                              #
                              {
                                order.tokenNumber
                              }
                            </div>

                            <span className="badge bg-warning text-dark">
                              ⏳ Pending
                            </span>

                          </div>

                        </div>
                      )
                    )}

                  </div>
                ) : (
                  <div
                    className="text-center py-4"
                  >

                    <div
                      style={{
                        fontSize: "50px",
                      }}
                    >
                      🎉
                    </div>

                    <h5 className="text-dark fw-bold">
                      No Pending Tokens
                    </h5>

                    <p className="text-muted mb-0">
                      New orders will appear
                      here automatically.
                    </p>

                  </div>
                )}

              </div>

            </div>

            {/* ================================================= */}
            {/* FOOTER STATS */}
            {/* ================================================= */}

            <div className="row g-3">

              <div className="col-12 col-md-4">

                <div
                  className="rounded p-3 text-center h-100"
                  style={{
                    background:
                      "rgba(255,255,255,0.10)",
                  }}
                >

                  <small
                    style={{
                      opacity: 0.7,
                    }}
                  >
                    ACTIVE ORDERS
                  </small>

                  <h2 className="fw-bold mb-0 mt-1">
                    {activeCount}
                  </h2>

                </div>

              </div>

              <div className="col-12 col-md-4">

                <div
                  className="rounded p-3 text-center h-100"
                  style={{
                    background:
                      "rgba(255,255,255,0.10)",
                  }}
                >

                  <small
                    style={{
                      opacity: 0.7,
                    }}
                  >
                    READY TOKENS
                  </small>

                  <h2 className="fw-bold mb-0 mt-1">
                    {readyOrders.length}
                  </h2>

                </div>

              </div>

              <div className="col-12 col-md-4">

                <div
                  className="rounded p-3 text-center h-100"
                  style={{
                    background:
                      "rgba(255,255,255,0.10)",
                  }}
                >

                  <small
                    style={{
                      opacity: 0.7,
                    }}
                  >
                    LAST UPDATED
                  </small>

                  <h6 className="fw-bold mb-0 mt-1">

                    {lastUpdated
                      ? lastUpdated.toLocaleTimeString(
                          "en-IN"
                        )
                      : "--"}

                  </h6>

                </div>

              </div>

            </div>

          </>
        )}

      </div>

    </div>
  );
};

export default TokenDisplay;