export const getBadgeClass = (status) => {
  switch (status) {
    case "new":
      return "badge bg-primary"; // Blue
    case "in-progress":
      return "badge bg-info"; // Light Blue
    case "completed":
      return "badge bg-success"; // Green
    case "on-hold":
      return "badge bg-warning"; // Yellow
    case "cancelled":
      return "badge bg-danger"; // Red
    default:
      return "badge bg-secondary"; // Gray (fallback)
  }
};

export const getBadgeLabel = (status) => {
  switch (status) {
    case "new":
      return "New";
    case "in-progress":
      return "In Progress";
    case "completed":
      return "Completed";
    case "on-hold":
      return "On Hold";
    case "cancelled":
      return "Cancelled";
    default:
      return "Unknown";
  }
};
