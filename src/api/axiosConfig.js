import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8090/api",
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

    // Do not attach a token to login or registration requests
    if (!isAuthRequest) {
      const token = localStorage.getItem("token");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;