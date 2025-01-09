import * as Yup from "yup";

// Schema for Customer Details
export const customerDetailsSchema = Yup.object().shape({
  firstName: Yup.string()
    .required("First Name is required")
    .max(50, "First Name must be 50 characters or less"),
  familyName: Yup.string()
    .required("Family Name is required")
    .max(50, "Family Name must be 50 characters or less"),
  fullAddress: Yup.string().required("Full Address is required"),
  phone: Yup.string()
    .matches(/^[0-9]{10}$/, "Phone number must be 10 digits")
    .required("Phone is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email Address is required"),
});

// Schema for Project Details
export const projectDetailsSchema = Yup.object().shape({
  projectName: Yup.string().required("Project Name is required"),
  location: Yup.string().required("Location is required"),
  budget: Yup.number()
    .positive("Budget must be greater than 0")
    .required("Budget is required"),
  status: Yup.string().default("new"), // Default 'new', no validation
  notes: Yup.string().nullable(), // Optional notes
});

// Schema for Customer Notes
export const customerNotesSchema = Yup.object().shape({
  customerNotes: Yup.string().nullable(), // Optional notes field
});
