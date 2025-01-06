// File: src/components/Notes/FreeformNote.jsx

import React, { useRef, useState, useEffect } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import "./NotesStyles.css"; // Import styles
import { db } from "../../firebaseConfig"; // Firestore integration
import { doc, getDoc, setDoc } from "firebase/firestore";

const FreeformNote = ({ projectId }) => {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);

  // Load existing note from Firestore
  useEffect(() => {
    const loadNote = async () => {
      setLoading(true);
      const noteDoc = await getDoc(
        doc(db, "projects", projectId, "notes", "freeform"),
      );
      if (noteDoc.exists()) {
        canvasRef.current.loadPaths(noteDoc.data().paths);
      }
      setLoading(false);
    };

    if (projectId) {
      loadNote();
    }
  }, [projectId]);

  // Save note to Firestore
  const handleSave = async () => {
    const paths = await canvasRef.current.exportPaths(); // Get canvas data
    await setDoc(doc(db, "projects", projectId, "notes", "freeform"), {
      paths,
    });
    alert("Note saved successfully!");
  };

  // Clear the canvas
  const handleClear = () => {
    canvasRef.current.clearCanvas();
  };

  return (
    <div className="freeform-note-container">
      {loading && <p>Loading...</p>}
      <ReactSketchCanvas
        ref={canvasRef}
        style={{ border: "1px solid #ccc", borderRadius: "8px" }}
        strokeWidth={2}
        strokeColor="black"
        canvasColor="#fff"
        width="100%"
        height="400px"
      />
      <div className="note-actions">
        <button onClick={handleSave}>Save</button>
        <button onClick={handleClear}>Clear</button>
      </div>
    </div>
  );
};

export default FreeformNote;
