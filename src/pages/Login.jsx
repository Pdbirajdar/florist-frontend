import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api/authService";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [selectedRole, setSelectedRole] = useState("CUSTOMER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle role selection
  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setError("");
  };

  // Handle login
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await loginUser(formData);

      // Verify account role
      if (response.role !== selectedRole) {
        setError(
          `This account is not registered as ${selectedRole.toLowerCase()}. Please select the correct login type.`
        );
        return;
      }

      // Store authentication details
      localStorage.setItem("token", response.token);
      localStorage.setItem("role", response.role);
      localStorage.setItem("email", response.email);

      // Redirect based on role
      if (response.role === "SELLER") {
        navigate("/seller-dashboard");
      } else if (response.role === "ADMIN") {
        setError("Admin login is not available on this page.");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          (typeof err.response?.data === "string"
            ? err.response.data
            : "Login failed. Please check your email and password.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>Welcome Back 🌸</h1>

        <p>Login to your Florist Rental Management System</p>

        {/* Role Selection */}
        <div className="role-selection">
          <button
            type="button"
            className={`role-button ${
              selectedRole === "CUSTOMER" ? "active" : ""
            }`}
            onClick={() => handleRoleChange("CUSTOMER")}
          >
            👤 Customer
          </button>

          <button
            type="button"
            className={`role-button ${
              selectedRole === "SELLER" ? "active" : ""
            }`}
            onClick={() => handleRoleChange("SELLER")}
          >
            🌸 Seller
          </button>
        </div>

        {/* Error Message */}
        {error && <div className="login-error">{error}</div>}

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
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
            placeholder="Enter your password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading
              ? "Logging in..."
              : `Login as ${
                  selectedRole.charAt(0) +
                  selectedRole.slice(1).toLowerCase()
                }`}
          </button>
        </form>

        {/* Customer Registration */}
        {selectedRole === "CUSTOMER" && (
          <p className="login-footer">
            Don't have an account?{" "}
            <Link to="/register">Register</Link>
          </p>
        )}

        {/* Seller Registration */}
        {selectedRole === "SELLER" && (
          <p className="login-footer">
            Don't have a seller account?{" "}
            <Link to="/register-seller">Register as Seller</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default Login;