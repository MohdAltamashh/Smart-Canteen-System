import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useHistory } from "react-router-dom";



const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const SERVER_URL = API_URL.replace(/\/api\/?$/, "");

const STATUSES = ["Pending", "Preparing", "Ready", "Completed", "Cancelled"];

const STATUS = {

  Pending: ["⏳", "bg-warning text-dark"],

  Preparing: ["👨‍🍳", "bg-info text-dark"],

  Ready: ["🔔", "bg-success"],

  Completed: ["✅", "bg-primary"],

  Cancelled: ["❌", "bg-danger"],

};

const EMPTY_FORM = {

  name: "", description: "", price: "", category: "Snacks",

  isAvailable: true, image: null,

};

const token = () => localStorage.getItem("token");

const studentName = (o) => o.studentName || o.user?.name || "Unknown Student";

const studentEmail = (o) => o.studentEmail || o.user?.email || "No email";

const dateText = (d) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "N/A";

const imageUrl = (url) => !url ? "" : /^https?:\/\//i.test(url) ? url : `${SERVER_URL}${url.startsWith("/") ? "" : "/"}${url}`;



export default function StaffDashboard() {

  const history = useHistory();

  const [orders, setOrders] = useState([]);

  const [foods, setFoods] = useState([]);

  const [staff, setStaff] = useState(null);

  const [courtId, setCourtId] = useState("");

  const [courtName, setCourtName] = useState("");

  const [loadingOrders, setLoadingOrders] = useState(true);

  const [loadingFoods, setLoadingFoods] = useState(true);

  const [error, setError] = useState("");

  const [foodError, setFoodError] = useState("");

  const [notice, setNotice] = useState("");

  const [tab, setTab] = useState("orders");

  const [section, setSection] = useState("active");

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [foodSearch, setFoodSearch] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);

  const [editingId, setEditingId] = useState("");

  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [nextStatus, setNextStatus] = useState("");

  const [updatingId, setUpdatingId] = useState("");



  const headers = useCallback(() => {

    const t = token();

    return t ? { Authorization: `Bearer ${t}` } : {};

  }, []);



  const fetchOrders = useCallback(async (silent = false) => {

    try {

      if (!silent) setLoadingOrders(true);

      setError("");

      if (!token()) { setError("Session nahi mila. Dobara login karein."); return; }

      const response = await fetch(`${API_URL}/orders/all`, { headers: headers() });

      const data = await response.json();

      if (!response.ok) { setError(data.message || "Orders load nahi hue."); return; }

      if (!Array.isArray(data)) { setError("Orders response ka format invalid hai."); return; }

      setOrders(data);

    } catch (e) {

      console.error(e);

      setError("Orders load karte waqt network/server error aaya.");

    } finally {

      if (!silent) setLoadingOrders(false);

    }

  }, [headers]);



  const fetchStaffFoods = useCallback(async (silent = false) => {

    try {

      if (!silent) setLoadingFoods(true);

      setFoodError("");

      if (!token()) { setFoodError("Session nahi mila. Dobara login karein."); return; }



      const profileRes = await fetch(`${API_URL}/auth/profile`, { headers: headers() });

      const profileData = await profileRes.json();

      if (!profileRes.ok) { setFoodError(profileData.message || "Staff profile load nahi hua."); return; }

      const profile = profileData.user || profileData;

      setStaff(profile);



      const assignedId = typeof profile.foodCourt === "object" ? profile.foodCourt?._id : profile.foodCourt;

      if (!assignedId) {

        setCourtId(""); setCourtName(""); setFoods([]);

        setFoodError("Aapke account ko Food Court assign nahi hua. Admin se assign karwayein.");

        return;

      }

      setCourtId(String(assignedId));



      let name = typeof profile.foodCourt === "object" ? profile.foodCourt?.name : "";

      if (!name) {

        const courtsRes = await fetch(`${API_URL}/auth/public/food-courts`);

        if (courtsRes.ok) {

          const courts = await courtsRes.json();

          name = Array.isArray(courts) ? courts.find(c => String(c._id) === String(assignedId))?.name : "";

        }

      }

      setCourtName(name || "Assigned Food Court");



      const foodRes = await fetch(`${API_URL}/food?foodCourt=${encodeURIComponent(assignedId)}`, { headers: headers() });

      const foodData = await foodRes.json();

      if (!foodRes.ok) { setFoodError(foodData.message || "Menu load nahi hua."); return; }

      setFoods(Array.isArray(foodData) ? foodData : []);

    } catch (e) {

      console.error(e);

      setFoodError("Staff profile/menu load karte waqt error aaya.");

    } finally {

      if (!silent) setLoadingFoods(false);

    }

  }, [headers]);



  useEffect(() => {

    fetchOrders();

    fetchStaffFoods();

    const timer = setInterval(() => fetchOrders(true), 5000);

    return () => clearInterval(timer);

  }, [fetchOrders, fetchStaffFoods]);



  const liveQueue = useMemo(() => orders.filter(o => ["Pending", "Preparing"].includes(o.status)).sort((a,b) => Number(a.tokenNumber || 0) - Number(b.tokenNumber || 0)), [orders]);

  const serving = liveQueue.find(o => o.status === "Preparing");

  const next = liveQueue.find(o => o.status === "Pending");

  const activeOrders = useMemo(() => orders.filter(o => !["Completed","Cancelled"].includes(o.status)), [orders]);

  const completedOrders = useMemo(() => orders.filter(o => o.status === "Completed"), [orders]);

  const cancelledOrders = useMemo(() => orders.filter(o => o.status === "Cancelled"), [orders]);

  const sectionOrders = section === "completed" ? completedOrders : section === "cancelled" ? cancelledOrders : activeOrders;

  const filteredOrders = useMemo(() => {

    const q = search.toLowerCase().trim();

    return sectionOrders.filter(o => {

      const matches = !q || String(o.orderId || "").toLowerCase().includes(q) ||

        String(o.tokenNumber || "").includes(q) || studentName(o).toLowerCase().includes(q) ||

        studentEmail(o).toLowerCase().includes(q);

      return matches && (statusFilter === "All" || o.status === statusFilter);

    });

  }, [sectionOrders, search, statusFilter]);
  
  const sales = orders.filter(o => o.status !== "Cancelled").reduce((sum,o) => sum + Number(o.totalAmount || 0), 0);

  const visibleFoods = foods.filter(f => `${f.name || ""} ${f.category || ""}`.toLowerCase().includes(foodSearch.toLowerCase().trim()));



  const updateStatus = async (orderId, status) => {

    try {

      setUpdatingId(orderId);

      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {

        method: "PUT", headers: { ...headers(), "Content-Type": "application/json" },

        body: JSON.stringify({ status }),

      });

      const data = await response.json();

      if (!response.ok) { window.alert(data.message || "Status update nahi hua."); return; }

      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));

      setSelectedOrder(prev => prev?._id === orderId ? { ...prev, status } : prev);

      setNextStatus("");

      setNotice(`Order status ${status} kar diya gaya.`);

      setTimeout(() => setNotice(""), 3500);

      fetchOrders(true);

    } catch (e) { console.error(e); window.alert("Status update karte waqt error aaya."); }

    finally { setUpdatingId(""); }

  };



  const resetForm = () => { setForm(EMPTY_FORM); setEditingId(""); };

  const onFormChange = (e) => {

    const { name, value, checked, type, files } = e.target;

    if (name === "image") { setForm(p => ({ ...p, image: files?.[0] || null })); return; }

    setForm(p => ({ ...p, [name]: type === "checkbox" ? checked : value }));

  };



  const saveFood = async (e) => {

    e.preventDefault();

    if (!courtId) { setFoodError("Food Court assign hone ke baad hi food add kar sakte hain."); return; }

    if (!form.name.trim() || form.price === "" || !Number.isFinite(Number(form.price)) || Number(form.price) < 0) {

      setFoodError("Food name aur valid price enter karein."); return;

    }

    try {

      setSaving(true); setFoodError(""); setNotice("");

      const body = new FormData();

      body.append("name", form.name.trim());

      body.append("description", form.description);

      body.append("price", String(form.price));

      body.append("category", form.category);

      body.append("isAvailable", String(form.isAvailable));

      body.append("foodCourt", courtId);

      if (form.image) body.append("image", form.image);

      const response = await fetch(editingId ? `${API_URL}/food/${editingId}` : `${API_URL}/food`, {

        method: editingId ? "PUT" : "POST", headers: headers(), body,

      });

      const data = await response.json();

      if (!response.ok) { setFoodError(data.message || "Food save nahi hua."); return; }

      setNotice(editingId ? "Food item update ho gaya." : "Food item add ho gaya.");

      resetForm();

      await fetchStaffFoods(true);

      setTimeout(() => setNotice(""), 3500);

    } catch (e) { console.error(e); setFoodError("Food save karte waqt network/server error aaya."); }

    finally { setSaving(false); }

  };



  const editFood = (food) => {

    setEditingId(food._id);

    setForm({

      name: food.name || "", description: food.description || "", price: food.price ?? "",

      category: food.category || "Snacks", isAvailable: food.isAvailable !== false, image: null,

    });

    setTab("foods");

    window.scrollTo({ top: 0, behavior: "smooth" });

  };



  const deleteFood = async (food) => {

    if (!window.confirm(`"${food.name}" ko menu se delete karna hai?`)) return;

    try {

      setDeletingId(food._id); setFoodError("");

      const response = await fetch(`${API_URL}/food/${food._id}`, { method: "DELETE", headers: headers() });

      const data = await response.json();

      if (!response.ok) { setFoodError(data.message || "Food delete nahi hua."); return; }

      setFoods(prev => prev.filter(f => f._id !== food._id));

      if (editingId === food._id) resetForm();

      setNotice("Food item delete ho gaya.");

      setTimeout(() => setNotice(""), 3500);

    } catch (e) { console.error(e); setFoodError("Food delete karte waqt error aaya."); }

    finally { setDeletingId(""); }

  };



  const toggleAvailability = async (food) => {

    try {

      const response = await fetch(`${API_URL}/food/${food._id}`, {

        method: "PUT", headers: { ...headers(), "Content-Type": "application/json" },

        body: JSON.stringify({ isAvailable: !food.isAvailable }),

      });

      const data = await response.json();

      if (!response.ok) { setFoodError(data.message || "Availability update nahi hui."); return; }

      const updated = data.foodItem || data;

      setFoods(prev => prev.map(f => f._id === food._id ? { ...f, ...updated, isAvailable: updated.isAvailable ?? !food.isAvailable } : f));

    } catch (e) { console.error(e); setFoodError("Availability update karte waqt error aaya."); }

  };



  const statusBadge = (status) => <span className={`badge ${STATUS[status]?.[1] || "bg-secondary"}`}>{STATUS[status]?.[0] || "📦"} {status}</span>;



  return (

        <div className="cb-staff-dashboard">
      <style>{`
        .cb-staff-dashboard { min-height:100vh; padding-bottom:28px; background:#101116; color:#f6f2eb; }
        .cb-staff-dashboard * { box-sizing:border-box; }
        .cb-staff-dashboard .cb-hero { background:radial-gradient(circle at 85% 0%,rgba(255,166,76,.14),transparent 32%),linear-gradient(135deg,#171920,#111319 72%); border-bottom:1px solid #292b33; color:#f7f2ea; padding:24px 0 25px; }
        .cb-staff-dashboard .cb-court-banner { background:linear-gradient(135deg,#242127,#1a1c23); border:1px solid #39313a; border-radius:16px; padding:16px 18px; }
        .cb-staff-dashboard .cb-eyebrow { color:#ffb56c; letter-spacing:.12em; font-size:11px; font-weight:800; }
        .cb-staff-dashboard .cb-panel { background:#191b22!important; color:#f6f2eb!important; border:1px solid #30323b!important; border-radius:16px!important; box-shadow:0 8px 26px rgba(0,0,0,.13)!important; overflow:hidden; }
        .cb-staff-dashboard .cb-panel .card-header { background:#1e2028!important; color:#f6f2eb!important; border-bottom:1px solid #30323b!important; }
        .cb-staff-dashboard .cb-stat { height:100%; padding:15px 10px; text-align:center; background:linear-gradient(145deg,#1d2028,#171920); border:1px solid #30323b; border-radius:14px; }
        .cb-staff-dashboard .cb-stat-number { color:#fff; font-size:26px; line-height:1.2; font-weight:800; margin:6px 0 3px; }
        .cb-staff-dashboard .cb-stat-label { color:#b8bac4; font-size:12px; }
        .cb-staff-dashboard .text-muted { color:#a9acb7!important; }
        .cb-staff-dashboard .text-success { color:#71d7a1!important; }
        .cb-staff-dashboard .form-control,.cb-staff-dashboard .form-select { min-height:44px; color:#f6f2eb!important; background:#22252e!important; border:1px solid #3a3d47!important; border-radius:11px!important; }
        .cb-staff-dashboard .form-control::placeholder { color:#9296a2!important; }
        .cb-staff-dashboard textarea.form-control { min-height:88px; }
        .cb-staff-dashboard .form-label,.cb-staff-dashboard .form-check-label { color:#e9e4dc; }
        .cb-staff-dashboard .btn { border-radius:11px; font-weight:650; }
        .cb-staff-dashboard .btn-primary,.cb-staff-dashboard .btn-warning { background:#ffad55!important; color:#21170c!important; border-color:#ffad55!important; }
        .cb-staff-dashboard .btn-primary:hover,.cb-staff-dashboard .btn-warning:hover { background:#ffc078!important; border-color:#ffc078!important; }
        .cb-staff-dashboard .btn-outline-primary { color:#ffb56c!important; border-color:#b77940!important; }
        .cb-staff-dashboard .btn-outline-primary:hover { background:#ffad55!important; color:#21170c!important; }
        .cb-staff-dashboard .btn-outline-secondary { color:#e7e1d8!important; border-color:#555965!important; }
        .cb-staff-dashboard .btn-outline-danger { color:#ff9999!important; border-color:#9d5559!important; }
        .cb-staff-dashboard .btn-secondary { background:#3a3d47!important; border-color:#3a3d47!important; }
        .cb-staff-dashboard .form-check-input { background-color:#353944; border-color:#686d79; }
        .cb-staff-dashboard .form-check-input:checked { background-color:#ffad55; border-color:#ffad55; }
        .cb-staff-dashboard .card-header.bg-white { background:#1e2028!important; color:#f6f2eb!important; }
        .cb-staff-dashboard .table { --bs-table-bg:transparent; --bs-table-color:#f5f2ec; --bs-table-border-color:#343741; --bs-table-hover-bg:#252832; --bs-table-hover-color:#fff; margin-bottom:0; }
        .cb-staff-dashboard .table-light,.cb-staff-dashboard .table-light th { background:#252832!important; color:#e9e4dc!important; border-color:#3a3d47!important; }
        .cb-staff-dashboard .table td,.cb-staff-dashboard .table th { padding:13px 12px; vertical-align:middle; }
        .cb-staff-dashboard .cb-tabs { position:sticky; top:0; z-index:25; display:flex; gap:9px; padding:10px 0; margin-bottom:16px; background:#101116; }
        .cb-staff-dashboard .cb-tabs .btn { min-height:45px; padding:10px 17px; }
        .cb-staff-dashboard .cb-section-tabs { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:9px; }
        .cb-staff-dashboard .cb-mobile-list { display:none; }
        .cb-staff-dashboard .cb-order-card { padding:14px; border:1px solid #333640; background:#1b1e25; border-radius:14px; }
        .cb-staff-dashboard .cb-order-card + .cb-order-card { margin-top:10px; }
        .cb-staff-dashboard .cb-label { color:#aeb2bd; font-size:10px; text-transform:uppercase; letter-spacing:.08em; margin-bottom:3px; }
        .cb-staff-dashboard .cb-value { color:#f7f4ef; font-weight:650; overflow-wrap:anywhere; }
        .cb-staff-dashboard .cb-food-card { background:#1c1f26!important; border:1px solid #343741!important; color:#f6f2eb!important; border-radius:14px!important; }
        .cb-staff-dashboard .cb-food-placeholder { height:120px; display:flex; align-items:center; justify-content:center; background:#252832; font-size:36px; }
        .cb-staff-dashboard .modal { z-index:1085; padding:10px; background:rgba(0,0,0,.72); overflow-y:auto; }
        .cb-staff-dashboard .modal-dialog { margin:12px auto; }
        .cb-staff-dashboard .modal-content { color:#f6f2eb; background:#191b22; border:1px solid #373943!important; border-radius:17px!important; }
        .cb-staff-dashboard .modal-header,.cb-staff-dashboard .modal-footer { border-color:#343741!important; }
        .cb-staff-dashboard .modal-body .cb-detail-box { background:#22252e; border:1px solid #343741; border-radius:12px; padding:12px; }
        .cb-staff-dashboard .modal-body .table-light { --bs-table-bg:#252832; }
        .cb-staff-dashboard .btn-close { filter:invert(1); }
        .cb-staff-dashboard .alert-success { background:#163626; color:#a9f1c8; border:1px solid #286444; }
        .cb-staff-dashboard .alert-danger { background:#3a2024; color:#ffc1c1; border:1px solid #713940; }
        @media(max-width:767.98px) {
          .cb-staff-dashboard { padding-bottom:14px; }
          .cb-staff-dashboard .cb-hero { padding:18px 0 20px; }
          .cb-staff-dashboard .cb-hero h1 { font-size:25px; }
          .cb-staff-dashboard .cb-hero .cb-hero-actions { width:100%; display:grid!important; grid-template-columns:1fr 1fr; }
          .cb-staff-dashboard .cb-hero .cb-hero-actions .btn { padding:10px 8px; font-size:12px; }
          .cb-staff-dashboard main.container { padding-top:12px!important; }
          .cb-staff-dashboard .cb-court-banner { padding:14px; }
          .cb-staff-dashboard .cb-court-banner h2 { font-size:20px; overflow-wrap:anywhere; }
          .cb-staff-dashboard .cb-tabs { margin:0 -12px 13px; padding:9px 12px; }
          .cb-staff-dashboard .cb-tabs .btn { flex:1; padding:10px 7px; font-size:12px; }
          .cb-staff-dashboard .cb-stat { padding:12px 7px; }
          .cb-staff-dashboard .cb-stat-number { font-size:22px; }
          .cb-staff-dashboard .cb-stat-label { font-size:11px; }
          .cb-staff-dashboard .cb-section-tabs { grid-template-columns:1fr; }
          .cb-staff-dashboard .cb-section-tabs .btn { display:flex; justify-content:space-between; align-items:center; padding:12px; text-align:left; }
          .cb-staff-dashboard .cb-orders-table { display:none!important; }
          .cb-staff-dashboard .cb-mobile-list { display:block; padding:12px; }
          .cb-staff-dashboard .cb-panel .card-body { padding:13px!important; }
          .cb-staff-dashboard .modal-dialog { margin:4px auto; }
          .cb-staff-dashboard .modal-body { padding:13px; }
          .cb-staff-dashboard .cb-status-grid { display:grid!important; grid-template-columns:1fr 1fr; gap:8px!important; }
          .cb-staff-dashboard .cb-status-grid .btn { min-height:42px; font-size:12px; padding:8px 5px; }
          .cb-staff-dashboard .cb-modal-actions { position:sticky; bottom:-13px; background:#191b22; padding:10px 0 2px; }
          .cb-staff-dashboard .cb-modal-items-table { font-size:12px; }
          .cb-staff-dashboard .cb-modal-items-table th,.cb-staff-dashboard .cb-modal-items-table td { padding:8px 6px; }

        .cb-staff-dashboard .table {
          --bs-table-bg: #171a21;
          --bs-table-color: #f4f1eb;
          --bs-table-border-color: #343844;
          --bs-table-hover-bg: #252a34;
          --bs-table-hover-color: #fff;
          color: #f4f1eb !important;
          background: #171a21 !important;
        }
        .cb-staff-dashboard .table > :not(caption) > * > * {
          background-color: #171a21 !important;
          color: #f4f1eb !important;
          border-bottom-color: #343844 !important;
          box-shadow: none !important;
        }
        .cb-staff-dashboard .table thead th {
          background: #222630 !important;
          color: #ffbd7a !important;
          white-space: nowrap;
        }
        .cb-staff-dashboard .table tbody tr:hover > * {
          background: #252a34 !important;
          color: #fff !important;
        }
        .cb-staff-dashboard .cb-order-card {
          background: #191c23 !important;
          border: 1px solid #343844 !important;
          border-radius: 14px !important;
          padding: 14px !important;
          color: #f4f1eb !important;
        }
        .cb-staff-dashboard .cb-quick-status {
          display:flex; flex-wrap:wrap; gap:8px; margin-top:12px;
        }
        .cb-staff-dashboard .cb-quick-status .btn {
          flex:1 1 125px; min-height:42px; font-weight:700;
        }
        .cb-staff-dashboard .cb-section-switch {
          display:flex; gap:8px; overflow-x:auto; padding-bottom:2px;
        }
        .cb-staff-dashboard .cb-section-switch .btn {
          flex:1 0 auto; min-height:42px; white-space:nowrap;
        }
        .cb-staff-dashboard .cb-compact-queue { display:none; }
        @media(max-width:767.98px) {
          .cb-staff-dashboard .cb-orders-table { display:none !important; }
          .cb-staff-dashboard .cb-mobile-list { display:block !important; padding:12px; }
          .cb-staff-dashboard .cb-compact-queue { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
          .cb-staff-dashboard .cb-compact-queue > div { padding:12px 5px !important; }
          .cb-staff-dashboard .cb-compact-queue .cb-stat-number { font-size:22px !important; }
          .cb-staff-dashboard .cb-section-switch .btn { padding:10px 12px !important; font-size:13px; }
          .cb-staff-dashboard .cb-hero { padding-top:18px !important; padding-bottom:18px !important; }
        }

          .cb-staff-dashboard .cb-food-card img { height:130px!important; }
        }
      `}</style>
      <style>{`
        /* Force table body cells to follow Campus Bite dark theme */
        .cb-staff-dashboard .table,
        .cb-staff-dashboard .table-responsive,
        .cb-staff-dashboard table.table,
        .cb-staff-dashboard .table tbody,
        .cb-staff-dashboard .table tbody tr,
        .cb-staff-dashboard .table tbody td,
        .cb-staff-dashboard .table thead,
        .cb-staff-dashboard .table thead tr,
        .cb-staff-dashboard .table thead th {
          background-color: #171a21 !important;
          color: #f4f1eb !important;
          border-color: #343844 !important;
          --bs-table-bg: #171a21 !important;
          --bs-table-color: #f4f1eb !important;
          --bs-table-accent-bg: #171a21 !important;
          box-shadow: none !important;
        }
        .cb-staff-dashboard .table thead th {
          background-color: #222630 !important;
          color: #ffbd7a !important;
        }
        .cb-staff-dashboard .table tbody tr:hover td {
          background-color: #252a34 !important;
          color: #fff !important;
        }
        .cb-staff-dashboard .cb-tabs { display:flex; flex-wrap:wrap; }
        .cb-staff-dashboard .cb-tabs .btn { flex:1 1 140px; }
        @media(max-width:767.98px) {
          .cb-staff-dashboard .cb-tabs { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:6px; }
          .cb-staff-dashboard .cb-tabs .btn { min-width:0; padding:10px 5px !important; font-size:11px !important; line-height:1.25; }
        }
      `}</style>
      <header className="cb-hero">

        <div className="container">

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">

            <div>

              <span className="badge rounded-pill mb-2 px-3 py-2" style={{background:"rgba(255,173,85,.12)",color:"#ffb56c",border:"1px solid rgba(255,173,85,.3)"}}>CAMPUS BITE · STAFF PORTAL</span>

              <h1 className="fw-bold mb-1">Staff Dashboard</h1>

              <p className="mb-0 opacity-75">Orders manage karein aur apne Food Court ka menu update karein.</p>

            </div>

            <div className="d-flex flex-wrap gap-2 cb-hero-actions">

              <button className="btn btn-warning fw-semibold" type="button" onClick={() => history.push("/token-display")}>🎟️ Token Display</button>

              <button className="btn btn-outline-primary fw-semibold" type="button" onClick={() => { fetchOrders(); fetchStaffFoods(); }}>🔄 Refresh</button>

            </div>

          </div>

          <div className="cb-court-banner mt-4">

            <div className="row align-items-center g-3">

              <div className="col-12 col-md-8">

                <small className="text-uppercase opacity-75">Assigned Food Court</small>

                <h2 className="fw-bold mb-1">🍽️ {courtName || (loadingFoods ? "Loading Food Court..." : "Food Court not assigned")}</h2>

                <div className="opacity-75">{staff?.name ? `Staff: ${staff.name}` : "Staff account"}{staff?.email ? ` · ${staff.email}` : ""}</div>

              </div>

              <div className="col-12 col-md-4 text-md-end">

                <span className="badge rounded-pill px-3 py-2 me-2" style={{background:"rgba(255,173,85,.12)",color:"#ffbd7a",border:"1px solid rgba(255,173,85,.25)"}}>{foods.length} Menu Items</span>

                <span className="badge rounded-pill px-3 py-2" style={{background:"rgba(255,173,85,.12)",color:"#ffbd7a",border:"1px solid rgba(255,173,85,.25)"}}>{liveQueue.length} Live Orders</span>

              </div>

            </div>

          </div>

        </div>

      </header>



      <main className="container py-4">

        {notice && <div className="alert alert-success border-0 shadow-sm">✅ {notice}</div>}

        <div className="cb-tabs">

          <button type="button" className={`btn ${tab==="orders"?"btn-primary":"btn-outline-primary"} px-4 py-2 fw-semibold`} onClick={() => setTab("orders")}>📋 Orders</button>

          <button type="button" className={`btn ${tab==="queue"?"btn-primary":"btn-outline-primary"} px-4 py-2 fw-semibold`} onClick={() => setTab("queue")}>🎟️ Token Queue</button>

          <button type="button" className={`btn ${tab==="foods"?"btn-primary":"btn-outline-primary"} px-4 py-2 fw-semibold`} onClick={() => setTab("foods")}>🍔 Food Management</button>

        </div>





        {tab === "queue" && <>
          <div className="card cb-panel border-0 shadow-sm mb-4" style={{borderRadius:18,overflow:"hidden"}}>

            <div className="card-header border-0 py-3" style={{background:"linear-gradient(135deg,#252127,#191b22)",borderBottom:"1px solid #343741"}}>

              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2"><div><h5 className="fw-bold mb-1">🔥 Live Token Queue</h5><small className="opacity-75">Auto-refresh har 5 seconds mein.</small></div><span className="badge bg-light text-success rounded-pill px-3 py-2">● LIVE</span></div>

            </div>

            <div className="card-body p-3 p-md-4">

              <div className="row g-3 mb-4">

                {[{label:"👨‍🍳 NOW SERVING",value:serving?`#${serving.tokenNumber}`:"--",bg:"#202b27",color:"text-success"},{label:"⏭️ NEXT TOKEN",value:next?`#${next.tokenNumber}`:"--",bg:"#30261b",color:"text-warning"},{label:"🎟️ ACTIVE QUEUE",value:liveQueue.length,bg:"#222630",color:"text-primary"}].map(x=><div className="col-12 col-md-4" key={x.label}><div className="p-3 text-center h-100" style={{background:x.bg,borderRadius:14}}><small className="text-muted fw-semibold">{x.label}</small><div className={`fw-bold ${x.color}`} style={{fontSize:32}}>{x.value}</div></div></div>)}

              </div>

              {liveQueue.length===0 ? <div className="text-center py-4 border rounded"><div style={{fontSize:38}}>🎉</div><h6 className="fw-bold mt-2">Queue is empty</h6><p className="text-muted mb-0 small">Abhi koi Pending ya Preparing order nahi hai.</p></div> :

                <><div className="table-responsive cb-orders-table"><table className="table table-hover align-middle mb-0"><thead className="table-light"><tr><th>Position</th><th>Token</th><th>Order</th><th>Student</th><th>Status</th><th>Action</th></tr></thead><tbody>

                  {liveQueue.map((o,i)=><tr key={o._id}><td>{i+1}</td><td className="fw-bold text-primary">#{o.tokenNumber}</td><td>{o.orderId}</td><td>{studentName(o)}</td><td>{statusBadge(o.status)}</td><td><button className="btn btn-sm btn-outline-primary" onClick={()=>{setSelectedOrder(o);setNextStatus("");}} type="button">Details</button></td></tr>)}

                </tbody></table></div>
                <div className="cb-mobile-list">
                  {liveQueue.map((o,i)=><div className="cb-order-card" key={o._id}>
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-3"><div><div className="cb-label">Queue position</div><div className="cb-value">#{i+1} · Token #{o.tokenNumber}</div></div>{statusBadge(o.status)}</div>
                    <div className="mb-3"><div className="cb-label">Order ID</div><div className="cb-value">{o.orderId}</div></div>
                    <div className="mb-3"><div className="cb-label">Student</div><div className="cb-value">{studentName(o)}</div></div>
                    <button className="btn btn-outline-primary w-100" onClick={()=>{setSelectedOrder(o);setNextStatus("");}} type="button">Order details / Update status →</button>
                  </div>)}
                </div></>}

            </div>

          </div>
        </>}

        {tab === "orders" && <>

          <div className="row g-3 mb-3">
            {[{label:"Active",count:activeOrders.length,icon:"🔥"},{label:"Completed",count:completedOrders.length,icon:"✅"},{label:"Cancelled",count:cancelledOrders.length,icon:"✕"}].map(x=><div className="col-4" key={x.label}><div className="cb-stat text-center"><div>{x.icon}</div><div className="cb-stat-number">{x.count}</div><div className="cb-stat-label">{x.label}</div></div></div>)}
            <div className="col-12"><div className="cb-stat d-flex align-items-center justify-content-between px-3"><span className="cb-stat-label">💰 Non-cancelled order value</span><strong style={{fontSize:20,color:"#71d7a1"}}>₹{sales.toFixed(2)}</strong></div></div>
          </div>



          <div className="card cb-panel border-0 shadow-sm mb-4" style={{borderRadius:16}}><div className="card-body"><div className="cb-section-switch">

            {[["active","🔥 Active",activeOrders.length],["completed","✅ Completed",completedOrders.length],["cancelled","❌ Cancelled",cancelledOrders.length]].map(([key,label,count])=><div key={key}><button className={`btn w-100 py-3 fw-semibold ${section===key?"btn-primary":"btn-outline-primary"}`} type="button" onClick={()=>{setSection(key);setSearch("");setStatusFilter("All");}}>{label} <span className="badge bg-light text-dark">{count}</span></button></div>)}

          </div></div></div>



          <div className="card cb-panel border-0 shadow-sm mb-4" style={{borderRadius:16}}><div className="card-body"><div className="row g-3">

            <div className="col-12 col-md-8"><input className="form-control" placeholder="Search Order ID, token, student name/email..." value={search} onChange={e=>setSearch(e.target.value)}/></div>

            <div className="col-12 col-md-4"><select className="form-select" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="All">All Statuses</option>{STATUSES.map(s=><option key={s} value={s}>{STATUS[s][0]} {s}</option>)}</select></div>

          </div></div></div>



          {error && <div className="alert alert-danger">{error}</div>}

          {loadingOrders ? <div className="text-center py-5"><div className="spinner-border text-primary"/><p className="text-muted mt-3">Loading orders...</p></div> :

            <div className="card cb-panel border-0 shadow-sm" style={{borderRadius:18,overflow:"hidden"}}><div className="card-header bg-white border-0 py-3"><h5 className="fw-bold mb-1">{section==="active"?"🔥 Active Orders":section==="completed"?"✅ Completed Orders":"❌ Cancelled Orders"}</h5><small className="text-muted">{filteredOrders.length} order(s)</small></div><div className="table-responsive cb-orders-table"><table className="table table-hover align-middle mb-0"><thead className="table-light"><tr><th>Token</th><th>Order / Date</th><th>Student</th><th>Items</th><th>Total</th><th>Status</th><th>Action</th></tr></thead><tbody>

              {filteredOrders.map(o=><tr key={o._id}><td className="fw-bold text-primary">#{o.tokenNumber}</td><td><strong>{o.orderId}</strong><small className="text-muted d-block">{dateText(o.createdAt)}</small></td><td><strong>{studentName(o)}</strong><small className="text-muted d-block">{studentEmail(o)}</small></td><td>{o.items?.length||0} item(s)<small className="text-muted d-block" style={{maxWidth:250}}>{o.items?.map(i=>`${i.name} × ${i.quantity}`).join(", ")}</small></td><td className="fw-bold text-success">₹{Number(o.totalAmount||0).toFixed(2)}</td><td>{statusBadge(o.status)}</td><td><div className="d-flex flex-column gap-2"><button className="btn btn-sm btn-outline-primary" type="button" onClick={()=>{setSelectedOrder(o);setNextStatus("");}}>Details</button>{o.status==="Pending" && <button type="button" className="btn btn-sm btn-primary" disabled={updatingId===o._id} onClick={()=>updateStatus(o._id,"Preparing")}>👨‍🍳 Start preparing</button>}
                    {o.status==="Preparing" && <button type="button" className="btn btn-sm btn-primary" disabled={updatingId===o._id} onClick={()=>updateStatus(o._id,"Ready")}>🔔 Mark ready</button>}
                    {o.status==="Ready" && <button type="button" className="btn btn-sm btn-primary" disabled={updatingId===o._id} onClick={()=>updateStatus(o._id,"Completed")}>✅ Complete</button>}
                    {["Completed","Cancelled"].includes(o.status) && <span className="small text-muted">No action needed</span>}</div></td></tr>)}

              {!filteredOrders.length&&<tr><td colSpan="7" className="text-center text-muted py-5">Is filter ke liye koi order nahi mila.</td></tr>}

            </tbody></table></div>
              <div className="cb-mobile-list">
                {filteredOrders.map(o=><div className="cb-order-card" key={o._id}>
                  <div className="d-flex justify-content-between align-items-start gap-2 mb-3"><div><div className="cb-label">Token</div><div className="cb-value" style={{color:"#ffb56c",fontSize:20}}>#{o.tokenNumber}</div></div>{statusBadge(o.status)}</div>
                  <div className="mb-3"><div className="cb-label">Order / Date</div><div className="cb-value">{o.orderId}</div><small className="text-muted">{dateText(o.createdAt)}</small></div>
                  <div className="row g-3 mb-3"><div className="col-7"><div className="cb-label">Student</div><div className="cb-value">{studentName(o)}</div><small className="text-muted">{studentEmail(o)}</small></div><div className="col-5 text-end"><div className="cb-label">Total</div><div className="cb-value" style={{color:"#71d7a1"}}>₹{Number(o.totalAmount||0).toFixed(2)}</div></div></div>
                  <div className="mb-3"><div className="cb-label">Items</div><div className="cb-value">{o.items?.map(i=>`${i.name} × ${i.quantity}`).join(", ")||"No item details"}</div></div>
                  <div className="cb-quick-status"><button className="btn btn-outline-primary" type="button" onClick={()=>{setSelectedOrder(o);setNextStatus("");}}>View details</button>{o.status==="Pending" && <button type="button" className="btn btn-sm btn-primary" disabled={updatingId===o._id} onClick={()=>updateStatus(o._id,"Preparing")}>👨‍🍳 Start preparing</button>}
                    {o.status==="Preparing" && <button type="button" className="btn btn-sm btn-primary" disabled={updatingId===o._id} onClick={()=>updateStatus(o._id,"Ready")}>🔔 Mark ready</button>}
                    {o.status==="Ready" && <button type="button" className="btn btn-sm btn-primary" disabled={updatingId===o._id} onClick={()=>updateStatus(o._id,"Completed")}>✅ Complete</button>}
                    {["Completed","Cancelled"].includes(o.status) && <span className="small text-muted">No action needed</span>}</div>
                </div>)}
                {!filteredOrders.length&&<div className="text-center text-muted py-4">Is filter ke liye koi order nahi mila.</div>}
              </div></div>}

        </>}



        {tab === "foods" && <>

          {foodError && <div className="alert alert-danger">{foodError}</div>}

          <div className="row g-4">

            <div className="col-12 col-lg-5"><div className="card cb-panel border-0 shadow-sm" style={{borderRadius:18}}><div className="card-header bg-white border-0 p-4"><h4 className="fw-bold mb-1">{editingId?"✏️ Edit Food Item":"➕ Add New Food"}</h4><p className="text-muted small mb-0">Food item {courtName||"aapke assigned Food Court"} ke menu mein add hoga.</p></div><div className="card-body px-4 pb-4">

              <form onSubmit={saveFood}>

                <div className="mb-3"><label className="form-label fw-semibold">Food Name *</label><input className="form-control" name="name" value={form.name} onChange={onFormChange} maxLength="100" required placeholder="e.g. Veg Burger"/></div>

                <div className="mb-3"><label className="form-label fw-semibold">Description</label><textarea className="form-control" name="description" rows="2" value={form.description} onChange={onFormChange} placeholder="Food description"/></div>

                <div className="row g-3"><div className="col-12 col-sm-6"><label className="form-label fw-semibold">Price (₹) *</label><input className="form-control" type="number" min="0" step="0.01" name="price" value={form.price} onChange={onFormChange} required/></div><div className="col-12 col-sm-6"><label className="form-label fw-semibold">Category</label><select className="form-select" name="category" value={form.category} onChange={onFormChange}>{["Snacks","Beverages","Meals","Fast Food","Desserts","Other"].map(c=><option key={c}>{c}</option>)}</select></div></div>

                <div className="my-3"><label className="form-label fw-semibold">Food Image {editingId?"(optional: select to replace)":"(optional)"}</label><input className="form-control" type="file" name="image" accept="image/jpeg,image/png,image/webp" onChange={onFormChange}/><small className="text-muted">JPG, PNG, WEBP · maximum 5 MB.</small></div>

                <div className="form-check form-switch mb-4"><input className="form-check-input" type="checkbox" role="switch" id="foodAvailable" name="isAvailable" checked={form.isAvailable} onChange={onFormChange}/><label className="form-check-label fw-semibold" htmlFor="foodAvailable">Available for ordering</label></div>

                <div className="d-flex flex-wrap gap-2"><button className="btn btn-primary fw-semibold" type="submit" disabled={saving||!courtId}>{saving?"Saving...":editingId?"💾 Save Changes":"➕ Add Food Item"}</button>{editingId&&<button className="btn btn-outline-secondary" type="button" onClick={resetForm}>Cancel Edit</button>}</div>

                {!courtId&&<small className="text-danger d-block mt-2">Admin se Food Court assign karwana zaroori hai.</small>}

              </form>

            </div></div></div>



            <div className="col-12 col-lg-7"><div className="card cb-panel border-0 shadow-sm" style={{borderRadius:18,overflow:"hidden"}}><div className="card-header bg-white border-0 p-4"><div className="d-flex justify-content-between align-items-center flex-wrap gap-2"><div><h4 className="fw-bold mb-1">🍽️ Your Menu</h4><p className="text-muted small mb-0">{courtName||"Assigned Food Court"} · {foods.length} items</p></div><button className="btn btn-outline-primary btn-sm" type="button" onClick={()=>fetchStaffFoods()}>🔄 Refresh Menu</button></div><input className="form-control mt-3" placeholder="Search food name/category..." value={foodSearch} onChange={e=>setFoodSearch(e.target.value)}/></div>

              {loadingFoods?<div className="text-center py-5"><div className="spinner-border text-primary"/><p className="text-muted mt-3">Loading menu...</p></div>:!visibleFoods.length?<div className="text-center text-muted py-5 px-3"><div style={{fontSize:42}}>🍽️</div><h5 className="fw-bold mt-2">No food items found</h5><p className="mb-0">Form se apne Food Court mein food item add karein.</p></div>:

                <div className="p-3"><div className="row g-3">{visibleFoods.map(f=><div className="col-12 col-md-6" key={f._id}><div className="card cb-food-card h-100 border" style={{borderRadius:14,overflow:"hidden"}}>

                  {f.imageUrl?<img src={imageUrl(f.imageUrl)} alt={f.name} style={{height:155,width:"100%",objectFit:"cover"}} onError={e=>{e.currentTarget.style.display="none";}}/>:<div className="cb-food-placeholder">🍔</div>}

                  <div className="card-body"><div className="d-flex justify-content-between align-items-start gap-2"><h6 className="fw-bold mb-1">{f.name}</h6><span className="fw-bold text-success text-nowrap">₹{Number(f.price||0).toFixed(2)}</span></div><small className="text-muted d-block mb-2">{f.category||"Other"}</small>{f.description&&<p className="small text-muted mb-3">{f.description}</p>}

                    <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap mb-3"><span className={`badge ${f.isAvailable===false?"bg-secondary":"bg-success"}`}>{f.isAvailable===false?"Unavailable":"Available"}</span><div className="form-check form-switch mb-0"><input className="form-check-input" type="checkbox" role="switch" id={`avail-${f._id}`} checked={f.isAvailable!==false} onChange={()=>toggleAvailability(f)}/><label className="form-check-label small" htmlFor={`avail-${f._id}`}>Available</label></div></div>

                    <div className="d-flex gap-2"><button type="button" className="btn btn-sm btn-outline-primary flex-fill" onClick={()=>editFood(f)}>✏️ Edit</button><button type="button" className="btn btn-sm btn-outline-danger flex-fill" disabled={deletingId===f._id} onClick={()=>deleteFood(f)}>{deletingId===f._id?"Deleting...":"🗑️ Delete"}</button></div>

                  </div></div></div>)}</div></div>}

            </div></div>

          </div>

        </>}

      </main>



      {selectedOrder && <div className="modal d-block" tabIndex="-1" role="dialog" style={{background:"rgba(0,0,0,.6)"}} onClick={e=>{if(e.target===e.currentTarget){setSelectedOrder(null);setNextStatus("");}}}>

        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable"><div className="modal-content border-0" style={{borderRadius:18,overflow:"hidden"}}>

          <div className="modal-header"><div><h5 className="modal-title fw-bold mb-1">📦 Order Details</h5><small className="text-muted">{selectedOrder.orderId}</small></div><button className="btn-close" type="button" aria-label="Close" onClick={()=>{setSelectedOrder(null);setNextStatus("");}}/></div>

          <div className="modal-body">

            <div className="row g-3 mb-4"><div className="col-12 col-md-6"><div className="cb-detail-box text-center"><small className="text-muted">TOKEN NUMBER</small><div className="fw-bold text-primary" style={{fontSize:36}}>#{selectedOrder.tokenNumber}</div></div></div><div className="col-12 col-md-6"><div className="cb-detail-box text-center"><small className="text-muted">CURRENT STATUS</small><div className="mt-2">{statusBadge(selectedOrder.status)}</div></div></div></div>

            <div className="cb-detail-box mb-4"><h6 className="fw-bold mb-3">👤 Student Details</h6><div className="row g-2"><div className="col-12 col-md-6"><small className="text-muted d-block">Name</small><strong>{studentName(selectedOrder)}</strong></div><div className="col-12 col-md-6"><small className="text-muted d-block">Email</small><strong>{studentEmail(selectedOrder)}</strong></div><div className="col-12"><small className="text-muted d-block">Placed At</small><strong>{dateText(selectedOrder.createdAt)}</strong></div></div></div>

            <h6 className="fw-bold mb-3">🍔 Ordered Items</h6><div className="table-responsive"><table className="table table-bordered align-middle cb-modal-items-table"><thead className="table-light"><tr><th>Item</th><th>Price</th><th>Qty</th><th>Subtotal</th></tr></thead><tbody>{selectedOrder.items?.map((item,i)=><tr key={item._id||i}><td>{item.name}</td><td>₹{Number(item.price||0).toFixed(2)}</td><td>{item.quantity}</td><td className="fw-bold text-success">₹{Number(item.subtotal??Number(item.price||0)*Number(item.quantity||0)).toFixed(2)}</td></tr>)}</tbody><tfoot><tr><td colSpan="3" className="text-end fw-bold">Total</td><td className="fw-bold text-success">₹{Number(selectedOrder.totalAmount||0).toFixed(2)}</td></tr></tfoot></table></div>

            {!["Completed","Cancelled"].includes(selectedOrder.status)&&<div className="mt-4"><h6 className="fw-bold mb-3">⚙️ Update Order Status</h6><div className="row g-2 align-items-end">
                <div className="col-12 col-sm-7"><label className="form-label small fw-semibold" htmlFor="nextOrderStatus">New status</label><select id="nextOrderStatus" className="form-select" value={nextStatus} onChange={e=>setNextStatus(e.target.value)} disabled={updatingId===selectedOrder._id}><option value="">Choose next status…</option>{STATUSES.filter(s=>s!==selectedOrder.status).map(s=><option key={s} value={s}>{STATUS[s][0]} {s}</option>)}</select></div>
                <div className="col-12 col-sm-5"><div className="small text-muted">Pehle status select karein, phir confirm karein.</div></div>
              </div>
              {nextStatus&&nextStatus!==selectedOrder.status&&<div className="mt-3 p-3 cb-detail-box"><p className="mb-3">Order status <strong>{selectedOrder.status}</strong> se <strong>{nextStatus}</strong> ho jayega. Confirm karein?</p><div className="d-flex gap-2 flex-wrap"><button type="button" className="btn btn-primary flex-fill" disabled={updatingId===selectedOrder._id} onClick={()=>updateStatus(selectedOrder._id,nextStatus)}>{updatingId===selectedOrder._id?"Updating…":"✓ Confirm Update"}</button><button type="button" className="btn btn-outline-secondary" onClick={()=>setNextStatus("")}>Cancel</button></div></div>}

            </div>}

          </div><div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={()=>{setSelectedOrder(null);setNextStatus("");}}>Close</button></div>

        </div></div>

      </div>}

    </div>

  );

}
