const API_BASE_URL = "https://florist-backend-sx2.onrender.com/api/flowers";

export const getFlowerAvailability = async (
  flowerId,
  startDate,
  endDate
) => {
  const response = await fetch(
    `${API_BASE_URL}/${flowerId}/availability?startDate=${startDate}&endDate=${endDate}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch flower availability");
  }

  return await response.json();
};