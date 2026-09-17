import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";

// =====================================================
// CONFIGURATION
// =====================================================

const API = process.env.REACT_APP_API_URL;

const FOOD_CATEGORIES = [
  "Breakfast",
  "Lunch",
  "Snacks",
  "Beverages",
  "Fast Food",
];

const ORDER_STATUSES = [
  "Pending",
  "Preparing",
  "Ready",
  "Completed",
  "Cancelled",
];

const STAFF_DEPARTMENTS = [
  "Canteen",
  "Kitchen",
  "Management",
  "Food Counter",
  "Other",
];

const EMPTY_FOOD_FORM = {
  name: "",
  description: "",
  price: "",
  category: "Fast Food",
  imageUrl: "",
  imageFile: null,
  isAvailable: true,
};

const EMPTY_STAFF_FORM = {
  name: "",
  email: "",
  department: "",
  password: "",
};

// =====================================================
// ADMIN DASHBOARD
// =====================================================

const AdminDashboard = () => {
  const [activeTab, setActiveTab] =
    useState("dashboard");

  // =====================================================
  // FOOD
  // =====================================================

  const [foodItems, setFoodItems] =
    useState([]);

  const [foodLoading, setFoodLoading] =
    useState(false);

  const [foodForm, setFoodForm] =
    useState(EMPTY_FOOD_FORM);

  const [editingFood, setEditingFood] =
    useState(null);

  const [foodSearch, setFoodSearch] =
    useState("");

  // =====================================================
  // ORDERS
  // =====================================================

  const [orders, setOrders] =
    useState([]);

  const [orderLoading, setOrderLoading] =
    useState(false);

  const [orderSearch, setOrderSearch] =
    useState("");

  const [
    orderStatusFilter,
    setOrderStatusFilter,
  ] = useState("All");

  // =====================================================
  // STAFF
  // =====================================================

  const [staffList, setStaffList] =
    useState([]);

  const [staffLoading, setStaffLoading] =
    useState(false);

  const [
    staffCreating,
    setStaffCreating,
  ] = useState(false);

  const [staffForm, setStaffForm] =
    useState(EMPTY_STAFF_FORM);

  // =====================================================
  // MESSAGES
  // =====================================================

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  // =====================================================
  // AUTH TOKEN
  // =====================================================

  const getToken = useCallback(
    () => localStorage.getItem("token"),
    []
  );

  const getAuthConfig = useCallback(() => {
    const token = getToken();

    return token
      ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
      : null;
  }, [getToken]);

  // =====================================================
  // FETCH FOOD
  // =====================================================

  const fetchFoodItems = useCallback(async () => {
    try {
      setFoodLoading(true);
      setError("");

      const response = await axios.get(
        `${API}/food`
      );

      setFoodItems(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error(
        "Food fetch error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to load food items."
      );
    } finally {
      setFoodLoading(false);
    }
  }, []);

  // =====================================================
  // FETCH ORDERS
  // =====================================================

  const fetchOrders = useCallback(async () => {
    try {
      setOrderLoading(true);
      setError("");

      const config = getAuthConfig();

      if (!config) {
        setError("Please login as admin.");
        return;
      }

      const response = await axios.get(
        `${API}/orders/all`,
        config
      );

      setOrders(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error(
        "Order fetch error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to load orders."
      );
    } finally {
      setOrderLoading(false);
    }
  }, [getAuthConfig]);

  // =====================================================
  // FETCH STAFF
  // =====================================================

  const fetchStaff = useCallback(async () => {
    try {
      setStaffLoading(true);
      setError("");

      const config = getAuthConfig();

      if (!config) {
        setError("Please login as admin.");
        return;
      }

      const response = await axios.get(
        `${API}/auth/staff`,
        config
      );

      setStaffList(
        Array.isArray(response.data)
          ? response.data
          : []
      );
    } catch (err) {
      console.error(
        "Staff fetch error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to load staff list."
      );
    } finally {
      setStaffLoading(false);
    }
  }, [getAuthConfig]);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchFoodItems();
    fetchOrders();
    fetchStaff();
  }, [fetchFoodItems, fetchOrders, fetchStaff]);

  // =====================================================
  // FOOD FORM CHANGE
  // =====================================================

  const handleFoodChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setFoodForm((previous) => ({
      ...previous,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // =====================================================
  // RESET FOOD FORM
  // =====================================================

  const resetFoodForm = () => {
    setFoodForm({
      ...EMPTY_FOOD_FORM,
    });

    setEditingFood(null);
  };

  // =====================================================
  // FOOD IMAGE CHANGE
  // =====================================================

  const handleFoodImageChange = (e) => {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    const maxSize =
      5 * 1024 * 1024;

    if (file.size > maxSize) {
      setError(
        "Image size must be less than 5 MB."
      );

      e.target.value = "";
      return;
    }

    setError("");

    setFoodForm((previous) => ({
      ...previous,
      imageFile: file,
    }));
  };

  // =====================================================
  // ADD / UPDATE FOOD
  // =====================================================

  const handleFoodSubmit = async (e) => {
    e.preventDefault();

    try {
      setMessage("");
      setError("");

      if (!foodForm.name.trim()) {
        setError(
          "Food name is required."
        );
        return;
      }

      if (
        foodForm.price === "" ||
        Number(foodForm.price) < 0
      ) {
        setError(
          "Please enter a valid price."
        );
        return;
      }

      const formData =
        new FormData();

      formData.append(
        "name",
        foodForm.name.trim()
      );

      formData.append(
        "description",
        foodForm.description.trim()
      );

      formData.append(
        "price",
        Number(foodForm.price)
      );

      formData.append(
        "category",
        foodForm.category
      );

      formData.append(
        "isAvailable",
        foodForm.isAvailable
      );

      if (foodForm.imageFile) {
        formData.append(
          "image",
          foodForm.imageFile
        );
      } else if (
        foodForm.imageUrl
      ) {
        formData.append(
          "imageUrl",
          foodForm.imageUrl
        );
      }

      if (editingFood) {
        await axios.put(
          `${API}/food/${editingFood._id}`,
          formData
        );

        setMessage(
          "✅ Food item updated successfully."
        );
      } else {
        await axios.post(
          `${API}/food`,
          formData
        );

        setMessage(
          "✅ Food item added successfully."
        );
      }

      resetFoodForm();

      await fetchFoodItems();

      setActiveTab("food");
    } catch (err) {
      console.error(
        "Food save error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to save food item."
      );
    }
  };

  // =====================================================
  // EDIT FOOD
  // =====================================================

  const editFood = (item) => {
    setEditingFood(item);

    setFoodForm({
      name: item.name || "",
      description:
        item.description || "",
      price: item.price ?? "",
      category:
        item.category ||
        FOOD_CATEGORIES[
        FOOD_CATEGORIES.length - 1
        ],
      imageUrl:
        item.imageUrl || "",
      imageFile: null,
      isAvailable:
        item.isAvailable !== false,
    });

    setActiveTab("add-food");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =====================================================
  // DELETE FOOD
  // =====================================================

  const deleteFood = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this food item?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("");
      setError("");

      await axios.delete(
        `${API}/food/${id}`
      );

      setMessage(
        "🗑️ Food item deleted successfully."
      );

      await fetchFoodItems();
    } catch (err) {
      console.error(
        "Delete food error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to delete food item."
      );
    }
  };

  // =====================================================
  // TOGGLE FOOD AVAILABILITY
  // =====================================================

  const toggleAvailability = async (
    item
  ) => {
    try {
      setMessage("");
      setError("");

      await axios.put(
        `${API}/food/${item._id}`,
        {
          ...item,
          isAvailable:
            !item.isAvailable,
        }
      );

      setMessage(
        item.isAvailable
          ? "🔴 Food marked unavailable."
          : "🟢 Food marked available."
      );

      await fetchFoodItems();
    } catch (err) {
      console.error(
        "Availability update error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to update availability."
      );
    }
  };

  // =====================================================
  // UPDATE ORDER STATUS
  // =====================================================

  const updateOrderStatus = async (
    orderId,
    status
  ) => {
    try {
      setMessage("");
      setError("");

      const config =
        getAuthConfig();

      if (!config) {
        setError(
          "Please login as admin."
        );
        return;
      }

      await axios.put(
        `${API}/orders/${orderId}/status`,
        { status },
        config
      );

      setMessage(
        `✅ Order status changed to ${status}.`
      );

      await fetchOrders();
    } catch (err) {
      console.error(
        "Order status error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to update order status."
      );
    }
  };

  // =====================================================
  // STAFF FORM CHANGE
  // =====================================================

  const handleStaffChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setStaffForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =====================================================
  // RESET STAFF FORM
  // =====================================================

  const resetStaffForm = () => {
    setStaffForm({
      ...EMPTY_STAFF_FORM,
    });
  };

  // =====================================================
  // CREATE STAFF
  // =====================================================

  const handleCreateStaff = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    const {
      name,
      email,
      department,
      password,
    } = staffForm;

    if (
      !name.trim() ||
      !email.trim() ||
      !department.trim() ||
      !password.trim()
    ) {
      setError(
        "All staff fields are required."
      );
      return;
    }

    if (password.length < 6) {
      setError(
        "Staff password must be at least 6 characters long."
      );
      return;
    }

    try {
      setStaffCreating(true);

      const config =
        getAuthConfig();

      if (!config) {
        setError(
          "Please login as admin."
        );
        return;
      }

      const response =
        await axios.post(
          `${API}/auth/create-staff`,
          {
            name: name.trim(),
            email: email.trim(),
            department:
              department.trim(),
            password,
          },
          config
        );

      setMessage(
        response.data.message ||
        "Staff account created successfully."
      );

      resetStaffForm();

      await fetchStaff();
    } catch (err) {
      console.error(
        "Create staff error:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to create staff account."
      );
    } finally {
      setStaffCreating(false);
    }
  };

  // =====================================================
  // FILTER FOOD
  // =====================================================

  const filteredFood = useMemo(() => {
    const search =
      foodSearch
        .toLowerCase()
        .trim();

    if (!search) {
      return foodItems;
    }

    return foodItems.filter(
      (item) =>
        item.name
          ?.toLowerCase()
          .includes(search) ||
        item.category
          ?.toLowerCase()
          .includes(search)
    );
  }, [
    foodItems,
    foodSearch,
  ]);

  // =====================================================
  // FILTER ORDERS
  // =====================================================

  const filteredOrders = useMemo(() => {
    const search =
      orderSearch
        .toLowerCase()
        .trim();

    return orders.filter(
      (order) => {
        const studentName =
          order.user?.name ||
          order.studentName ||
          "";

        const studentEmail =
          order.user?.email ||
          order.studentEmail ||
          "";

        const orderId =
          order.orderId || "";

        const token = String(
          order.tokenNumber || ""
        );

        const matchesSearch =
          orderId
            .toLowerCase()
            .includes(search) ||
          token.includes(search) ||
          studentName
            .toLowerCase()
            .includes(search) ||
          studentEmail
            .toLowerCase()
            .includes(search);

        const matchesStatus =
          orderStatusFilter ===
          "All" ||
          order.status ===
          orderStatusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }, [
    orders,
    orderSearch,
    orderStatusFilter,
  ]);

  // =====================================================
  // STATISTICS
  // =====================================================

  const statistics = useMemo(() => {
    const counts =
      ORDER_STATUSES.reduce(
        (result, status) => {
          result[status] =
            orders.filter(
              (order) =>
                order.status ===
                status
            ).length;

          return result;
        },
        {}
      );

    const totalSales =
      orders
        .filter(
          (order) =>
            order.status !==
            "Cancelled"
        )
        .reduce(
          (total, order) =>
            total +
            Number(
              order.totalAmount || 0
            ),
          0
        );

    return {
      ...counts,
      totalSales,
    };
  }, [orders]);

  const availableFood =
    useMemo(
      () =>
        foodItems.filter(
          (item) =>
            item.isAvailable
        ).length,
      [foodItems]
    );

  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass = (
    status
  ) => {
    const classes = {
      Pending:
        "bg-warning text-dark",
      Preparing:
        "bg-info text-dark",
      Ready:
        "bg-success",
      Completed:
        "bg-primary",
      Cancelled:
        "bg-danger",
    };

    return (
      classes[status] ||
      "bg-secondary"
    );
  };

  // =====================================================
  // STATUS ICON
  // =====================================================

  const getStatusIcon = (
    status
  ) => {
    const icons = {
      Pending: "⏳",
      Preparing: "👨‍🍳",
      Ready: "🔔",
      Completed: "✅",
      Cancelled: "❌",
    };

    return icons[status] || "📦";
  };

  // =====================================================
  // DATE
  // =====================================================

  const formatDate = (date) => {
    if (!date) {
      return "N/A";
    }

    return new Date(
      date
    ).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor:
          "#f5f7fb",
      }}
    >
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div
        style={{
          background:
            "linear-gradient(135deg, #073b7a, #0d6efd)",
          color: "white",
        }}
      >
        <div className="container py-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h2 className="fw-bold mb-1">
                👑 Admin Dashboard
              </h2>

              <p className="mb-0 opacity-75">
                Smart Canteen Management System
              </p>
            </div>

            <button
              className="btn btn-light fw-bold"
              onClick={() => {
                fetchFoodItems();
                fetchOrders();
                fetchStaff();
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="container py-4">
        {/* ================================================= */}
        {/* ALERTS */}
        {/* ================================================= */}

        {message && (
          <div className="alert alert-success shadow-sm">
            {message}

            <button
              className="btn-close float-end"
              onClick={() =>
                setMessage("")
              }
            />
          </div>
        )}

        {error && (
          <div className="alert alert-danger shadow-sm">
            <strong>
              ⚠️ Error:
            </strong>{" "}
            {error}

            <button
              className="btn-close float-end"
              onClick={() =>
                setError("")
              }
            />
          </div>
        )}

        {/* ================================================= */}
        {/* NAVIGATION */}
        {/* ================================================= */}

        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body">
            <div className="row g-2">
              <div className="col-md-3 col-lg">
                <button
                  className={`btn w-100 ${activeTab ===
                    "dashboard"
                    ? "btn-primary"
                    : "btn-outline-primary"
                    }`}
                  onClick={() =>
                    setActiveTab(
                      "dashboard"
                    )
                  }
                >
                  📊 Dashboard
                </button>
              </div>

              <div className="col-md-3 col-lg">
                <button
                  className={`btn w-100 ${activeTab ===
                    "food"
                    ? "btn-success"
                    : "btn-outline-success"
                    }`}
                  onClick={() =>
                    setActiveTab("food")
                  }
                >
                  🍔 Food Menu
                </button>
              </div>

              <div className="col-md-3 col-lg">
                <button
                  className={`btn w-100 ${activeTab ===
                    "add-food"
                    ? "btn-warning"
                    : "btn-outline-warning"
                    }`}
                  onClick={() => {
                    resetFoodForm();
                    setActiveTab(
                      "add-food"
                    );
                  }}
                >
                  ➕ Add Food
                </button>
              </div>

              <div className="col-md-3 col-lg">
                <button
                  className={`btn w-100 ${activeTab ===
                    "orders"
                    ? "btn-info"
                    : "btn-outline-info"
                    }`}
                  onClick={() =>
                    setActiveTab(
                      "orders"
                    )
                  }
                >
                  📦 Orders
                </button>
              </div>

              <div className="col-md-6 col-lg">
                <button
                  className={`btn w-100 ${activeTab ===
                    "staff"
                    ? "btn-dark"
                    : "btn-outline-dark"
                    }`}
                  onClick={() => {
                    setActiveTab("staff");
                    fetchStaff();
                  }}
                >
                  👥 Staff Management
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================= */}
        {/* DASHBOARD */}
        {/* ================================================= */}

        {activeTab ===
          "dashboard" && (
            <>
              <div className="row g-3 mb-4">
                <div className="col-6 col-lg-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body text-center">
                      <div
                        style={{
                          fontSize: 35,
                        }}
                      >
                        🍔
                      </div>

                      <h3 className="fw-bold">
                        {foodItems.length}
                      </h3>

                      <small className="text-muted">
                        Total Food Items
                      </small>
                    </div>
                  </div>
                </div>

                <div className="col-6 col-lg-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body text-center">
                      <div
                        style={{
                          fontSize: 35,
                        }}
                      >
                        🟢
                      </div>

                      <h3 className="fw-bold text-success">
                        {availableFood}
                      </h3>

                      <small className="text-muted">
                        Available Items
                      </small>
                    </div>
                  </div>
                </div>

                <div className="col-6 col-lg-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body text-center">
                      <div
                        style={{
                          fontSize: 35,
                        }}
                      >
                        📦
                      </div>

                      <h3 className="fw-bold text-primary">
                        {orders.length}
                      </h3>

                      <small className="text-muted">
                        Total Orders
                      </small>
                    </div>
                  </div>
                </div>

                <div className="col-6 col-lg-3">
                  <div className="card border-0 shadow-sm h-100">
                    <div className="card-body text-center">
                      <div
                        style={{
                          fontSize: 35,
                        }}
                      >
                        💰
                      </div>

                      <h3 className="fw-bold text-success">
                        ₹
                        {
                          statistics.totalSales
                        }
                      </h3>

                      <small className="text-muted">
                        Total Sales
                      </small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <h5 className="fw-bold mb-4">
                    📦 Order Overview
                  </h5>

                  <div className="row g-3">
                    {[
                      {
                        status:
                          "Pending",
                        className:
                          "alert-warning",
                      },
                      {
                        status:
                          "Preparing",
                        className:
                          "alert-info",
                      },
                      {
                        status:
                          "Ready",
                        className:
                          "alert-success",
                      },
                      {
                        status:
                          "Completed",
                        className:
                          "alert-primary",
                      },
                    ].map(
                      ({
                        status,
                        className,
                      }) => (
                        <div
                          className="col-md-3"
                          key={status}
                        >
                          <div
                            className={`alert ${className} text-center mb-0`}
                          >
                            <h3 className="fw-bold">
                              {
                                statistics[
                                status
                                ]
                              }
                            </h3>

                            {
                              status
                            }
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

        {/* ================================================= */}
        {/* FOOD MENU */}
        {/* ================================================= */}

        {activeTab ===
          "food" && (
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                  <div>
                    <h4 className="fw-bold mb-1">
                      🍔 Food Menu Management
                    </h4>

                    <small className="text-muted">
                      Add, edit, delete and control food availability.
                    </small>
                  </div>

                  <button
                    className="btn btn-success"
                    onClick={() => {
                      resetFoodForm();
                      setActiveTab(
                        "add-food"
                      );
                    }}
                  >
                    ➕ Add New Food
                  </button>
                </div>

                <input
                  className="form-control mb-4"
                  placeholder="🔎 Search food..."
                  value={
                    foodSearch
                  }
                  onChange={(e) =>
                    setFoodSearch(
                      e.target.value
                    )
                  }
                />

                {foodLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" />

                    <p className="text-muted mt-3">
                      Loading food items...
                    </p>
                  </div>
                ) : filteredFood.length ===
                  0 ? (
                  <div className="text-center py-5">
                    <div
                      style={{
                        fontSize: 60,
                      }}
                    >
                      🍽️
                    </div>

                    <h5>
                      No food items found
                    </h5>
                  </div>
                ) : (
                  <div className="row g-4">
                    {filteredFood.map(
                      (item) => (
                        <div
                          className="col-md-6 col-lg-4"
                          key={item._id}
                        >
                          <div className="card h-100 border shadow-sm">
                            {item.imageUrl ? (
                              <img
                                src={
                                  item.imageUrl
                                }
                                alt={
                                  item.name
                                }
                                className="card-img-top"
                                style={{
                                  height: 180,
                                  objectFit:
                                    "cover",
                                }}
                              />
                            ) : (
                              <div
                                className="d-flex justify-content-center align-items-center bg-light"
                                style={{
                                  height: 180,
                                  fontSize: 70,
                                }}
                              >
                                🍔
                              </div>
                            )}

                            <div className="card-body">
                              <div className="d-flex justify-content-between align-items-start gap-2">
                                <h5 className="fw-bold">
                                  {
                                    item.name
                                  }
                                </h5>

                                <span
                                  className={`badge ${item.isAvailable
                                    ? "bg-success"
                                    : "bg-danger"
                                    }`}
                                >
                                  {item.isAvailable
                                    ? "Available"
                                    : "Unavailable"}
                                </span>
                              </div>

                              <span className="badge bg-light text-dark mb-2">
                                {
                                  item.category
                                }
                              </span>

                              <p className="text-muted">
                                {item.description ||
                                  "No description"}
                              </p>

                              <h5 className="text-success fw-bold">
                                ₹
                                {
                                  item.price
                                }
                              </h5>
                            </div>

                            <div className="card-footer bg-white border-0">
                              <div className="d-grid gap-2">
                                <button
                                  className={`btn ${item.isAvailable
                                    ? "btn-outline-danger"
                                    : "btn-outline-success"
                                    }`}
                                  onClick={() =>
                                    toggleAvailability(
                                      item
                                    )
                                  }
                                >
                                  {item.isAvailable
                                    ? "🔴 Mark Unavailable"
                                    : "🟢 Mark Available"}
                                </button>

                                <div className="d-flex gap-2">
                                  <button
                                    className="btn btn-outline-primary w-50"
                                    onClick={() =>
                                      editFood(
                                        item
                                      )
                                    }
                                  >
                                    ✏️ Edit
                                  </button>

                                  <button
                                    className="btn btn-outline-danger w-50"
                                    onClick={() =>
                                      deleteFood(
                                        item._id
                                      )
                                    }
                                  >
                                    🗑️ Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        {/* ================================================= */}
        {/* ADD / EDIT FOOD */}
        {/* ================================================= */}

        {activeTab ===
          "add-food" && (
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <h4 className="fw-bold mb-1">
                  {editingFood
                    ? "✏️ Edit Food Item"
                    : "➕ Add New Food Item"}
                </h4>

                <p className="text-muted mb-4">
                  Enter food item details below.
                </p>

                <form
                  onSubmit={
                    handleFoodSubmit
                  }
                >
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        Food Name
                      </label>

                      <input
                        type="text"
                        className="form-control"
                        name="name"
                        value={
                          foodForm.name
                        }
                        onChange={
                          handleFoodChange
                        }
                        placeholder="Enter food name"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        Price
                      </label>

                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        value={
                          foodForm.price
                        }
                        onChange={
                          handleFoodChange
                        }
                        placeholder="Enter price"
                        min="0"
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        Category
                      </label>

                      <select
                        className="form-select"
                        name="category"
                        value={
                          foodForm.category
                        }
                        onChange={
                          handleFoodChange
                        }
                      >
                        {FOOD_CATEGORIES.map(
                          (category) => (
                            <option
                              value={
                                category
                              }
                              key={
                                category
                              }
                            >
                              {category}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label fw-bold">
                        Food Image
                      </label>

                      <input
                        type="file"
                        className="form-control"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={
                          handleFoodImageChange
                        }
                      />

                      <small className="text-muted">
                        JPG, JPEG, PNG or WEBP — Maximum 5 MB
                      </small>

                      {foodForm.imageFile && (
                        <div className="mt-2">
                          <small className="text-success">
                            ✅ Selected:{" "}
                            {
                              foodForm
                                .imageFile
                                .name
                            }
                          </small>
                        </div>
                      )}

                      {!foodForm.imageFile &&
                        editingFood &&
                        foodForm.imageUrl && (
                          <div className="mt-2">
                            <small className="text-muted">
                              Current image will be kept if you don't select a new image.
                            </small>
                          </div>
                        )}
                    </div>

                    <div className="col-12">
                      <label className="form-label fw-bold">
                        Description
                      </label>

                      <textarea
                        className="form-control"
                        rows="4"
                        name="description"
                        value={
                          foodForm.description
                        }
                        onChange={
                          handleFoodChange
                        }
                        placeholder="Describe the food item..."
                      />
                    </div>

                    <div className="col-12">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          name="isAvailable"
                          checked={
                            foodForm.isAvailable
                          }
                          onChange={
                            handleFoodChange
                          }
                          id="availability"
                        />

                        <label
                          className="form-check-label fw-bold"
                          htmlFor="availability"
                        >
                          Food is Available
                        </label>
                      </div>
                    </div>
                  </div>

                  <hr className="my-4" />

                  <div className="d-flex gap-2 flex-wrap">
                    <button
                      type="submit"
                      className="btn btn-success px-4"
                    >
                      {editingFood
                        ? "💾 Update Food"
                        : "➕ Add Food"}
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        resetFoodForm();
                        setActiveTab(
                          "food"
                        );
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        {/* ================================================= */}
        {/* ORDERS */}
        {/* ================================================= */}

        {activeTab ===
          "orders" && (
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                  <div>
                    <h4 className="fw-bold">
                      📦 All Orders
                    </h4>

                    <small className="text-muted">
                      Manage all canteen orders.
                    </small>
                  </div>

                  <button
                    className="btn btn-outline-primary"
                    onClick={
                      fetchOrders
                    }
                    disabled={
                      orderLoading
                    }
                  >
                    🔄 Refresh Orders
                  </button>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-8">
                    <input
                      className="form-control"
                      placeholder="🔎 Search Order ID, Token, Student..."
                      value={
                        orderSearch
                      }
                      onChange={(e) =>
                        setOrderSearch(
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div className="col-md-4">
                    <select
                      className="form-select"
                      value={
                        orderStatusFilter
                      }
                      onChange={(e) =>
                        setOrderStatusFilter(
                          e.target.value
                        )
                      }
                    >
                      <option value="All">
                        All Orders
                      </option>

                      {ORDER_STATUSES.map(
                        (status) => (
                          <option
                            value={
                              status
                            }
                            key={
                              status
                            }
                          >
                            {getStatusIcon(
                              status
                            )}{" "}
                            {status}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {orderLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" />

                    <p className="text-muted mt-3">
                      Loading orders...
                    </p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>
                            Token
                          </th>
                          <th>
                            Order ID
                          </th>
                          <th>
                            Student
                          </th>
                          <th>
                            Items
                          </th>
                          <th>
                            Total
                          </th>
                          <th>
                            Status
                          </th>
                          <th>
                            Update
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredOrders.map(
                          (order) => {
                            const studentName =
                              order.user?.name ||
                              order.studentName ||
                              "Unknown Student";

                            const studentEmail =
                              order.user?.email ||
                              order.studentEmail ||
                              "No email";

                            return (
                              <tr
                                key={
                                  order._id
                                }
                              >
                                <td>
                                  <strong className="text-primary fs-5">
                                    #
                                    {
                                      order.tokenNumber
                                    }
                                  </strong>
                                </td>

                                <td>
                                  <strong>
                                    {
                                      order.orderId
                                    }
                                  </strong>

                                  <br />

                                  <small className="text-muted">
                                    {formatDate(
                                      order.createdAt
                                    )}
                                  </small>
                                </td>

                                <td>
                                  <strong>
                                    {
                                      studentName
                                    }
                                  </strong>

                                  <br />

                                  <small className="text-muted">
                                    {
                                      studentEmail
                                    }
                                  </small>
                                </td>

                                <td>
                                  {order.items
                                    ?.map(
                                      (
                                        item
                                      ) =>
                                        `${item.name} × ${item.quantity}`
                                    )
                                    .join(
                                      ", "
                                    ) ||
                                    "No items"}
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
                                  <select
                                    className="form-select form-select-sm"
                                    value={
                                      order.status
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      updateOrderStatus(
                                        order._id,
                                        e.target.value
                                      )
                                    }
                                    disabled={
                                      order.status ===
                                      "Completed" ||
                                      order.status ===
                                      "Cancelled"
                                    }
                                  >
                                    {ORDER_STATUSES.map(
                                      (
                                        status
                                      ) => (
                                        <option
                                          value={
                                            status
                                          }
                                          key={
                                            status
                                          }
                                        >
                                          {
                                            status
                                          }
                                        </option>
                                      )
                                    )}
                                  </select>
                                </td>
                              </tr>
                            );
                          }
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
                                    fontSize: 50,
                                  }}
                                >
                                  📦
                                </div>

                                <h5>
                                  No orders found
                                </h5>

                                <p className="text-muted">
                                  Try changing your search or filter.
                                </p>
                              </td>
                            </tr>
                          )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

        {/* ================================================= */}
        {/* STAFF MANAGEMENT */}
        {/* ================================================= */}

        {activeTab ===
          "staff" && (
            <div>
              {/* CREATE STAFF */}

              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                  <div className="mb-4">
                    <h4 className="fw-bold mb-1">
                      👥 Staff Management
                    </h4>

                    <p className="text-muted mb-0">
                      Create and manage staff accounts from the admin panel.
                    </p>
                  </div>

                  <div className="alert alert-info">
                    🔐 Only the Admin can create staff accounts.
                    Staff registration is not available publicly.
                  </div>

                  <form
                    onSubmit={
                      handleCreateStaff
                    }
                  >
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-bold">
                          Staff Name
                        </label>

                        <input
                          type="text"
                          className="form-control"
                          name="name"
                          value={
                            staffForm.name
                          }
                          onChange={
                            handleStaffChange
                          }
                          placeholder="Enter staff full name"
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-bold">
                          Staff Email
                        </label>

                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={
                            staffForm.email
                          }
                          onChange={
                            handleStaffChange
                          }
                          placeholder="Enter staff email"
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-bold">
                          Department / Area
                        </label>

                        <select
                          className="form-select"
                          name="department"
                          value={
                            staffForm.department
                          }
                          onChange={
                            handleStaffChange
                          }
                          required
                        >
                          <option value="">
                            Select Department / Area
                          </option>

                          {STAFF_DEPARTMENTS.map(
                            (department) => (
                              <option
                                value={
                                  department
                                }
                                key={
                                  department
                                }
                              >
                                {
                                  department
                                }
                              </option>
                            )
                          )}
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-bold">
                          Password
                        </label>

                        <input
                          type="password"
                          className="form-control"
                          name="password"
                          value={
                            staffForm.password
                          }
                          onChange={
                            handleStaffChange
                          }
                          placeholder="Create staff password"
                          minLength="6"
                          required
                        />
                      </div>
                    </div>

                    <hr className="my-4" />

                    <div className="d-flex gap-2 flex-wrap">
                      <button
                        type="submit"
                        className="btn btn-primary px-4"
                        disabled={
                          staffCreating
                        }
                      >
                        {staffCreating
                          ? "Creating..."
                          : "👤 Create Staff Account"}
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={
                          resetStaffForm
                        }
                        disabled={
                          staffCreating
                        }
                      >
                        Clear
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* STAFF LIST */}

              <div className="card border-0 shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
                    <div>
                      <h5 className="fw-bold mb-1">
                        👨‍🍳 Existing Staff
                      </h5>

                      <small className="text-muted">
                        Staff accounts created by Admin.
                      </small>
                    </div>

                    <button
                      className="btn btn-outline-primary"
                      onClick={
                        fetchStaff
                      }
                      disabled={
                        staffLoading
                      }
                    >
                      🔄 Refresh Staff
                    </button>
                  </div>

                  {staffLoading ? (
                    <div className="text-center py-5">
                      <div className="spinner-border text-primary" />

                      <p className="text-muted mt-3">
                        Loading staff...
                      </p>
                    </div>
                  ) : staffList.length ===
                    0 ? (
                    <div className="text-center py-5">
                      <div
                        style={{
                          fontSize: 60,
                        }}
                      >
                        👥
                      </div>

                      <h5>
                        No staff accounts found
                      </h5>

                      <p className="text-muted">
                        Create the first staff account above.
                      </p>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle">
                        <thead className="table-light">
                          <tr>
                            <th>
                              #
                            </th>
                            <th>
                              Name
                            </th>
                            <th>
                              Email
                            </th>
                            <th>
                              Department
                            </th>
                            <th>
                              Role
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {staffList.map(
                            (
                              staff,
                              index
                            ) => (
                              <tr
                                key={
                                  staff._id
                                }
                              >
                                <td>
                                  {
                                    index +
                                    1
                                  }
                                </td>

                                <td>
                                  <strong>
                                    {
                                      staff.name
                                    }
                                  </strong>
                                </td>

                                <td>
                                  {
                                    staff.email
                                  }
                                </td>

                                <td>
                                  <span className="badge bg-light text-dark">
                                    {
                                      staff.department ||
                                      "N/A"
                                    }
                                  </span>
                                </td>

                                <td>
                                  <span className="badge bg-success">
                                    Staff
                                  </span>
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
            </div>
          )}
      </div>
    </div>
  );
};

export default AdminDashboard;