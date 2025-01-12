// src/utils/toastNotifications.js
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
