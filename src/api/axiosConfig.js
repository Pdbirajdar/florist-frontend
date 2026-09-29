import axios from "axios";

const api = axios.create({
  baseURL: "https://florist-backend-sx52.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT token to protected API requests
api.interceptors.request.use(
  (config) => {
    const isAuthRequest =
      config.url?.includes("/auth/register") ||
      config.url?.includes("/auth/login");

    if (!isAuthRequest) {
      const token = localStorage.getItem("token");

      if (token && token !== "null" && token !== "undefined") {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;