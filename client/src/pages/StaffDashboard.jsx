import React, { useEffect, useMemo, useState } from "react";
import { useHistory } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

const ORDER_STATUS = [
  "Pending",
  "Preparing",
  "Ready",
  "Completed",
  "Cancelled",
];

const SECTION_CONFIG = {
  active: {
    title: "🔥 Active Orders",
    button: "🔥 Active Orders",
  },
  completed: {
    title: "📦 Completed Orders",
    button: "📦 Completed Orders",
  },
  cancelled: {
    title: "❌ Cancelled Orders",
    button: "❌ Cancelled Orders",
  },
};

const STATUS_META = {
  Pending: {
    icon: "⏳",
    className: "bg-warning text-dark",
  },
  Preparing: {
    icon: "👨‍🍳",
    className: "bg-info text-dark",
  },
  Ready: {
    icon: "🔔",
    className: "bg-success",
  },
  Completed: {
    icon: "✅",
    className: "bg-primary",
  },
  Cancelled: {
    icon: "❌",
    className: "bg-danger",
  },
};

const StaffDashboard = () => {
  const history = useHistory();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [activeSection, setActiveSection] = useState("active");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [pendingStatus, setPendingStatus] = useState("");
  const [updatingOrder, setUpdatingOrder] = useState(null);

  // =====================================================
  // STUDENT INFORMATION
  // =====================================================

  const getStudentName = (order) =>
    order.studentName ||
    order.user?.name ||
    "Unknown Student";

  const getStudentEmail = (order) =>
    order.studentEmail ||
    order.user?.email ||
    "No email";

  // =====================================================
  // FETCH ORDERS
  // =====================================================

  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      }

      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError("Please login as staff.");

        if (!silent) {
          setLoading(false);
        }

        return;
      }

      const response = await fetch(
        `${API_URL}/orders/all`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.message ||
            "Failed to fetch orders."
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
    } catch (err) {
      console.error(
        "Fetch orders error:",
        err
      );

      setError(
        "Something went wrong while loading orders."
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

    const interval = setInterval(() => {
      fetchOrders(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // =====================================================
  // LIVE QUEUE
  // =====================================================

  const liveQueue = useMemo(
    () =>
      orders
        .filter(
          ({ status }) =>
            status === "Pending" ||
            status === "Preparing"
        )
        .sort(
          (a, b) =>
            Number(a.tokenNumber || 0) -
            Number(b.tokenNumber || 0)
        ),
    [orders]
  );

  const currentlyServing = useMemo(
    () =>
      liveQueue.find(
        ({ status }) =>
          status === "Preparing"
      ),
    [liveQueue]
  );

  const nextOrder = useMemo(
    () =>
      liveQueue.find(
        ({ status }) =>
          status === "Pending"
      ),
    [liveQueue]
  );

  // =====================================================
  // ORDER GROUPS
  // =====================================================

  const activeOrders = useMemo(
    () =>
      orders.filter(
        ({ status }) =>
          status !== "Completed" &&
          status !== "Cancelled"
      ),
    [orders]
  );

  const completedOrders = useMemo(
    () =>
      orders.filter(
        ({ status }) =>
          status === "Completed"
      ),
    [orders]
  );

  const cancelledOrders = useMemo(
    () =>
      orders.filter(
        ({ status }) =>
          status === "Cancelled"
      ),
    [orders]
  );

  // =====================================================
  // FILTERED ORDERS
  // =====================================================

  const filteredOrders = useMemo(() => {
    const sectionOrders = {
      active: activeOrders,
      completed: completedOrders,
      cancelled: cancelledOrders,
    };

    const currentOrders =
      sectionOrders[activeSection] || [];

    const searchText =
      search.toLowerCase().trim();

    return currentOrders.filter(
      (order) => {
        const studentName =
          getStudentName(order).toLowerCase();

        const studentEmail =
          getStudentEmail(order).toLowerCase();

        const orderId = String(
          order.orderId || ""
        ).toLowerCase();

        const tokenNumber = String(
          order.tokenNumber || ""
        );

        const matchesSearch =
          !searchText ||
          orderId.includes(searchText) ||
          tokenNumber.includes(searchText) ||
          studentName.includes(searchText) ||
          studentEmail.includes(searchText);

        const matchesStatus =
          statusFilter === "All" ||
          order.status === statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }, [
    activeOrders,
    completedOrders,
    cancelledOrders,
    activeSection,
    search,
    statusFilter,
  ]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const orderCounts = useMemo(
    () =>
      orders.reduce(
        (counts, order) => {
          if (counts[order.status] !== undefined) {
            counts[order.status] += 1;
          }

          return counts;
        },
        {
          Pending: 0,
          Preparing: 0,
          Ready: 0,
          Completed: 0,
          Cancelled: 0,
        }
      ),
    [orders]
  );

  const totalSales = useMemo(
    () =>
      orders
        .filter(
          ({ status }) =>
            status !== "Cancelled"
        )
        .reduce(
          (total, order) =>
            total +
            Number(order.totalAmount || 0),
          0
        ),
    [orders]
  );

  // =====================================================
  // STATUS HELPERS
  // =====================================================

  const getStatusClass = (status) =>
    STATUS_META[status]?.className ||
    "bg-secondary";

  const getStatusIcon = (status) =>
    STATUS_META[status]?.icon || "📦";

  // =====================================================
  // UPDATE STATUS
  // =====================================================

  const updateStatus = async (
    orderId,
    newStatus
  ) => {
    try {
      setUpdatingOrder(orderId);

      const token =
        localStorage.getItem("token");

      if (!token) {
        alert("Please login as staff.");
        return;
      }

      const response = await fetch(
        `${API_URL}/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to update order status."
        );
        return;
      }

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order._id === orderId
            ? {
                ...order,
                status: newStatus,
              }
            : order
        )
      );

      setSelectedOrder(
        (previousOrder) =>
          previousOrder &&
          previousOrder._id === orderId
            ? {
                ...previousOrder,
                status: newStatus,
              }
            : previousOrder
      );

      setPendingStatus("");

      alert(
        `Order status changed to ${newStatus}.`
      );

      setTimeout(
        () => fetchOrders(true),
        500
      );
    } catch (err) {
      console.error(
        "Update status error:",
        err
      );

      alert(
        "Something went wrong while updating status."
      );
    } finally {
      setUpdatingOrder(null);
    }
  };

  // =====================================================
  // DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) return "N/A";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  // =====================================================
  // SECTION CHANGE
  // =====================================================

  const changeSection = (section) => {
    setActiveSection(section);
    setSearch("");
    setStatusFilter("All");
  };

  // =====================================================
  // DETAILS
  // =====================================================

  const openDetails = (order) => {
    setSelectedOrder(order);
    setPendingStatus("");
  };

  const closeDetails = () => {
    setSelectedOrder(null);
    setPendingStatus("");
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, #f5f7fb 0%, #eef3f9 100%)",
        paddingBottom: "60px",
      }}
    >

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <section
        style={{
          background:
            "linear-gradient(135deg, #061f49, #073b7a, #0d6efd)",
          color: "white",
          padding: "40px 20px 50px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="container">

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">

            <div>
              <span
                className="badge rounded-pill mb-3"
                style={{
                  background:
                    "rgba(255,255,255,0.14)",
                  padding: "8px 14px",
                }}
              >
                👨‍🍳 STAFF PANEL
              </span>

              <h1 className="fw-bold mb-1">
                Staff Dashboard
              </h1>

              <p className="mb-0 opacity-75">
                Manage orders and monitor the
                live token queue.
              </p>
            </div>

            <div className="d-flex flex-wrap gap-2">

              <button
                type="button"
                className="btn btn-warning fw-bold px-3"
                onClick={() =>
                  history.push(
                    "/token-display"
                  )
                }
              >
                🎟️ Token Display
              </button>

              <button
                type="button"
                className="btn btn-light fw-bold px-3"
                onClick={() =>
                  fetchOrders()
                }
                disabled={loading}
              >
                {loading
                  ? "⏳ Loading..."
                  : "🔄 Refresh Orders"}
              </button>

            </div>

          </div>

        </div>
      </section>

      {/* ================================================= */}
      {/* MAIN */}
      {/* ================================================= */}

      <main className="container py-4">

        {/* ================================================= */}
        {/* LIVE QUEUE */}
        {/* ================================================= */}

        <div
          className="card border-0 shadow-sm mb-4"
          style={{
            borderRadius: "18px",
            overflow: "hidden",
          }}
        >

          <div
            className="card-header text-white border-0 py-3"
            style={{
              background:
                "linear-gradient(135deg, #073b7a, #0d6efd)",
            }}
          >

            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">

              <div>
                <h5 className="fw-bold mb-1">
                  🔥 Live Token Queue
                </h5>

                <small className="opacity-75">
                  Queue updates automatically
                </small>
              </div>

              <span
                className="badge rounded-pill"
                style={{
                  background:
                    "rgba(255,255,255,0.15)",
                  padding: "8px 12px",
                }}
              >
                ● LIVE
              </span>

            </div>

          </div>

          <div className="card-body p-3 p-md-4">

            {/* QUEUE STATS */}

            <div className="row g-3 mb-4">

              <div className="col-12 col-md-4">
                <div
                  className="text-center p-3 h-100"
                  style={{
                    background: "#effbf4",
                    borderRadius: "14px",
                  }}
                >
                  <small className="text-muted fw-semibold">
                    👨‍🍳 NOW SERVING
                  </small>

                  <div
                    className="fw-bold text-success"
                    style={{
                      fontSize: "32px",
                    }}
                  >
                    {currentlyServing
                      ? `#${currentlyServing.tokenNumber}`
                      : "--"}
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div
                  className="text-center p-3 h-100"
                  style={{
                    background: "#fff8e8",
                    borderRadius: "14px",
                  }}
                >
                  <small className="text-muted fw-semibold">
                    ⏭️ NEXT TOKEN
                  </small>

                  <div
                    className="fw-bold text-warning"
                    style={{
                      fontSize: "32px",
                    }}
                  >
                    {nextOrder
                      ? `#${nextOrder.tokenNumber}`
                      : "--"}
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-4">
                <div
                  className="text-center p-3 h-100"
                  style={{
                    background: "#eef4ff",
                    borderRadius: "14px",
                  }}
                >
                  <small className="text-muted fw-semibold">
                    🎟️ ACTIVE QUEUE
                  </small>

                  <div
                    className="fw-bold text-primary"
                    style={{
                      fontSize: "32px",
                    }}
                  >
                    {liveQueue.length}
                  </div>
                </div>
              </div>

            </div>

            {/* QUEUE TABLE */}

            {liveQueue.length === 0 ? (
              <div
                className="text-center py-4 border rounded"
                style={{
                  background: "#fafbfd",
                }}
              >
                <div
                  style={{
                    fontSize: "38px",
                  }}
                >
                  🎉
                </div>

                <h6 className="fw-bold mt-2">
                  Queue is empty
                </h6>

                <p className="text-muted mb-0 small">
                  No pending or preparing
                  orders.
                </p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">

                  <thead className="table-light">
                    <tr>
                      <th>Position</th>
                      <th>Token</th>
                      <th>Order</th>
                      <th>Student</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {liveQueue.map(
                      (order, index) => (
                        <tr
                          key={order._id}
                          style={{
                            background:
                              order.status ===
                              "Preparing"
                                ? "#effbf4"
                                : undefined,
                          }}
                        >

                          <td>
                            <strong>
                              {index + 1}
                            </strong>
                          </td>

                          <td>
                            <strong
                              className="text-primary"
                              style={{
                                fontSize: "18px",
                              }}
                            >
                              #
                              {
                                order.tokenNumber
                              }
                            </strong>

                            {order.status ===
                              "Preparing" && (
                              <span className="badge bg-success ms-2">
                                NOW
                              </span>
                            )}
                          </td>

                          <td>
                            <strong>
                              {order.orderId}
                            </strong>
                          </td>

                          <td>
                            {getStudentName(
                              order
                            )}
                          </td>

                          <td>
                            <span
                              className={`badge ${getStatusClass(
                                order.status
                              )}`}
                            >
                              {
                                getStatusIcon(
                                  order.status
                                )
                              }{" "}
                              {
                                order.status
                              }
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() =>
                                openDetails(
                                  order
                                )
                              }
                            >
                              👁️ Details
                            </button>
                          </td>

                        </tr>
                      )
                    )}
                  </tbody>

                </table>
              </div>
            )}

          </div>
        </div>

        {/* ================================================= */}
        {/* STATISTICS */}
        {/* ================================================= */}

        <div className="row g-3 mb-4">

          {[
            {
              status: "Pending",
              label: "Pending",
            },
            {
              status: "Preparing",
              label: "Preparing",
            },
            {
              status: "Ready",
              label: "Ready",
            },
            {
              status: "Completed",
              label: "Completed",
            },
            {
              status: "Cancelled",
              label: "Cancelled",
            },
          ].map((item) => (
            <div
              className="col-6 col-md-4 col-lg"
              key={item.status}
            >
              <div
                className="card border-0 shadow-sm h-100"
                style={{
                  borderRadius: "15px",
                }}
              >
                <div className="card-body text-center p-3">

                  <div
                    style={{
                      fontSize: "27px",
                    }}
                  >
                    {getStatusIcon(
                      item.status
                    )}
                  </div>

                  <h3
                    className={`fw-bold mb-1 ${
                      item.status ===
                      "Pending"
                        ? "text-warning"
                        : item.status ===
                          "Preparing"
                        ? "text-info"
                        : item.status ===
                          "Ready"
                        ? "text-success"
                        : item.status ===
                          "Completed"
                        ? "text-primary"
                        : "text-danger"
                    }`}
                  >
                    {
                      orderCounts[
                        item.status
                      ]
                    }
                  </h3>

                  <small className="text-muted">
                    {item.label}
                  </small>

                </div>
              </div>
            </div>
          ))}

          <div className="col-12 col-md-4 col-lg">
            <div
              className="card border-0 shadow-sm h-100"
              style={{
                borderRadius: "15px",
              }}
            >
              <div className="card-body text-center p-3">

                <div
                  style={{
                    fontSize: "27px",
                  }}
                >
                  💰
                </div>

                <h3 className="fw-bold text-success mb-1">
                  ₹{totalSales}
                </h3>

                <small className="text-muted">
                  Total Sales
                </small>

              </div>
            </div>
          </div>

        </div>

        {/* ================================================= */}
        {/* ORDER SECTIONS */}
        {/* ================================================= */}

        <div
          className="card border-0 shadow-sm mb-4"
          style={{
            borderRadius: "16px",
          }}
        >
          <div className="card-body p-3">

            <div className="row g-2">

              {Object.entries(
                SECTION_CONFIG
              ).map(
                ([section, config]) => {

                  const count =
                    section === "active"
                      ? activeOrders.length
                      : section ===
                        "completed"
                      ? completedOrders.length
                      : cancelledOrders.length;

                  const active =
                    activeSection ===
                    section;

                  const buttonClass =
                    active
                      ? section ===
                        "active"
                        ? "btn-primary"
                        : section ===
                          "completed"
                        ? "btn-success"
                        : "btn-danger"
                      : section ===
                        "active"
                      ? "btn-outline-primary"
                      : section ===
                        "completed"
                      ? "btn-outline-success"
                      : "btn-outline-danger";

                  return (
                    <div
                      className="col-12 col-md-4"
                      key={section}
                    >
                      <button
                        type="button"
                        className={`btn ${buttonClass} w-100 py-3 fw-semibold`}
                        onClick={() =>
                          changeSection(
                            section
                          )
                        }
                      >
                        {config.button}

                        <span className="badge bg-light text-dark ms-2">
                          {count}
                        </span>
                      </button>
                    </div>
                  );
                }
              )}

            </div>

          </div>
        </div>

        {/* ================================================= */}
        {/* SEARCH + FILTER */}
        {/* ================================================= */}

        <div
          className="card border-0 shadow-sm mb-4"
          style={{
            borderRadius: "16px",
          }}
        >
          <div className="card-body p-3">

            <div className="row g-3">

              <div className="col-12 col-md-8">
                <div className="input-group">

                  <span className="input-group-text">
                    🔎
                  </span>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search Order ID, Token, Student..."
                    value={search}
                    onChange={(e) =>
                      setSearch(
                        e.target.value
                      )
                    }
                  />

                </div>
              </div>

              <div className="col-12 col-md-4">
                <select
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(
                      e.target.value
                    )
                  }
                >
                  <option value="All">
                    All Statuses
                  </option>

                  {ORDER_STATUS.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {
                          getStatusIcon(
                            status
                          )
                        }{" "}
                        {status}
                      </option>
                    )
                  )}
                </select>
              </div>

            </div>

          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div
            className="alert alert-danger border-0 shadow-sm"
            style={{
              borderRadius: "12px",
            }}
          >
            <strong>
              ⚠️ Error:
            </strong>{" "}
            {error}
          </div>
        )}

        {/* LOADING */}

        {loading && (
          <div className="text-center py-5">

            <div
              className="spinner-border text-primary"
              style={{
                width: "3rem",
                height: "3rem",
              }}
              role="status"
            />

            <p className="text-muted mt-3">
              Loading orders...
            </p>

          </div>
        )}

        {/* ================================================= */}
        {/* ORDERS */}
        {/* ================================================= */}

        {!loading && !error && (
          <div
            className="card border-0 shadow-sm"
            style={{
              borderRadius: "18px",
              overflow: "hidden",
            }}
          >

            <div className="card-header bg-white border-0 py-3">

              <h5 className="fw-bold mb-1">
                {
                  SECTION_CONFIG[
                    activeSection
                  ]?.title
                }
              </h5>

              <small className="text-muted">
                {filteredOrders.length} order(s)
              </small>

            </div>

            <div className="table-responsive">

              <table className="table table-hover align-middle mb-0">

                <thead className="table-light">
                  <tr>
                    <th>Token</th>
                    <th>Order</th>
                    <th>Student</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredOrders.map(
                    (order) => (
                      <tr key={order._id}>

                        <td>
                          <strong
                            className="text-primary"
                            style={{
                              fontSize: "19px",
                            }}
                          >
                            #
                            {
                              order.tokenNumber
                            }
                          </strong>
                        </td>

                        <td>
                          <strong>
                            {order.orderId}
                          </strong>

                          <small className="text-muted d-block">
                            {formatDate(
                              order.createdAt
                            )}
                          </small>
                        </td>

                        <td>
                          <strong>
                            {getStudentName(
                              order
                            )}
                          </strong>

                          <small className="text-muted d-block">
                            {getStudentEmail(
                              order
                            )}
                          </small>
                        </td>

                        <td>
                          {order.items
                            ?.length || 0}{" "}
                          item(s)

                          <small
                            className="text-muted d-block"
                            style={{
                              maxWidth:
                                "250px",
                            }}
                          >
                            {order.items
                              ?.map(
                                (item) =>
                                  `${item.name} × ${item.quantity}`
                              )
                              .join(", ")}
                          </small>
                        </td>

                        <td>
                          <strong className="text-success">
                            ₹
                            {
                              order.totalAmount
                            }
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`badge ${getStatusClass(
                              order.status
                            )} px-3 py-2`}
                          >
                            {
                              getStatusIcon(
                                order.status
                              )
                            }{" "}
                            {
                              order.status
                            }
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() =>
                              openDetails(
                                order
                              )
                            }
                          >
                            👁️ Details
                          </button>
                        </td>

                      </tr>
                    )
                  )}

                  {filteredOrders.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan="7"
                        className="text-center py-5"
                      >
                        <div
                          style={{
                            fontSize: "48px",
                          }}
                        >
                          📦
                        </div>

                        <h5 className="fw-bold mt-3">
                          No Orders Found
                        </h5>

                        <p className="text-muted mb-0">
                          Try changing the
                          search or filter.
                        </p>
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

          </div>
        )}

      </main>

      {/* ================================================= */}
      {/* DETAILS MODAL */}
      {/* ================================================= */}

      {selectedOrder && (
        <div
          className="modal d-block"
          tabIndex="-1"
          role="dialog"
          style={{
            background:
              "rgba(0,0,0,0.6)",
          }}
        >

          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">

            <div
              className="modal-content border-0"
              style={{
                borderRadius: "18px",
                overflow: "hidden",
              }}
            >

              {/* MODAL HEADER */}

              <div className="modal-header">

                <div>
                  <h5 className="modal-title fw-bold mb-1">
                    📦 Order Details
                  </h5>

                  <small className="text-muted">
                    {
                      selectedOrder.orderId
                    }
                  </small>
                </div>

                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={
                    closeDetails
                  }
                />

              </div>

              {/* MODAL BODY */}

              <div className="modal-body">

                {/* TOKEN + STATUS */}

                <div className="row g-3 mb-4">

                  <div className="col-12 col-md-6">
                    <div
                      className="text-center p-3"
                      style={{
                        background:
                          "#f1f5ff",
                        borderRadius:
                          "14px",
                      }}
                    >
                      <small className="text-muted">
                        TOKEN NUMBER
                      </small>

                      <div
                        className="fw-bold text-primary"
                        style={{
                          fontSize: "38px",
                        }}
                      >
                        #
                        {
                          selectedOrder.tokenNumber
                        }
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div
                      className="text-center p-3"
                      style={{
                        background:
                          "#f7f8fa",
                        borderRadius:
                          "14px",
                      }}
                    >
                      <small className="text-muted">
                        CURRENT STATUS
                      </small>

                      <div className="mt-2">
                        <span
                          className={`badge ${getStatusClass(
                            selectedOrder.status
                          )} px-3 py-2`}
                        >
                          {
                            getStatusIcon(
                              selectedOrder.status
                            )
                          }{" "}
                          {
                            selectedOrder.status
                          }
                        </span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* STUDENT */}

                <div
                  className="p-3 mb-4"
                  style={{
                    border:
                      "1px solid #e9ecef",
                    borderRadius:
                      "14px",
                  }}
                >

                  <h6 className="fw-bold mb-3">
                    👤 Student Details
                  </h6>

                  <div className="row g-2">

                    <div className="col-12 col-md-6">
                      <small className="text-muted d-block">
                        Name
                      </small>

                      <strong>
                        {
                          getStudentName(
                            selectedOrder
                          )
                        }
                      </strong>
                    </div>

                    <div className="col-12 col-md-6">
                      <small className="text-muted d-block">
                        Email
                      </small>

                      <strong>
                        {
                          getStudentEmail(
                            selectedOrder
                          )
                        }
                      </strong>
                    </div>

                  </div>

                </div>

                {/* ITEMS */}

                <h6 className="fw-bold mb-3">
                  🍔 Ordered Items
                </h6>

                <div className="table-responsive">

                  <table className="table table-bordered align-middle">

                    <thead className="table-light">
                      <tr>
                        <th>Item</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>

                    <tbody>

                      {selectedOrder.items?.map(
                        (item, index) => (
                          <tr
                            key={
                              item._id ||
                              index
                            }
                          >
                            <td>
                              {item.name}
                            </td>

                            <td>
                              ₹{item.price}
                            </td>

                            <td>
                              {item.quantity}
                            </td>

                            <td className="fw-bold text-success">
                              ₹
                              {
                                item.subtotal
                              }
                            </td>
                          </tr>
                        )
                      )}

                    </tbody>

                    <tfoot>
                      <tr>
                        <td
                          colSpan="3"
                          className="text-end fw-bold"
                        >
                          Total
                        </td>

                        <td className="fw-bold text-success">
                          ₹
                          {
                            selectedOrder.totalAmount
                          }
                        </td>
                      </tr>
                    </tfoot>

                  </table>

                </div>

                {/* STATUS UPDATE */}

                {![
                  "Completed",
                  "Cancelled",
                ].includes(
                  selectedOrder.status
                ) && (
                  <div className="mt-4">

                    <h6 className="fw-bold mb-3">
                      ⚙️ Update Order Status
                    </h6>

                    <div className="d-flex flex-wrap gap-2">

                      {ORDER_STATUS.map(
                        (status) => (
                          <button
                            type="button"
                            key={status}
                            className={`btn ${
                              pendingStatus ===
                              status
                                ? "btn-primary"
                                : "btn-outline-secondary"
                            }`}
                            disabled={
                              updatingOrder ===
                                selectedOrder._id ||
                              selectedOrder.status ===
                                status
                            }
                            onClick={() =>
                              setPendingStatus(
                                status
                              )
                            }
                          >
                            {
                              getStatusIcon(
                                status
                              )}{" "}
                            {status}
                          </button>
                        )
                      )}

                    </div>

                    {pendingStatus &&
                      pendingStatus !==
                        selectedOrder.status && (
                        <div
                          className="mt-3 p-3"
                          style={{
                            background:
                              "#f8f9fa",
                            borderRadius:
                              "12px",
                          }}
                        >

                          <p className="mb-3">
                            Change status to{" "}
                            <strong>
                              {
                                pendingStatus
                              }
                            </strong>
                            ?
                          </p>

                          <button
                            type="button"
                            className="btn btn-success me-2"
                            disabled={
                              updatingOrder ===
                              selectedOrder._id
                            }
                            onClick={() =>
                              updateStatus(
                                selectedOrder._id,
                                pendingStatus
                              )
                            }
                          >
                            {updatingOrder ===
                            selectedOrder._id
                              ? "Updating..."
                              : "✅ Confirm Update"}
                          </button>

                          <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() =>
                              setPendingStatus(
                                ""
                              )
                            }
                          >
                            Cancel
                          </button>

                        </div>
                      )}

                  </div>
                )}

              </div>

              {/* MODAL FOOTER */}

              <div className="modal-footer">

                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={
                    closeDetails
                  }
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default StaffDashboard;