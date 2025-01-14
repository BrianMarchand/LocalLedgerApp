import Swal from "sweetalert2";
import { toastSuccess, toastError } from "./toastNotifications";

// Show confirmation modal
export const showConfirmation = async (
  title,
  text,
  confirmText,
  cancelText,
) => {
  return Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: confirmText || "Confirm",
    cancelButtonText: cancelText || "Cancel",
  });
};

// Show success alert
export const showSuccessAlert = async (title, text) => {
  return Swal.fire({
    title,
    text,
    icon: "success",
    confirmButtonText: "OK",
  });
};

// Show error alert
export const showErrorAlert = async (title, text) => {
  return Swal.fire({
    title,
    text,
    icon: "error",
    confirmButtonText: "OK",
  });
};

// Unified error handler
export const handleError = (error, defaultMessage) => {
  console.error(error);
  toastError(error.message || defaultMessage);
};
