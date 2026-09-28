import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { useEffect, useState } from "react";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import SellerRegister from "./pages/SellerRegister.jsx";
import SellerDashboard from "./pages/SellerDashboard.jsx";

import {
  getAllFlowers,
  addFlower,
  updateFlower,
  deleteFlower,
} from "./api/flowerService";

import bookingService from "./services/bookingService";
import { getFlowerAvailability } from "./services/availabilityService";

import "./App.css";

// ===============================
// HOME PAGE
// ===============================

function Home() {
  const [flowers, setFlowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Customer catalog search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("default");
  const [availableOnly, setAvailableOnly] = useState(false);

  // Check whether the logged-in user is an Admin
  const role = localStorage.getItem("role");
  const isAdmin = role === "ADMIN";

  // Flower form state
  const initialFormData = {
    name: "",
    category: "",
    description: "",
    rentalPrice: "",
    availableQuantity: "",
    imageUrl: "",
  };

  const [formData, setFormData] = useState(initialFormData);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Customer booking state
  const [selectedFlower, setSelectedFlower] = useState(null);
  const [detailsFlower, setDetailsFlower] = useState(null);
  const [bookingDates, setBookingDates] = useState({
    startDate: "",
    endDate: "",
    quantity: 1,
  });
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookingSaving, setBookingSaving] = useState(false);
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");
  const [showBookings, setShowBookings] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(false);

  // ===============================
  // FETCH FLOWERS
  // ===============================

  const fetchFlowers = async () => {
    try {
      setError("");
      const data = await getAllFlowers();
      setFlowers(data);
    } catch (err) {
      console.error("Error fetching flowers:", err);
      setError("Unable to load flowers. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlowers();
  }, []);

  // ===============================
  // CUSTOMER BOOKINGS
  // ===============================

  const openBookingForm = (flower) => {
    if (!localStorage.getItem("token")) {
      alert("Please log in to book flowers.");
      window.location.href = "/login";
      return;
    }

    if (isAdmin) {
      alert("Customer booking is available for customer accounts.");
      return;
    }

    setSelectedFlower(flower);
    setBookingDates({ startDate: "", endDate: "", quantity: 1 });
    setBookingMessage("");
    setBookingError("");
    setAvailability(null);
    setAvailabilityError("");
  };

  const handleBookingDateChange = (e) => {
    setBookingDates({
      ...bookingDates,
      [e.target.name]: e.target.value,
    });
    // Recheck availability when the selected date range changes.
    if (e.target.name === "startDate" || e.target.name === "endDate") {
      setAvailability(null);
      setAvailabilityError("");
    }
  };

  const handleCheckAvailability = async () => {
    setAvailability(null);
    setAvailabilityError("");

    if (!selectedFlower) return;

    if (!bookingDates.startDate || !bookingDates.endDate) {
      setAvailabilityError("Please select both start and end dates.");
      return;
    }

    if (bookingDates.startDate > bookingDates.endDate) {
      setAvailabilityError("End date must be on or after the start date.");
      return;
    }

    try {
      setAvailabilityLoading(true);
      const result = await getFlowerAvailability(
        selectedFlower.id,
        bookingDates.startDate,
        bookingDates.endDate
      );
      setAvailability(result);
    } catch (err) {
      setAvailabilityError(
        err.message || "Unable to check flower availability. Please try again."
      );
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    setBookingMessage("");
    setBookingError("");

    if (!selectedFlower) return;

    if (availability && Number(bookingDates.quantity) > Number(availability.availableQuantity)) {
      setBookingError(
        `Only ${availability.availableQuantity} unit(s) are available for the selected dates.`
      );
      return;
    }

    setBookingSaving(true);
    try {
      const result = await bookingService.createBooking({
        flowerId: selectedFlower.id,
        startDate: bookingDates.startDate,
        endDate: bookingDates.endDate,
        quantity: Number(bookingDates.quantity),
      });

      setBookingMessage(`Booking created successfully! Booking ID: ${result.id}`);
      setSelectedFlower(null);
      if (showBookings) {
        await loadMyBookings();
      }
    } catch (err) {
      setBookingError(
        err.response?.data?.message ||
          "Unable to create booking. Please check your dates and quantity."
      );
    } finally {
      setBookingSaving(false);
    }
  };

  const loadMyBookings = async () => {
    setBookingsLoading(true);
    setBookingError("");
    try {
      const bookings = await bookingService.getMyBookings();
      setMyBookings(bookings);
      setShowBookings(true);

      // Scroll to the booking history after it is rendered
      window.setTimeout(() => {
        document.getElementById("my-bookings")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    } catch (err) {
      setBookingError(
        err.response?.data?.message || "Unable to load your bookings. Please log in again."
      );
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const confirmed = window.confirm(`Cancel booking #${bookingId}?`);
    if (!confirmed) return;

    try {
      await bookingService.cancelBooking(bookingId);
      setMyBookings((previous) =>
        previous.map((booking) =>
          booking.id === bookingId
            ? { ...booking, status: "CANCELLED" }
            : booking
        )
      );
    } catch (err) {
      setBookingError(
        err.response?.data?.message || "Unable to cancel this booking."
      );
    }
  };

  // ===============================
  // HANDLE FORM INPUT
  // ===============================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // ===============================
  // OPEN ADD FORM
  // ===============================

  const handleAddClick = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setMessage("");
    setShowForm(true);
  };

  // ===============================
  // OPEN EDIT FORM
  // ===============================

  const handleEditClick = (flower) => {
    setFormData({
      name: flower.name || "",
      category: flower.category || "",
      description: flower.description || "",
      rentalPrice: flower.rentalPrice ?? "",
      availableQuantity: flower.availableQuantity ?? "",
      imageUrl: flower.imageUrl || "",
    });

    setEditingId(flower.id);
    setMessage("");
    setShowForm(true);

    document
      .getElementById("flower-form")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  // ===============================
  // ADD OR UPDATE FLOWER
  // ===============================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    const flowerData = {
      ...formData,
      rentalPrice: Number(formData.rentalPrice),
      availableQuantity: Number(formData.availableQuantity),
    };

    try {
      if (editingId) {
        await updateFlower(editingId, flowerData);
        setMessage("Flower updated successfully!");
      } else {
        await addFlower(flowerData);
        setMessage("Flower added successfully!");
      }

      setFormData(initialFormData);
      setEditingId(null);
      setShowForm(false);

      await fetchFlowers();
    } catch (err) {
      console.error("Error saving flower:", err);

      setError(
        err.response?.data?.message ||
          "Unable to save flower. Please check your details and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  // ===============================
  // DELETE FLOWER
  // ===============================

  const handleDelete = async (id, name) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${name}"?`
    );

    if (!confirmed) return;

    setError("");
    setMessage("");

    try {
      await deleteFlower(id);

      setMessage("Flower deleted successfully!");

      await fetchFlowers();
    } catch (err) {
      console.error("Error deleting flower:", err);

      setError(
        err.response?.data?.message ||
          "Unable to delete flower. Please try again."
      );
    }
  };

  // ===============================
  // CANCEL FORM
  // ===============================

  const handleCancel = () => {
    setFormData(initialFormData);
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  // ===============================
  // LOGOUT
  // ===============================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("email");

    window.location.href = "/";
  };

  // Categories and filtered flower list for customers.
  // Admin flower management keeps the original, unfiltered catalog.
  const categories = [
    ...new Set(
      flowers
        .map((flower) => flower.category)
        .filter((category) => category && category.trim())
    ),
  ];

  const filteredFlowers = flowers
    .filter((flower) => {
      const query = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !query ||
        [flower.name, flower.description, flower.category].some((value) =>
          String(value || "").toLowerCase().includes(query)
        );
      const matchesCategory =
        selectedCategory === "ALL" || flower.category === selectedCategory;
      const matchesAvailability =
        !availableOnly || Number(flower.availableQuantity) > 0;

      return matchesSearch && matchesCategory && matchesAvailability;
    })
    .sort((a, b) => {
      if (sortOrder === "price-low") {
        return Number(a.rentalPrice) - Number(b.rentalPrice);
      }
      if (sortOrder === "price-high") {
        return Number(b.rentalPrice) - Number(a.rentalPrice);
      }
      if (sortOrder === "name-az") {
        return String(a.name || "").localeCompare(String(b.name || ""));
      }
      return 0;
    });

  const catalogFlowers = isAdmin ? flowers : filteredFlowers;

  const clearCatalogFilters = () => {
    setSearchTerm("");
    setSelectedCategory("ALL");
    setSortOrder("default");
    setAvailableOnly(false);
  };

  return (
    <div className="app">

      {/* NAVIGATION BAR */}

      <header className="navbar">
        <div className="logo">
          🌸 Florist<span>Rent</span>
        </div>

        <nav>
          <a href="#home">Home</a>
          <a href="#flowers">Flowers</a>
          <a href="#about">About</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="nav-buttons">
          {localStorage.getItem("token") ? (
            <>
              {isAdmin && (
                <span className="admin-badge">
                  👑 Admin
                </span>
              )}

              {!isAdmin && (
                <button
                  type="button"
                  className="login-btn"
                  onClick={loadMyBookings}
                >
                  My Bookings
                </button>
              )}

              <button
                type="button"
                className="login-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="login-btn">
                Login
              </Link>

              <Link to="/register" className="register-btn">
                Sign Up
              </Link>
            </>
          )}
        </div>
      </header>

      {/* HERO SECTION */}

      <section className="hero" id="home">
        <div className="hero-content">
          <p className="hero-tag">
            MAKE EVERY MOMENT BEAUTIFUL
          </p>

          <h1>
            Beautiful Flowers
            <br />
            For Every <span>Occasion</span>
          </h1>

          <p className="hero-description">
            Rent beautiful floral arrangements for weddings,
            birthdays, parties, and special events.
            Make your celebrations unforgettable.
          </p>

          <div className="hero-buttons">
            <a href="#flowers" className="primary-btn">
              Explore Flowers →
            </a>

            <a href="#about" className="secondary-btn">
              Learn More
            </a>
          </div>
        </div>

        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=900&q=80"
            alt="Beautiful floral arrangement"
          />
        </div>
      </section>

      {/* FEATURES SECTION */}

      <section className="features">
        <div className="feature-card">
          <span>🌷</span>
          <h3>Fresh & Beautiful</h3>
          <p>
            Elegant floral arrangements for your special occasions.
          </p>
        </div>

        <div className="feature-card">
          <span>🚚</span>
          <h3>Easy Rental</h3>
          <p>
            Choose your favorite flowers and arrange your rental easily.
          </p>
        </div>

        <div className="feature-card">
          <span>💐</span>
          <h3>Wide Collection</h3>
          <p>
            Explore flowers and decorations for every celebration.
          </p>
        </div>
      </section>

      {/* FLOWERS SECTION */}

      <section className="flowers-section" id="flowers">
        <div className="section-heading">
          <p>OUR COLLECTION</p>
          <h2>Explore Our Flowers</h2>
          <span>
            Find beautiful floral arrangements for your next celebration.
          </span>
        </div>

        {/* ADMIN MANAGEMENT PANEL */}

        {isAdmin && (
          <div className="admin-panel">
            <h2>Admin Flower Management</h2>

            <p>
              Add, update, and manage your flower collection.
            </p>

            {!showForm && (
              <button
                type="button"
                className="primary-btn"
                onClick={handleAddClick}
              >
                + Add New Flower
              </button>
            )}
          </div>
        )}

        {/* ADD / EDIT FLOWER FORM */}

        {isAdmin && showForm && (
          <div className="admin-form-container" id="flower-form">
            <h2>
              {editingId ? "Edit Flower" : "Add New Flower"}
            </h2>

            <form onSubmit={handleSubmit} className="admin-form">
              <label>Flower Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter flower name"
                required
              />

              <label>Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleChange}
                placeholder="Example: Wedding, Birthday"
                required
              />

              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter flower description"
                required
              />

              <label>Rental Price (₹)</label>
              <input
                type="number"
                name="rentalPrice"
                value={formData.rentalPrice}
                onChange={handleChange}
                placeholder="Enter rental price"
                min="0"
                step="0.01"
                required
              />

              <label>Available Quantity</label>
              <input
                type="number"
                name="availableQuantity"
                value={formData.availableQuantity}
                onChange={handleChange}
                placeholder="Enter available quantity"
                min="0"
                required
              />

              <label>Image URL</label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="Enter flower image URL"
              />

              <div className="admin-form-buttons">
                <button
                  type="submit"
                  className="primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Flower"
                    : "Add Flower"}
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STATUS MESSAGES */}

        {message && (
          <p className="success-message">
            {message}
          </p>
        )}

        {error && (
          <p className="error-message">
            {error}
          </p>
        )}

        {/* FLOWER CATALOG */}

        {!isAdmin && (
          <div
            className="catalog-toolbar"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "12px",
              margin: "24px 0",
              padding: "18px",
              border: "1px solid #f0dce5",
              borderRadius: "14px",
              background: "#fff",
            }}
          >
            <input
              type="search"
              aria-label="Search flowers"
              placeholder="Search by flower name, category, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: "1 1 260px",
                minWidth: "220px",
                padding: "12px 14px",
                border: "1px solid #e5cbd7",
                borderRadius: "8px",
                font: "inherit",
              }}
            />

            <select
              aria-label="Filter by category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                flex: "0 1 190px",
                padding: "12px",
                border: "1px solid #e5cbd7",
                borderRadius: "8px",
                background: "#fff",
                font: "inherit",
              }}
            >
              <option value="ALL">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <select
              aria-label="Sort flowers"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              style={{
                flex: "0 1 190px",
                padding: "12px",
                border: "1px solid #e5cbd7",
                borderRadius: "8px",
                background: "#fff",
                font: "inherit",
              }}
            >
              <option value="default">Sort: Default</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name-az">Name: A to Z</option>
            </select>

            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#51454b",
                whiteSpace: "nowrap",
              }}
            >
              <input
                type="checkbox"
                checked={availableOnly}
                onChange={(e) => setAvailableOnly(e.target.checked)}
              />
              Available only
            </label>

            <button
              type="button"
              className="secondary-btn"
              onClick={clearCatalogFilters}
            >
              Clear Filters
            </button>
          </div>
        )}

        {!isAdmin && !loading && !error && (
          <p style={{ margin: "0 0 16px", color: "#75656d" }}>
            Showing {catalogFlowers.length} of {flowers.length} flowers
          </p>
        )}

        <div className="flower-grid">
          {loading && <p>Loading flowers...</p>}

          {!loading && !error && flowers.length === 0 && (
            <p>No flowers are available right now.</p>
          )}

          {!loading && !error && flowers.length > 0 && catalogFlowers.length === 0 && (
            <p>No flowers match your filters. Try changing your search or clearing the filters.</p>
          )}

          {!loading &&
            catalogFlowers.map((flower) => (
              <div className="flower-card" key={flower.id}>
                <img
                  src={
                    flower.imageUrl ||
                    "https://placehold.co/600x400?text=Flower"
                  }
                  alt={flower.name}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/600x400?text=Flower";
                  }}
                />

                <div className="flower-info">
                  <h3>{flower.name}</h3>

                  <p>{flower.description}</p>

                  <p>
                    <strong>Category:</strong>{" "}
                    {flower.category}
                  </p>

                  <p>
                    <strong>Available:</strong>{" "}
                    {flower.availableQuantity}
                  </p>

                  <div className="flower-bottom">
                    <span>
                      ₹{Number(flower.rentalPrice).toFixed(2)}
                    </span>

                    <button
                      type="button"
                      onClick={() => setDetailsFlower(flower)}
                    >
                      View Details
                    </button>
                  </div>

                  {!isAdmin && (
                    <div style={{ marginTop: "12px" }}>
                      <button
                        type="button"
                        className="primary-btn"
                        onClick={() => openBookingForm(flower)}
                      >
                        Book Now
                      </button>
                    </div>
                  )}

                  {selectedFlower?.id === flower.id && (
                    <form
                      onSubmit={handleCreateBooking}
                      style={{
                        display: "grid",
                        gap: "10px",
                        marginTop: "15px",
                        padding: "14px",
                        border: "1px solid #ead6df",
                        borderRadius: "10px",
                        background: "#fff8fb",
                      }}
                    >
                      <h4 style={{ margin: 0 }}>Book {flower.name}</h4>

                      <label>
                        Start Date
                        <input
                          type="date"
                          name="startDate"
                          value={bookingDates.startDate}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={handleBookingDateChange}
                          required
                          style={{ display: "block", width: "100%", padding: "9px", marginTop: "5px" }}
                        />
                      </label>

                      <label>
                        End Date
                        <input
                          type="date"
                          name="endDate"
                          value={bookingDates.endDate}
                          min={bookingDates.startDate || new Date().toISOString().split("T")[0]}
                          onChange={handleBookingDateChange}
                          required
                          style={{ display: "block", width: "100%", padding: "9px", marginTop: "5px" }}
                        />
                      </label>

                      <label>
                        Quantity
                        <input
                          type="number"
                          name="quantity"
                          min="1"
                          max={flower.availableQuantity}
                          value={bookingDates.quantity}
                          onChange={handleBookingDateChange}
                          required
                          style={{ display: "block", width: "100%", padding: "9px", marginTop: "5px" }}
                        />
                      </label>

                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={handleCheckAvailability}
                        disabled={availabilityLoading || !bookingDates.startDate || !bookingDates.endDate}
                      >
                        {availabilityLoading ? "Checking Availability..." : "Check Availability"}
                      </button>

                      {availabilityError && (
                        <p role="alert" style={{ color: "#c62828", margin: 0 }}>
                          {availabilityError}
                        </p>
                      )}

                      {availability && (
                        <div
                          role="status"
                          style={{
                            padding: "12px",
                            borderRadius: "8px",
                            background: Number(availability.availableQuantity) > 0 ? "#eaf7ed" : "#fdecec",
                            color: Number(availability.availableQuantity) > 0 ? "#216e39" : "#a12622",
                          }}
                        >
                          <p style={{ margin: "0 0 6px", fontWeight: 600 }}>
                            Availability for selected dates
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            Total stock: {availability.totalStock}
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            Booked quantity: {availability.bookedQuantity}
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            Available quantity: {availability.availableQuantity}
                          </p>
                          <p style={{ margin: "6px 0 0", fontWeight: 600 }}>
                            {Number(availability.availableQuantity) > 0
                              ? "Flower is available for these dates."
                              : "No stock is available for these dates."}
                          </p>
                          {Number(bookingDates.quantity) > Number(availability.availableQuantity) && (
                            <p style={{ margin: "8px 0 0", fontWeight: 600 }}>
                              Requested quantity exceeds available stock.
                            </p>
                          )}
                        </div>
                      )}

                      <p style={{ margin: 0 }}>
                        Price per day: ₹{Number(flower.rentalPrice).toFixed(2)}
                      </p>

                      <button type="submit" className="primary-btn" disabled={bookingSaving}>
                        {bookingSaving ? "Booking..." : "Confirm Booking"}
                      </button>

                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => setSelectedFlower(null)}
                      >
                        Close
                      </button>
                    </form>
                  )}

                  {/* ADMIN ACTION BUTTONS */}

                  {isAdmin && (
                    <div className="admin-actions">
                      <button
                        type="button"
                        className="edit-btn"
                        onClick={() => handleEditClick(flower)}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        type="button"
                        className="delete-btn"
                        onClick={() =>
                          handleDelete(flower.id, flower.name)
                        }
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </section>

      {/* CUSTOMER BOOKING STATUS AND HISTORY */}

      {bookingMessage && (
        <p className="success-message" style={{ textAlign: "center" }}>
          {bookingMessage}
        </p>
      )}

      {bookingError && (
        <p className="error-message" style={{ textAlign: "center" }}>
          {bookingError}
        </p>
      )}

      {showBookings && (
        <section
          id="my-bookings"
          style={{ maxWidth: "1100px", margin: "30px auto", padding: "20px" }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
            <h2>My Bookings</h2>
            <button
              type="button"
              className="secondary-btn"
              onClick={() => setShowBookings(false)}
            >
              Close
            </button>
          </div>

          {bookingsLoading ? (
            <p>Loading bookings...</p>
          ) : myBookings.length === 0 ? (
            <p>You have no bookings yet.</p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr>
                    <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Booking ID</th>
                    <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Flower</th>
                    <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Dates</th>
                    <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Qty</th>
                    <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Total</th>
                    <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Status</th>
                    <th style={{ padding: "10px", borderBottom: "1px solid #ddd" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{booking.id}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{booking.flowerName}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                        {booking.startDate} – {booking.endDate}
                      </td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{booking.quantity}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>₹{Number(booking.totalPrice).toFixed(2)}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>{booking.status}</td>
                      <td style={{ padding: "10px", borderBottom: "1px solid #eee" }}>
                        {booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && (
                          <button
                            type="button"
                            className="delete-btn"
                            onClick={() => handleCancelBooking(booking.id)}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* FLOWER DETAILS MODAL */}
      {detailsFlower && (
        <div
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setDetailsFlower(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background: "rgba(30, 18, 25, 0.62)",
            overflowY: "auto",
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="flower-details-title"
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "760px",
              maxHeight: "90vh",
              overflowY: "auto",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "24px",
              padding: "24px",
              borderRadius: "18px",
              background: "#fff",
              boxShadow: "0 20px 70px rgba(0,0,0,0.25)",
            }}
          >
            <button
              type="button"
              aria-label="Close flower details"
              onClick={() => setDetailsFlower(null)}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                width: "38px",
                height: "38px",
                border: "1px solid #ead6df",
                borderRadius: "50%",
                background: "#fff",
                color: "#6b4354",
                fontSize: "22px",
                cursor: "pointer",
                zIndex: 1,
              }}
            >
              ×
            </button>

            <img
              src={detailsFlower.imageUrl || "https://placehold.co/600x500?text=Flower"}
              alt={detailsFlower.name}
              onError={(event) => {
                event.currentTarget.src = "https://placehold.co/600x500?text=Flower";
              }}
              style={{
                width: "100%",
                height: "320px",
                objectFit: "cover",
                borderRadius: "12px",
                background: "#fff4f8",
              }}
            />

            <div style={{ alignSelf: "center", padding: "8px 4px" }}>
              <p style={{ margin: "0 0 8px", color: "#b34776", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", fontSize: "12px" }}>
                {detailsFlower.category || "Flower Collection"}
              </p>
              <h2 id="flower-details-title" style={{ margin: "0 0 14px", color: "#29212a", fontSize: "28px" }}>
                {detailsFlower.name}
              </h2>
              <p style={{ color: "#75656d", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                {detailsFlower.description || "No description is available for this flower."}
              </p>
              <p style={{ margin: "18px 0 8px", color: "#51454b" }}>
                <strong>Rental price:</strong> ₹{Number(detailsFlower.rentalPrice || 0).toFixed(2)} / day
              </p>
              <p style={{ margin: "8px 0 20px", color: "#51454b" }}>
                <strong>Available quantity:</strong> {Number(detailsFlower.availableQuantity || 0)}
              </p>
              {!isAdmin && (
                <button
                  type="button"
                  className="primary-btn"
                  disabled={Number(detailsFlower.availableQuantity) <= 0}
                  onClick={() => {
                    const flowerToBook = detailsFlower;
                    setDetailsFlower(null);
                    openBookingForm(flowerToBook);
                  }}
                  style={{ width: "100%", opacity: Number(detailsFlower.availableQuantity) <= 0 ? 0.6 : 1 }}
                >
                  {Number(detailsFlower.availableQuantity) <= 0 ? "Currently Unavailable" : "Book Now"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ABOUT SECTION */}

      <section className="about-section" id="about">
        <h2>Make Your Events Special</h2>

        <p>
          FloristRent helps you discover and rent beautiful floral
          arrangements for weddings, parties, and memorable celebrations.
        </p>

        <a href="#flowers" className="primary-btn">
          Explore Collection →
        </a>
      </section>

      {/* FOOTER */}

      <footer id="contact">
        <h3>🌸 FloristRent</h3>
        <p>Beautiful flowers for beautiful memories.</p>
        <p>© 2026 FloristRent. All rights reserved.</p>
      </footer>
    </div>
  );
}

// ===============================
// MAIN APP WITH ROUTING
// ===============================

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Home Page */}
        <Route path="/" element={<Home />} />

        {/* Customer Login and Registration */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Seller Registration and Dashboard */}
        <Route
          path="/register-seller"
          element={<SellerRegister />}
        />

        <Route
          path="/seller-dashboard"
          element={<SellerDashboard />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;