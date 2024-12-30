import { toast, Slide } from "react-toastify";

// --- Default Toast Configurations ---
export const toastConfig = {
  position: "top-center", // Default position
  autoClose: 2000, // Close automatically after 3 seconds
  hideProgressBar: true, // Show progress bar
  closeOnClick: true, // Close when clicked
  pauseOnHover: true, // Pause when hovered
  draggable: true, // Allow dragging
  theme: "colored", // Use colored theme
  transition: Slide, // Built-in Slide transition (fix)
};

// --- Success Toast ---
export const toastSuccess = (message, config = {}) => {
  toast.success(message, { ...toastConfig, ...config });
};

// --- Error Toast ---
export const toastError = (message, config = {}) => {
  toast.error(message, { ...toastConfig, ...config });
};

// --- Warning Toast ---
export const toastWarning = (message, config = {}) => {
  toast.warn(message, { ...toastConfig, ...config });
};

// --- Info Toast ---
export const toastInfo = (message, config = {}) => {
  toast.info(message, { ...toastConfig, ...config });
};

// --- Custom Toast ---
export const toastCustom = (message, config = {}) => {
  toast(message, { ...toastConfig, ...config });
};
