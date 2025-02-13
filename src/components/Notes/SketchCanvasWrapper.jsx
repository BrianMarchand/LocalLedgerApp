// File: src/components/Notes/SketchCanvasWrapper.jsx
import React, { forwardRef } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";

const SketchCanvasWrapper = forwardRef((props, ref) => {
  return <ReactSketchCanvas ref={ref} {...props} />;
});

export default SketchCanvasWrapper;
