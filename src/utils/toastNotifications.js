import { toast, Slide } from "react-toastify";

// --- Default Toast Configurations ---
const toastConfig = {
  position: "top-center",
  autoClose: 2000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "colored",
  transition: Slide,
};

// --- State to Prevent Overlapping Notifications ---
let isNotificationInProgress = false;

// --- Wrapper to Manage Throttling ---
const throttledToast = (type, message, config) => {
  if (isNotificationInProgress) return; // Skip if a notification is already in progress
  isNotificationInProgress = true;

  toast[type](message, { ...toastConfig, ...config });

  setTimeout(() => {
    isNotificationInProgress = false; // Unlock after toast duration
  }, config?.autoClose || toastConfig.autoClose);
};

// --- Success Toast ---
export const toastSuccess = (message, config = {}) =>
  throttledToast("success", message, config);

// --- Error Toast ---
export const toastError = (message, config = {}) =>
  throttledToast("error", message, config);

// --- Warning Toast ---
export const toastWarning = (message, config = {}) =>
  throttledToast("warn", message, config);

// --- Info Toast ---
export const toastInfo = (message, config = {}) =>
  throttledToast("info", message, config);

// --- Custom Toast ---
export const toastCustom = (message, config = {}) =>
  throttledToast("default", message, config);
