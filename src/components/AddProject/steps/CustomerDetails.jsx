import React from "react";
import { Form } from "react-bootstrap";
import { useFormik } from "formik";
import { customerDetailsSchema } from "../utils/validationSchema";

const CustomerDetails = ({ formData, updateFormData, prevStep, nextStep }) => {
  // Initialize Formik with schema and form state
  const formik = useFormik({
    initialValues: {
      firstName: formData.firstName || "",
      familyName: formData.familyName || "",
      fullAddress: formData.fullAddress || "",
      phone: formData.phone || "",
      email: formData.email || "",
    },
    validationSchema: customerDetailsSchema,
    validateOnChange: false, // Prevent constant validation while typing
    validateOnBlur: true, // Only validate when leaving a field
    onSubmit: async (values) => {
      // Explicitly validate form before proceeding
      const errors = await formik.validateForm();
      if (Object.keys(errors).length === 0) {
        // Update form data and move to next step
        Object.keys(values).forEach((key) => updateFormData(key, values[key]));
        nextStep(); // Proceed to the next step
      } else {
        formik.setTouched(errors); // Highlight invalid fields
      }
    },
  });

  return (
    <Form onSubmit={formik.handleSubmit}>
      <h5>Customer Details</h5>

      {/* First Name */}
      <Form.Group className="mb-3">
        <Form.Label>First Name *</Form.Label>
        <Form.Control
          type="text"
          {...formik.getFieldProps("firstName")}
          isInvalid={formik.touched.firstName && formik.errors.firstName}
        />
        <Form.Control.Feedback type="invalid">
          {formik.errors.firstName}
        </Form.Control.Feedback>
      </Form.Group>

      {/* Family Name */}
      <Form.Group className="mb-3">
        <Form.Label>Family Name *</Form.Label>
        <Form.Control
          type="text"
          {...formik.getFieldProps("familyName")}
          isInvalid={formik.touched.familyName && formik.errors.familyName}
        />
        <Form.Control.Feedback type="invalid">
          {formik.errors.familyName}
        </Form.Control.Feedback>
      </Form.Group>

      {/* Full Address */}
      <Form.Group className="mb-3">
        <Form.Label>Full Address *</Form.Label>
        <Form.Control
          type="text"
          placeholder="123 Main St, City, Postal Code"
          {...formik.getFieldProps("fullAddress")}
          isInvalid={formik.touched.fullAddress && formik.errors.fullAddress}
        />
        <Form.Control.Feedback type="invalid">
          {formik.errors.fullAddress}
        </Form.Control.Feedback>
      </Form.Group>

      {/* Phone */}
      <Form.Group className="mb-3">
        <Form.Label>Phone *</Form.Label>
        <Form.Control
          type="text"
          {...formik.getFieldProps("phone")}
          isInvalid={formik.touched.phone && formik.errors.phone}
        />
        <Form.Control.Feedback type="invalid">
          {formik.errors.phone}
        </Form.Control.Feedback>
      </Form.Group>

      {/* Email Address */}
      <Form.Group className="mb-3">
        <Form.Label>Email Address *</Form.Label>
        <Form.Control
          type="email"
          {...formik.getFieldProps("email")}
          isInvalid={formik.touched.email && formik.errors.email}
        />
        <Form.Control.Feedback type="invalid">
          {formik.errors.email}
        </Form.Control.Feedback>
      </Form.Group>

      {/* Buttons */}
      <div className="d-flex justify-content-between">
        <button type="button" className="btn btn-secondary" onClick={prevStep}>
          Back
        </button>
        <button type="submit" className="btn btn-primary">
          Next
        </button>
      </div>
    </Form>
  );
};

export default CustomerDetails;
