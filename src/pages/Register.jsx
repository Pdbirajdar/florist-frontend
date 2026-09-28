import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registerUser } from "../api/authService";
import "./Login.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Validate email format
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return emailRegex.test(email);
  };

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  // Handle customer registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const email = formData.email.trim();

    // Validate email
    if (!isValidEmail(email)) {
      setError(
        "Please enter a valid email address, e.g. example@gmail.com"
      );
      return;
    }

    // Validate password
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      // Register customer
      await registerUser({
        name: formData.name.trim(),
        email: email,
        password: formData.password,
      });

      alert("Customer registration successful! Please log in.");

      navigate("/login");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (typeof err.response?.data === "string"
            ? err.response.data
            : "Registration failed. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Create Customer Account 🌸</h1>

        <p>Join FloristRent today and rent beautiful flowers.</p>

        {error && (
          <div className="login-error">
            {String(error)}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <label>Full Name</label>

          <input
            type="text"
            name="name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          {/* Email */}
          <label>Email Address</label>

          <input
            type="email"
            name="email"
            placeholder="Enter your email (example@gmail.com)"
            value={formData.email}
            onChange={handleChange}
            required
          />

          {/* Password */}
          <label>Password</label>

          <input
            type="password"
            name="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
          />

          {/* Submit */}
          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Register as Customer"}
          </button>
        </form>

        {/* Login Link */}
        <p className="login-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>

        {/* Seller Registration Link */}
        <p className="login-footer">
          Want to rent out flowers?{" "}
          <Link to="/register-seller">Register as Seller</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;