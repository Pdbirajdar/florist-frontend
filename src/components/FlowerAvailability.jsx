import { useState } from "react";
import { getFlowerAvailability } from "../services/availabilityService";

function FlowerAvailability({ flowerId }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const checkAvailability = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      return;
    }

    if (startDate > endDate) {
      setError("End date must be after or equal to start date.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setAvailability(null);

      const data = await getFlowerAvailability(
        flowerId,
        startDate,
        endDate
      );

      setAvailability(data);
    } catch (err) {
      setError(err.message || "Unable to check availability.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="availability-container">
      <h3>Check Flower Availability</h3>

      <div>
        <label>Start Date</label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div>
        <label>End Date</label>
        <input
          type="date"
          min={startDate}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <button onClick={checkAvailability} disabled={loading}>
        {loading ? "Checking..." : "Check Availability"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {availability && (
        <div>
          <h4>{availability.flowerName}</h4>
          <p>Total Stock: {availability.totalStock}</p>
          <p>Booked Quantity: {availability.bookedQuantity}</p>
          <p>Available Quantity: {availability.availableQuantity}</p>

          <p
            style={{
              color: availability.available ? "green" : "red",
              fontWeight: "bold",
            }}
          >
            {availability.available
              ? "Flower is available for the selected dates."
              : "Flower is unavailable for the selected dates."}
          </p>
        </div>
      )}
    </div>
  );
}

export default FlowerAvailability;