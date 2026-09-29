import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

const API_URL = "https://florist-backend-sx52.onrender.com/api";

function SellerRegister() {
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

  // Handle seller registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const name = formData.name.trim();
    const email = formData.email.trim();

    if (!name) {
      setError("Please enter your full name.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/auth/register-seller`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password: formData.password,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            (typeof data === "string" ? data : null) ||
            "Seller registration failed. Please try again."
        );
      }

      alert(
        data?.message ||
          (typeof data === "string" ? data : null) ||
          "Seller registered successfully. Please login to continue."
      );

      navigate("/login");
    } catch (err) {
      setError(
        err.message ||
          "Unable to register. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🌸 Become a Seller</h1>
        <p>Join FloristRent and list your flowers for rental.</p>

        {error && (
          <div className="login-error">
            {String(error)}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input
            type="text"
            name="name"
            placeholder="Enter your full name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label>Email Address</label>
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
          />

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

          <button type="submit" disabled={loading}>
            {loading ? "Registering..." : "Register as Seller"}
          </button>
        </form>

        <p className="login-footer">
          Your seller account will be activated automatically.
          You can log in after registration.
        </p>

        <p className="login-footer">
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>

        <p className="login-footer">
          Want to rent flowers?{" "}
          <Link to="/register">Register as Customer</Link>
        </p>
      </div>
    </div>
  );
}

export default SellerRegister;