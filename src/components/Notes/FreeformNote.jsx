import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { ReactSketchCanvas } from "react-sketch-canvas";
import "./NotesStyles.css";
import { db } from "@config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Swal from "sweetalert2";

const FreeformNote = forwardRef(({ projectId, showNotes, onChange }, ref) => {
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(false);

  // When the projectId changes, clear the canvas then load the note for that project
  useEffect(() => {
    const loadNote = async () => {
      setLoading(true);
      try {
        if (canvasRef.current) {
          // Clear previous strokes so notes don't merge across projects
          canvasRef.current.clearCanvas();
          console.log("Canvas cleared due to project change");
        }
        const noteRef = doc(db, "projects", projectId, "notes", "freeform");
        const noteDoc = await getDoc(noteRef);
        if (canvasRef.current && noteDoc.exists()) {
          canvasRef.current.loadPaths(noteDoc.data().paths);
          console.log("Loaded note for project:", projectId);
          if (onChange) onChange(false); // No unsaved changes immediately after loading
        } else {
          if (onChange) onChange(false);
          console.log("No saved note for project:", projectId);
        }
      } catch (error) {
        console.error("Error loading note:", error);
        await Swal.fire({
          target: document.body,
          icon: "error",
          title: "Error",
          text: "There was an error loading your note.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      loadNote();
    }
  }, [projectId, onChange]);

  // Expose the saveNote method so the parent can trigger saving
  const saveNote = async () => {
    try {
      const paths = await canvasRef.current.exportPaths();
      await setDoc(doc(db, "projects", projectId, "notes", "freeform"), {
        paths,
      });
      console.log("Note saved for project:", projectId);
      if (onChange) onChange(false); // Reset unsaved changes flag after saving
      await Swal.fire({
        target: document.body,
        icon: "success",
        title: "Note Saved",
        text: "Your freeform note has been saved successfully.",
      });
    } catch (error) {
      console.error("Error saving note:", error);
      await Swal.fire({
        target: document.body,
        icon: "error",
        title: "Error",
        text: "There was an error saving your note.",
      });
    }
  };

  useImperativeHandle(ref, () => ({
    saveNote,
  }));

  const clearCanvas = () => {
    if (canvasRef.current) {
      canvasRef.current.clearCanvas();
      console.log("Canvas manually cleared");
      if (onChange) onChange(true); // Mark as unsaved since the user cleared the canvas
    }
  };

  // Extra handler: When user releases the mouse anywhere in the container,
  // mark unsaved changes as true.
  const handleMouseUp = () => {
    console.log("Mouse up detected, marking unsaved changes as true");
    if (onChange) onChange(true);
  };

  useEffect(() => {
    if (!showNotes && canvasRef.current) {
      clearCanvas();
    }
  }, [showNotes]);

  return (
    <div className="freeform-note-container" onMouseUp={handleMouseUp}>
      {!projectId ? (
        <div className="alert alert-info">
          Please select a project from the dropdown above to view and edit
          freeform notes.
        </div>
      ) : (
        <>
          {loading && <p>Loading...</p>}
          <ReactSketchCanvas
            ref={canvasRef}
            style={{ border: "1px solid #ccc", borderRadius: "8px" }}
            strokeWidth={2}
            strokeColor="black"
            canvasColor="#fff"
            width="100%"
            height="400px"
            onUpdatePaths={() => {
              console.log(
                "onUpdatePaths triggered, marking unsaved changes as true"
              );
              if (onChange) onChange(true);
            }}
            onEndStroke={() => {
              console.log(
                "onEndStroke triggered, marking unsaved changes as true"
              );
              if (onChange) onChange(true);
            }}
          />
          <div className="note-actions">
            {/* Remove internal Save button so that overall modal Save is used */}
            <button className="btn btn-secondary" onClick={clearCanvas}>
              Clear
            </button>
          </div>
        </>
      )}
    </div>
  );
});

export default FreeformNote;
