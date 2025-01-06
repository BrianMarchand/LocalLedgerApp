import React, { useRef, useState, useEffect } from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import "./NotesStyles.css"; // Import styles
import { db } from "../../firebaseConfig"; // Firestore integration
import { doc, getDoc, setDoc } from "firebase/firestore";

const FreeformNote = ({ projectId, showNotes }) => {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);

  // Load existing note from Firestore
  useEffect(() => {
    const loadNote = async () => {
      setLoading(true);
      try {
        const noteDoc = await getDoc(
          doc(db, "projects", projectId, "notes", "freeform"),
        );
        if (noteDoc.exists()) {
          canvasRef.current.loadPaths(noteDoc.data().paths); // Load paths
        }
      } catch (error) {
        console.error("Error loading note:", error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadNote();
    }
  }, [projectId]);

  // Save note to Firestore
  const handleSave = async () => {
    try {
      const paths = await canvasRef.current.exportPaths(); // Save paths
      await setDoc(doc(db, "projects", projectId, "notes", "freeform"), {
        paths,
      });
      console.log("Note saved!");
    } catch (error) {
      console.error("Error saving note:", error);
    }
  };

  // Clear the canvas when modal closes or on demand
  const clearCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
    }
  };

  useEffect(() => {
    if (!showNotes) {
      clearCanvas(); // Clear canvas when modal closes
    }
  }, [showNotes]);

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
        <button className="btn btn-primary" onClick={handleSave}>
          Save
        </button>
        <button className="btn btn-secondary" onClick={clearCanvas}>
          Clear
        </button>
      </div>
    </div>
  );
};

export default FreeformNote;
