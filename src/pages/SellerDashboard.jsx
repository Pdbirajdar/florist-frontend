import React, { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const API_URL = "http://localhost:8090/api";

function SellerDashboard() {
  const [seller, setSeller] = useState(null);
  const [flowers, setFlowers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [revenueAnalytics, setRevenueAnalytics] = useState(null);
  const [analyticsError, setAnalyticsError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [updatingBookingId, setUpdatingBookingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [stockInputs, setStockInputs] = useState({});
  const [stockUpdatingId, setStockUpdatingId] = useState(null);
  const [inventoryMessage, setInventoryMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    category: "",
    description: "",
    rentalPrice: "",
    availableQuantity: "",
    imageUrl: "",
  });

  const token = localStorage.getItem("token");

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // The current API returns total and current-month revenue totals.
  // This chart compares those two values; it is not a multi-month trend.
  const revenueChartData = [
    { name: "Total Revenue", amount: Number(revenueAnalytics?.totalRevenue ?? 0) },
    { name: "Monthly Revenue", amount: Number(revenueAnalytics?.monthlyRevenue ?? 0) },
  ];

  // Fetch seller profile and flowers
  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const [sellerResponse, flowerResponse, bookingResponse, analyticsResponse] = await Promise.all([
        fetch(`${API_URL}/seller/dashboard`, { headers }),
        fetch(`${API_URL}/flowers/seller/my-flowers`, { headers }),
        fetch(`${API_URL}/bookings/seller`, { headers }),
        fetch(`${API_URL}/bookings/seller/analytics/revenue`, { headers }),
      ]);

      if (sellerResponse.status === 401 || flowerResponse.status === 401) {
        throw new Error("Session expired. Please login again.");
      }

      if (!sellerResponse.ok) {
        throw new Error("Unable to load seller profile.");
      }

      if (!flowerResponse.ok) {
        throw new Error("Unable to load your flowers.");
      }
      if (!bookingResponse.ok) {
        throw new Error("Unable to load your bookings.");
      }
      if (!analyticsResponse.ok) {
        throw new Error("Unable to load revenue analytics.");
      }

      const sellerData = await sellerResponse.json();
      const flowerData = await flowerResponse.json();
      const bookingData = await bookingResponse.json();
      const analyticsData = await analyticsResponse.json();

      setSeller(sellerData);
      setFlowers(flowerData);
      setBookings(bookingData);
      setRevenueAnalytics(analyticsData);
      setAnalyticsError("");
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh seller bookings
  const loadBookings = async () => {
    try {
      setBookingLoading(true);
      setBookingError("");
      const response = await fetch(`${API_URL}/bookings/seller`, { headers });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Unable to load bookings.");
      }
      setBookings(await response.json());
    } catch (err) {
      setBookingError(err.message || "Unable to load bookings.");
    } finally {
      setBookingLoading(false);
    }
  };

  // Update booking status
  const handleBookingStatus = async (bookingId, status) => {
    const action = status.toLowerCase();
    if (!window.confirm(`Are you sure you want to ${action} booking #${bookingId}?`)) return;

    try {
      setUpdatingBookingId(bookingId);
      setBookingError("");
      const response = await fetch(
        `${API_URL}/bookings/seller/${bookingId}/status?status=${status}`,
        { method: "PATCH", headers }
      );
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Unable to update booking status.");
      }
      const updated = await response.json();
      setBookings((previous) => previous.map((booking) =>
        booking.id === bookingId ? updated : booking
      ));
    } catch (err) {
      setBookingError(err.message || "Unable to update booking status.");
    } finally {
      setUpdatingBookingId(null);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");
    window.location.href = "/login";
  };

  // Handle form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open add form
  const openAddForm = () => {
    setEditingId(null);

    setForm({
      name: "",
      category: "",
      description: "",
      rentalPrice: "",
      availableQuantity: "",
      imageUrl: "",
    });

    setMessage("");
    setShowForm(true);
  };

  // Open edit form
  const openEditForm = (flower) => {
    setEditingId(flower.id);

    setForm({
      name: flower.name || "",
      category: flower.category || "",
      description: flower.description || "",
      rentalPrice: flower.rentalPrice ?? "",
      availableQuantity: flower.availableQuantity ?? "",
      imageUrl: flower.imageUrl || "",
    });

    setMessage("");
    setShowForm(true);
  };

  // Add or update flower
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.category.trim() ||
      form.rentalPrice === "" ||
      form.availableQuantity === ""
    ) {
      setMessage("Please fill in all required fields.");
      return;
    }

    if (
      Number(form.rentalPrice) < 0 ||
      Number(form.availableQuantity) < 0 ||
      !Number.isFinite(Number(form.rentalPrice)) ||
      !Number.isInteger(Number(form.availableQuantity))
    ) {
      setMessage("Enter a valid price and whole-number quantity.");
      return;
    }

    const flowerData = {
      ...form,
      name: form.name.trim(),
      category: form.category.trim(),
      rentalPrice: Number(form.rentalPrice),
      availableQuantity: Number(form.availableQuantity),
    };

    try {
      setSaving(true);
      setMessage("");

      const url = editingId
        ? `${API_URL}/flowers/seller/${editingId}`
        : `${API_URL}/flowers/seller`;

      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(flowerData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Unable to save flower.");
      }

      setShowForm(false);
      setEditingId(null);

      setForm({
        name: "",
        category: "",
        description: "",
        rentalPrice: "",
        availableQuantity: "",
        imageUrl: "",
      });

      setMessage(
        editingId
          ? "Flower updated successfully!"
          : "Flower added successfully!"
      );

      await loadFlowers();
    } catch (err) {
      setMessage(err.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  // Refresh seller flowers
  const loadFlowers = async () => {
    const response = await fetch(
      `${API_URL}/flowers/seller/my-flowers`,
      { headers }
    );

    if (!response.ok) {
      throw new Error("Unable to refresh flowers.");
    }

    const data = await response.json();
    setFlowers(data);
  };

  // Update stock quantity using the inventory API
  const handleStockUpdate = async (flower) => {
    const rawQuantity = stockInputs[flower.id] ?? flower.availableQuantity ?? "";
    const quantity = Number(rawQuantity);

    if (!Number.isInteger(quantity) || quantity < 0) {
      setInventoryMessage("Enter a valid whole-number quantity (0 or more).");
      return;
    }

    try {
      setStockUpdatingId(flower.id);
      setInventoryMessage("");

      const response = await fetch(
        `${API_URL}/flowers/seller/${flower.id}/quantity?quantity=${quantity}`,
        { method: "PATCH", headers }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Unable to update stock quantity.");
      }

      const updatedFlower = await response.json();

      setFlowers((previous) =>
        previous.map((item) => item.id === flower.id ? updatedFlower : item)
      );
      setStockInputs((previous) => ({
        ...previous,
        [flower.id]: String(updatedFlower.availableQuantity ?? quantity),
      }));
      setInventoryMessage(`Stock updated for ${flower.name}.`);
    } catch (err) {
      setInventoryMessage(err.message || "Unable to update stock quantity.");
    } finally {
      setStockUpdatingId(null);
    }
  };

  // Delete flower
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this flower?"
    );

    if (!confirmed) return;

    try {
      setMessage("");

      const response = await fetch(
        `${API_URL}/flowers/seller/${id}`,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!response.ok) {
        throw new Error("Unable to delete flower.");
      }

      setMessage("Flower deleted successfully!");
      await loadFlowers();
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (loading) {
    return (
      <div className="seller-loading">
        <h2>🌸 Loading Your Dashboard...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="seller-loading">
        <h2>Unable to Load Dashboard</h2>
        <p>{error}</p>
        <button onClick={handleLogout}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="seller-dashboard">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .seller-dashboard {
          min-height: 100vh;
          padding: 30px 5%;
          background: #f7f5fb;
          font-family: "Segoe UI", Arial, sans-serif;
          color: #30243a;
        }

        .dashboard-wrapper {
          max-width: 1400px;
          margin: auto;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 30px;
          flex-wrap: wrap;
        }

        .brand-title {
          font-size: 32px;
          color: #72245e;
          margin: 0;
        }

        .brand-subtitle {
          color: #82758b;
          margin-top: 8px;
        }

        .logout-button {
          background: white;
          color: #d83d61;
          border: 1px solid #f2c9d4;
          padding: 12px 24px;
          border-radius: 10px;
          cursor: pointer;
        }

        .welcome-banner {
          background: linear-gradient(120deg, #7d286c, #d17aa8);
          border-radius: 20px;
          padding: 35px;
          color: white;
          margin-bottom: 30px;
        }

        .welcome-banner h2 {
          font-size: 30px;
          margin: 0 0 12px;
        }

        .profile-card,
        .flower-card {
          background: white;
          border: 1px solid #eee7f3;
          border-radius: 18px;
          padding: 24px;
          margin-bottom: 25px;
          box-shadow: 0 5px 20px rgba(50, 30, 70, 0.04);
        }

        .profile-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-top: 20px;
        }

        .detail-item {
          background: #faf8fc;
          padding: 16px;
          border-radius: 12px;
          overflow-wrap: anywhere;
        }

        .detail-label {
          color: #82758b;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .detail-value {
          font-weight: 700;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          flex-wrap: wrap;
          margin: 35px 0 20px;
        }

        .section-header h2 {
          color: #72245e;
          margin: 0;
        }

        .primary-button {
          background: #84286e;
          color: white;
          border: none;
          padding: 12px 22px;
          border-radius: 10px;
          cursor: pointer;
          font-weight: 600;
        }

        .primary-button:hover {
          background: #6e205c;
        }

        .revenue-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin: 20px 0 25px;
        }
        .revenue-stat {
          background: white;
          border: 1px solid #eee7f3;
          border-radius: 16px;
          padding: 22px;
          box-shadow: 0 5px 20px rgba(50, 30, 70, 0.04);
        }
        .revenue-stat-label { color: #82758b; font-size: 13px; margin-bottom: 10px; }
        .revenue-stat-value { color: #72245e; font-size: 27px; font-weight: 800; overflow-wrap: anywhere; }
        .revenue-recent {
          background: white; border: 1px solid #eee7f3; border-radius: 16px;
          padding: 22px; margin-bottom: 25px; overflow-x: auto;
        }
        .revenue-table { width: 100%; border-collapse: collapse; min-width: 580px; }
        .revenue-table th, .revenue-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee7f3; }
        .revenue-table th { color: #72245e; background: #faf8fc; }
        .booking-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        .booking-card {
          background: white;
          border: 1px solid #eee7f3;
          border-radius: 16px;
          padding: 22px;
          box-shadow: 0 5px 20px rgba(50, 30, 70, 0.04);
        }

        .booking-card h3 { color: #72245e; margin: 0 0 12px; }
        .booking-info { color: #65586d; line-height: 1.8; overflow-wrap: anywhere; }
        .booking-status { display: inline-block; margin: 12px 0; padding: 6px 12px; border-radius: 20px; background: #f2e8fa; color: #72245e; font-size: 13px; font-weight: 700; }
        .booking-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
        .booking-action { border: 0; border-radius: 8px; padding: 10px 14px; cursor: pointer; font-weight: 600; }
        .confirm-booking { background: #e4f5e8; color: #287b45; }
        .cancel-booking { background: #fde8ed; color: #c62850; }
        .complete-booking { background: #e7edff; color: #344f9a; }
        .booking-action:disabled { opacity: .6; cursor: not-allowed; }

        .inventory-summary {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin: 20px 0 25px;
        }

        .inventory-stat {
          background: white;
          border: 1px solid #eee7f3;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 5px 20px rgba(50, 30, 70, 0.04);
        }

        .inventory-stat-label {
          color: #82758b;
          font-size: 13px;
          margin-bottom: 8px;
        }

        .inventory-stat-value {
          color: #72245e;
          font-size: 28px;
          font-weight: 800;
        }

        .stock-badge {
          display: inline-block;
          margin-top: 12px;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 700;
        }

        .stock-in { background: #e4f5e8; color: #287b45; }
        .stock-low { background: #fff3d6; color: #986400; }
        .stock-out { background: #fde8ed; color: #c62850; }

        .stock-control {
          display: flex;
          gap: 8px;
          margin-top: 14px;
          align-items: center;
        }

        .stock-control input {
          width: 100%;
          min-width: 0;
          padding: 10px;
          border: 1px solid #ddd3e4;
          border-radius: 8px;
        }

        .stock-update-button {
          white-space: nowrap;
          padding: 10px 12px;
          border: 0;
          border-radius: 8px;
          background: #84286e;
          color: white;
          font-weight: 600;
          cursor: pointer;
        }

        .stock-update-button:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .flowers-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .flower-card {
          padding: 0;
          overflow: hidden;
          margin: 0;
        }

        .flower-image {
          width: 100%;
          height: 210px;
          object-fit: cover;
          background: #f4e7f0;
        }

        .flower-image-placeholder {
          height: 210px;
          display: flex;
          justify-content: center;
          align-items: center;
          background: #f4e7f0;
          font-size: 65px;
        }

        .flower-content {
          padding: 20px;
        }

        .flower-content h3 {
          margin: 0 0 10px;
          color: #72245e;
        }

        .flower-category {
          color: #82758b;
          font-size: 14px;
        }

        .flower-price {
          font-size: 20px;
          font-weight: 700;
          margin: 15px 0 8px;
        }

        .flower-quantity {
          color: #6c6075;
          font-size: 14px;
        }

        .flower-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .edit-button,
        .delete-button {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .edit-button {
          background: #eee6ff;
          color: #62378d;
        }

        .delete-button {
          background: #fde8ed;
          color: #c62850;
        }

        .empty-state {
          background: white;
          padding: 40px 20px;
          text-align: center;
          border-radius: 18px;
          color: #82758b;
        }

        .form-overlay {
          position: fixed;
          inset: 0;
          background: rgba(25, 15, 30, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          z-index: 1000;
          overflow-y: auto;
        }

        .flower-form {
          width: 100%;
          max-width: 550px;
          max-height: 90vh;
          overflow-y: auto;
          background: white;
          border-radius: 18px;
          padding: 28px;
        }

        .flower-form h2 {
          color: #72245e;
          margin-top: 0;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-weight: 600;
          margin-bottom: 7px;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd3e4;
          border-radius: 9px;
          font-size: 15px;
        }

        .form-group textarea {
          min-height: 90px;
          resize: vertical;
        }

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .cancel-button {
          flex: 1;
          padding: 12px;
          border: 1px solid #ddd3e4;
          border-radius: 9px;
          background: white;
          cursor: pointer;
        }

        .save-button {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 9px;
          background: #84286e;
          color: white;
          cursor: pointer;
        }

        .status-message {
          background: #e8f7ec;
          color: #287b45;
          padding: 12px 16px;
          border-radius: 10px;
          margin: 15px 0;
        }

        .seller-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          font-family: "Segoe UI", Arial, sans-serif;
          background: #f7f5fb;
          text-align: center;
          padding: 20px;
        }

        @media (max-width: 900px) {
          .booking-list { grid-template-columns: 1fr; }
          .revenue-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .inventory-summary { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .flowers-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 600px) {
          .seller-dashboard {
            padding: 20px 15px;
          }

          .flowers-grid {
            grid-template-columns: 1fr;
          }

          .revenue-summary { grid-template-columns: 1fr 1fr; }

          .profile-details {
            grid-template-columns: 1fr;
          }

          .inventory-summary {
            grid-template-columns: 1fr 1fr;
          }

          .welcome-banner {
            padding: 25px;
          }

          .welcome-banner h2 {
            font-size: 24px;
          }

          .flower-form {
            padding: 20px;
          }
        }
      `}</style>

      <div className="dashboard-wrapper">
        {/* Header */}
        <header className="dashboard-header">
          <div>
            <h1 className="brand-title">🌸 Florist Dashboard</h1>
            <p className="brand-subtitle">
              Manage your flowers, inventory, and bookings.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              className="primary-button"
              type="button"
              onClick={() => setShowProfile((prev) => !prev)}
            >
              {showProfile ? "Hide Profile" : "👤 Profile"}
            </button>

            <button className="logout-button" onClick={handleLogout}>
              ↪ Logout
            </button>
          </div>
        </header>

        {/* Welcome */}
        <section className="welcome-banner">
          <h2>Welcome, {seller?.name || "Seller"}! 👋</h2>
          <p>Manage your florist rental business from one place.</p>
        </section>

        {/* Revenue Analytics */}
        <section>
          <div className="section-header">
            <h2>💰 Revenue Analytics</h2>
            <button className="primary-button" type="button" onClick={loadDashboard} disabled={loading}>
              {loading ? "Refreshing..." : "↻ Refresh Analytics"}
            </button>
          </div>
          {analyticsError && <div className="status-message" style={{ background: "#fde8ed", color: "#a51d40" }}>{analyticsError}</div>}
          <div className="revenue-summary">
            <div className="revenue-stat"><div className="revenue-stat-label">Total Revenue</div><div className="revenue-stat-value">₹{Number(revenueAnalytics?.totalRevenue ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div>
            <div className="revenue-stat"><div className="revenue-stat-label">Monthly Revenue</div><div className="revenue-stat-value">₹{Number(revenueAnalytics?.monthlyRevenue ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div>
            <div className="revenue-stat"><div className="revenue-stat-label">Total Bookings</div><div className="revenue-stat-value">{revenueAnalytics?.totalBookings ?? 0}</div></div>
            <div className="revenue-stat"><div className="revenue-stat-label">Completed Bookings</div><div className="revenue-stat-value">{revenueAnalytics?.completedBookings ?? 0}</div></div>
            <div className="revenue-stat"><div className="revenue-stat-label">Pending Bookings</div><div className="revenue-stat-value">{revenueAnalytics?.pendingBookings ?? 0}</div></div>
            <div className="revenue-stat"><div className="revenue-stat-label">Confirmed Bookings</div><div className="revenue-stat-value">{revenueAnalytics?.confirmedBookings ?? 0}</div></div>
          </div>

          <div className="revenue-recent">
            <h3 style={{ color: "#72245e", marginTop: 0 }}>📊 Revenue Overview</h3>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueChartData} margin={{ top: 15, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => `₹${Number(value).toLocaleString("en-IN")}`} />
                  <Tooltip
                    formatter={(value) => [
                      `₹${Number(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      "Revenue",
                    ]}
                  />
                  <Bar dataKey="amount" name="Revenue" fill="#84286e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="revenue-recent">
            <h3 style={{ color: "#72245e", marginTop: 0 }}>Recent Revenue Bookings</h3>
            {Array.isArray(revenueAnalytics?.recentBookings) && revenueAnalytics.recentBookings.length > 0 ? (
              <table className="revenue-table">
                <thead><tr><th>Booking ID</th><th>Flower</th><th>Customer</th><th>Status</th><th>Amount</th></tr></thead>
                <tbody>{revenueAnalytics.recentBookings.map((item, index) => (
                  <tr key={item.id ?? index}>
                    <td>#{item.id ?? "—"}</td>
                    <td>{item.flowerName ?? "—"}</td>
                    <td>{item.customerName ?? "—"}</td>
                    <td>{item.status ?? "—"}</td>
                    <td>₹{Number(item.totalPrice ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}</tbody>
              </table>
            ) : <p className="empty-state">No recent bookings available.</p>}
          </div>
        </section>

        {/* Seller Profile - shown when Profile button is clicked */}
        {showProfile && (
          <section className="profile-card">
          <h2>Seller Profile</h2>

          <div className="profile-details">
            <div className="detail-item">
              <div className="detail-label">Seller ID</div>
              <div className="detail-value">#{seller?.id ?? "N/A"}</div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Name</div>
              <div className="detail-value">{seller?.name || "N/A"}</div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Email</div>
              <div className="detail-value">{seller?.email || "N/A"}</div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Role</div>
              <div className="detail-value">{seller?.role || "SELLER"}</div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Account Status</div>
              <div className="detail-value">
                {seller?.sellerStatus || "UNKNOWN"}
              </div>
            </div>

            <div className="detail-item">
              <div className="detail-label">Registered On</div>
              <div className="detail-value">
                {seller?.createdAt
                  ? new Date(seller.createdAt).toLocaleDateString("en-IN")
                  : "N/A"}
              </div>
            </div>
          </div>
          </section>
        )}

        {/* Seller Booking Management */}
        <section>
          <div className="section-header">
            <h2>📋 Customer Bookings</h2>
            <button className="primary-button" onClick={loadBookings} disabled={bookingLoading}>
              {bookingLoading ? "Refreshing..." : "↻ Refresh Bookings"}
            </button>
          </div>

          {bookingError && <div className="status-message" style={{ background: "#fde8ed", color: "#a51d40" }}>{bookingError}</div>}

          {bookingLoading && bookings.length === 0 ? (
            <div className="empty-state">Loading bookings...</div>
          ) : bookings.length === 0 ? (
            <div className="empty-state">
              <h3>No bookings yet 🌸</h3>
              <p>Customer bookings for your flowers will appear here.</p>
            </div>
          ) : (
            <div className="booking-list">
              {bookings.map((booking) => (
                <article className="booking-card" key={booking.id}>
                  <h3>Booking #{booking.id} — {booking.flowerName || "Flower"}</h3>
                  <div className="booking-info">
                    <div><strong>Customer:</strong> {booking.customerName || "N/A"}</div>
                    <div><strong>Email:</strong> {booking.customerEmail || "N/A"}</div>
                    <div><strong>Rental:</strong> {booking.startDate || "—"} to {booking.endDate || "—"}</div>
                    <div><strong>Quantity:</strong> {booking.quantity ?? "—"}</div>
                    <div><strong>Total:</strong> ₹{Number(booking.totalPrice || 0).toFixed(2)}</div>
                    <div><strong>Booked on:</strong> {booking.createdAt ? new Date(booking.createdAt).toLocaleString("en-IN") : "N/A"}</div>
                  </div>
                  <div className="booking-status">Status: {booking.status || "UNKNOWN"}</div>
                  {booking.status === "PENDING" && (
                    <div className="booking-actions">
                      <button className="booking-action confirm-booking" disabled={updatingBookingId === booking.id} onClick={() => handleBookingStatus(booking.id, "CONFIRMED")}>✓ Confirm</button>
                      <button className="booking-action cancel-booking" disabled={updatingBookingId === booking.id} onClick={() => handleBookingStatus(booking.id, "CANCELLED")}>✕ Cancel</button>
                    </div>
                  )}
                  {booking.status === "CONFIRMED" && (
                    <div className="booking-actions">
                      <button className="booking-action complete-booking" disabled={updatingBookingId === booking.id} onClick={() => handleBookingStatus(booking.id, "COMPLETED")}>✓ Mark Completed</button>
                      <button className="booking-action cancel-booking" disabled={updatingBookingId === booking.id} onClick={() => handleBookingStatus(booking.id, "CANCELLED")}>✕ Cancel</button>
                    </div>
                  )}
                  {updatingBookingId === booking.id && <p>Updating booking...</p>}
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Inventory Overview */}
        <section>
          <div className="section-header">
            <h2>📦 Inventory Overview</h2>
            <button
              className="primary-button"
              type="button"
              onClick={loadFlowers}
            >
              ↻ Refresh Inventory
            </button>
          </div>

          <div className="inventory-summary">
            <div className="inventory-stat">
              <div className="inventory-stat-label">Flower Types</div>
              <div className="inventory-stat-value">{flowers.length}</div>
            </div>
            <div className="inventory-stat">
              <div className="inventory-stat-label">Total Available Units</div>
              <div className="inventory-stat-value">
                {flowers.reduce((sum, flower) => sum + Math.max(0, Number(flower.availableQuantity) || 0), 0)}
              </div>
            </div>
            <div className="inventory-stat">
              <div className="inventory-stat-label">Low Stock (1–10 units)</div>
              <div className="inventory-stat-value">
                {flowers.filter((flower) => {
                  const quantity = Number(flower.availableQuantity) || 0;
                  return quantity > 0 && quantity <= 10;
                }).length}
              </div>
            </div>
            <div className="inventory-stat">
              <div className="inventory-stat-label">Out of Stock</div>
              <div className="inventory-stat-value">
                {flowers.filter((flower) => Number(flower.availableQuantity) === 0).length}
              </div>
            </div>
          </div>

          {inventoryMessage && (
            <div
              className="status-message"
              style={{
                background: inventoryMessage.toLowerCase().includes("unable") || inventoryMessage.toLowerCase().includes("enter a valid") ? "#fde8ed" : "#e8f7ec",
                color: inventoryMessage.toLowerCase().includes("unable") || inventoryMessage.toLowerCase().includes("enter a valid") ? "#a51d40" : "#287b45"
              }}
            >
              {inventoryMessage}
            </div>
          )}
        </section>

        {/* Flower Management */}
        <section>
          <div className="section-header">
            <h2>🌺 Manage My Flowers</h2>

            <button className="primary-button" onClick={openAddForm}>
              + Add New Flower
            </button>
          </div>

          {message && <div className="status-message">{message}</div>}

          {flowers.length === 0 ? (
            <div className="empty-state">
              <h3>No flowers added yet 🌸</h3>
              <p>Add your first flower to start managing your collection.</p>

              <button className="primary-button" onClick={openAddForm}>
                + Add Your First Flower
              </button>
            </div>
          ) : (
            <div className="flowers-grid">
              {flowers.map((flower) => (
                <div className="flower-card" key={flower.id}>
                  {flower.imageUrl ? (
                    <img
                      className="flower-image"
                      src={flower.imageUrl}
                      alt={flower.name}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <div className="flower-image-placeholder">🌸</div>
                  )}

                  <div className="flower-content">
                    <h3>{flower.name}</h3>

                    <div className="flower-category">
                      {flower.category}
                    </div>

                    <p>{flower.description || "No description available."}</p>

                    <div className="flower-price">
                      ₹{Number(flower.rentalPrice).toFixed(2)} / day
                    </div>

                    <div className="flower-quantity">
                      Available Quantity: {flower.availableQuantity ?? 0}
                    </div>

                    <span
                      className={`stock-badge ${
                        Number(flower.availableQuantity) === 0
                          ? "stock-out"
                          : Number(flower.availableQuantity) <= 10
                          ? "stock-low"
                          : "stock-in"
                      }`}
                    >
                      {Number(flower.availableQuantity) === 0
                        ? "OUT OF STOCK"
                        : Number(flower.availableQuantity) <= 10
                        ? "LOW STOCK"
                        : "IN STOCK"}
                    </span>

                    <div className="stock-control">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        aria-label={`Update stock for ${flower.name}`}
                        value={stockInputs[flower.id] ?? String(flower.availableQuantity ?? 0)}
                        onChange={(e) =>
                          setStockInputs((previous) => ({
                            ...previous,
                            [flower.id]: e.target.value
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="stock-update-button"
                        disabled={stockUpdatingId === flower.id}
                        onClick={() => handleStockUpdate(flower)}
                      >
                        {stockUpdatingId === flower.id ? "Updating..." : "Update Stock"}
                      </button>
                    </div>

                    <div className="flower-actions">
                      <button
                        className="edit-button"
                        onClick={() => openEditForm(flower)}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        className="delete-button"
                        onClick={() => handleDelete(flower.id)}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Add/Edit Flower Form */}
      {showForm && (
        <div className="form-overlay">
          <form className="flower-form" onSubmit={handleSubmit}>
            <h2>{editingId ? "Edit Flower" : "Add New Flower"}</h2>

            {message && <div className="status-message">{message}</div>}

            <div className="form-group">
              <label>Flower Name *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter flower name"
                required
              />
            </div>

            <div className="form-group">
              <label>Category *</label>
              <input
                type="text"
                name="category"
                value={form.category}
                onChange={handleChange}
                placeholder="Example: Wedding, Decoration"
                required
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter flower description"
              />
            </div>

            <div className="form-group">
              <label>Rental Price (₹ per day) *</label>
              <input
                type="number"
                name="rentalPrice"
                value={form.rentalPrice}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="Enter rental price"
                required
              />
            </div>

            <div className="form-group">
              <label>Available Quantity *</label>
              <input
                type="number"
                name="availableQuantity"
                value={form.availableQuantity}
                onChange={handleChange}
                min="0"
                step="1"
                placeholder="Enter quantity"
                required
              />
            </div>

            <div className="form-group">
              <label>Image URL</label>
              <input
                type="url"
                name="imageUrl"
                value={form.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/flower.jpg"
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => {
                  setShowForm(false);
                  setMessage("");
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="save-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Flower"
                  : "Save Flower"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default SellerDashboard;