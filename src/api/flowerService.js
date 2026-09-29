import axios from "axios";

const API_URL = "https://florist-backend-sx52.onrender.com/api/flowers";

// Get JWT token
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

// Get all flowers
export const getAllFlowers = async () => {
  const response = await axios.get(API_URL, {
    headers: getAuthHeaders(),
  });

  return response.data;
};

// Add a new flower
export const addFlower = async (flowerData) => {
  const response = await axios.post(API_URL, flowerData, {
    headers: getAuthHeaders(),
  });

  return response.data;
};

// Update an existing flower
export const updateFlower = async (id, flowerData) => {
  const response = await axios.put(
    `${API_URL}/${id}`,
    flowerData,
    {
      headers: getAuthHeaders(),
    }
  );

  return response.data;
};

// Delete a flower
export const deleteFlower = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, {
    headers: getAuthHeaders(),
  });

  return response.data;
};