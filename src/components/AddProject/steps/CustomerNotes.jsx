import React from "react";
import { Form } from "react-bootstrap";
import { useFormik } from "formik";
import { customerNotesSchema } from "../utils/validationSchema.js";

const CustomerNotes = ({ formData, updateFormData, prevStep, handleSave }) => {
  const formik = useFormik({
    initialValues: {
      customerNotes: formData.customerNotes,
    },
    validationSchema: customerNotesSchema,
    onSubmit: (values) => {
      updateFormData("customerNotes", values.customerNotes);
      handleSave(); // Final save logic
    },
  });

  return (
    <Form onSubmit={formik.handleSubmit}>
      <h5>Customer Notes</h5>
      <Form.Group className="mb-3">
        <Form.Label>Notes</Form.Label>
        <Form.Control
          as="textarea"
          rows={6}
          {...formik.getFieldProps("customerNotes")}
        />
      </Form.Group>

      <div className="d-flex justify-content-between">
        <button type="button" className="btn btn-secondary" onClick={prevStep}>
          Back
        </button>
        <button type="submit" className="btn btn-primary">
          Save
        </button>
      </div>
    </Form>
  );
};

export default CustomerNotes;
