// src/utils/formatUtils.js

export const formatFirestoreTimestamp = (timestamp) => {
  if (!timestamp || !timestamp.seconds) return "N/A";
  const date = new Date(timestamp.seconds * 1000);
  return date.toLocaleDateString(); // Adjust formatting if needed
};

export const formatCurrency = (amount) => {
  if (isNaN(amount)) return "$0.00"; // Handle invalid amounts
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const formatDate = (timestamp) => {
  if (!timestamp) return "Invalid Date";

  let date;
  if (timestamp.toDate) {
    date = timestamp.toDate(); // Firestore Timestamp
  } else if (timestamp.seconds) {
    date = new Date(timestamp.seconds * 1000); // Unix Timestamp
  } else {
    date = new Date(timestamp); // Standard Date
  }

  if (isNaN(date.getTime())) return "Invalid Date";

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};
