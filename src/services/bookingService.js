import axios from "axios";

const API_URL = "https://florist-backend-sx2.onrender.com/api/bookings";

const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

// Create a booking
const createBooking = async (bookingData) => {
  const response = await axios.post(
    API_URL,
    bookingData,
    getAuthConfig()
  );
  return response.data;
};

// Get customer booking history
const getMyBookings = async () => {
  const response = await axios.get(API_URL, getAuthConfig());
  return response.data;
};

// Cancel a booking
const cancelBooking = async (bookingId) => {
  const response = await axios.patch(
    `${API_URL}/${bookingId}/cancel`,
    {},
    getAuthConfig()
  );
  return response.data;
};

export default {
  createBooking,
  getMyBookings,
  cancelBooking,
};