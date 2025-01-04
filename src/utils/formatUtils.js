// src/utils/formatUtils.js
export const formatCurrency = (amount) => {
  if (isNaN(amount)) return "$0.00"; // Handle invalid amounts
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};
