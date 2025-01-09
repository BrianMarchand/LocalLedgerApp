import React, { useState } from "react";
import { Form } from "react-bootstrap";
import { useFormik } from "formik";
import { projectDetailsSchema } from "../utils/validationSchema";

const ProjectDetails = ({
  formData,
  updateFormData,
  nextStep,
  editingProject,
}) => {
  // Local state for status - NOT tied to Formik
  const [status, setStatus] = useState(formData.status || "new");

  // Formik setup - NO status field here
  const formik = useFormik({
    initialValues: {
      projectName: formData.projectName,
      location: formData.location,
      budget: formData.budget,
      notes: formData.notes,
    },
    validationSchema: projectDetailsSchema, // Schema without status validation
    onSubmit: (values) => {
      // Combine Formik values with local status manually
      const finalData = {
        ...values,
        status: editingProject ? status : "new", // Force 'new' if adding
      };
      Object.keys(finalData).forEach((key) =>
        updateFormData(key, finalData[key]),
      );
      nextStep(); // Proceed to the next step
    },
  });

  return (
    <Form onSubmit={formik.handleSubmit}>
      <h5>Project Details</h5>

      {/* Project Name */}
      <Form.Group className="mb-3">
        <Form.Label>Project Name *</Form.Label>
        <Form.Control
          type="text"
          {...formik.getFieldProps("projectName")}
          isInvalid={formik.touched.projectName && formik.errors.projectName}
        />
        <Form.Control.Feedback type="invalid">
          {formik.errors.projectName}
        </Form.Control.Feedback>
      </Form.Group>

      {/* Location */}
      <Form.Group className="mb-3">
        <Form.Label>Location *</Form.Label>
        <Form.Control
          type="text"
          {...formik.getFieldProps("location")}
          isInvalid={formik.touched.location && formik.errors.location}
        />
        <Form.Control.Feedback type="invalid">
          {formik.errors.location}
        </Form.Control.Feedback>
      </Form.Group>

      {/* Budget */}
      <Form.Group className="mb-3">
        <Form.Label>Budget *</Form.Label>
        <Form.Control
          type="number"
          {...formik.getFieldProps("budget")}
          isInvalid={formik.touched.budget && formik.errors.budget}
        />
        <Form.Control.Feedback type="invalid">
          {formik.errors.budget}
        </Form.Control.Feedback>
      </Form.Group>

      {/* Status Dropdown - Decoupled from Formik */}
      <Form.Group className="mb-3">
        <Form.Label>Status</Form.Label>
        <Form.Select
          value={status} // Managed by local state, not Formik
          onChange={(e) => setStatus(e.target.value)} // Update local state
          disabled={!editingProject} // Locked for new projects
        >
          <option value="new">New</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="on-hold">On Hold</option>
          <option value="cancelled">Cancelled</option>
        </Form.Select>
      </Form.Group>

      {/* Notes */}
      <Form.Group className="mb-3">
        <Form.Label>Notes</Form.Label>
        <Form.Control
          as="textarea"
          rows={3}
          {...formik.getFieldProps("notes")}
        />
      </Form.Group>

      {/* Buttons */}
      <div className="d-flex justify-content-end">
        <button type="submit" className="btn btn-primary">
          Next
        </button>
      </div>
    </Form>
  );
};

export default ProjectDetails;
