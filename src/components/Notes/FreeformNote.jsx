// File: src/components/Notes/FreeformNote.jsx
import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import SketchCanvasWrapper from "./SketchCanvasWrapper";
import "../../styles/components/notesModal.css";
import { db } from "@config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Swal from "sweetalert2";

const FreeformNote = forwardRef(
  ({ projectId, onChange, onAutoSaving }, ref) => {
    const canvasRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [initialPaths, setInitialPaths] = useState("[]");
    const [ignoreStrokeEvents, setIgnoreStrokeEvents] = useState(false);

    // Ref to store the auto-save timer.
    const autoSaveTimerRef = useRef(null);

    if (!projectId) {
      return (
        <div className="alert alert-info">
          <i className="bi bi-info-circle mx-2"></i>
          <span>
            Please select a project from the dropdown above to view and edit
            freeform notes.
          </span>
        </div>
      );
    }

    // Load the saved note when projectId changes.
    useEffect(() => {
      const loadNote = async () => {
        setLoading(true);
        setIgnoreStrokeEvents(true);
        try {
          const noteRef = doc(db, "projects", projectId, "notes", "freeform");
          const noteDoc = await getDoc(noteRef);
          if (noteDoc.exists() && canvasRef.current) {
            const storedPaths = noteDoc.data().paths;
            await canvasRef.current.loadPaths(storedPaths);
            const loadedPaths = await canvasRef.current.exportPaths();
            setInitialPaths(loadedPaths);
            if (typeof onChange === "function") {
              onChange(false);
            }
          }
        } catch (error) {
          console.error("Error loading note:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "There was an error loading your note.",
          });
        } finally {
          setTimeout(() => {
            setIgnoreStrokeEvents(false);
          }, 600);
          setLoading(false);
        }
      };
      loadNote();
    }, [projectId]);

    // Check if the canvas has changed.
    const checkCanvasChanges = async () => {
      if (!canvasRef.current || loading || ignoreStrokeEvents) return;
      try {
        const currentPaths = await canvasRef.current.exportPaths();
        if (currentPaths !== initialPaths && typeof onChange === "function") {
          onChange(true);
        }
      } catch (error) {
        console.error("Error checking canvas changes:", error);
      }
    };

    // Debounce auto-save using the onChange event.
    const handleCanvasChange = async () => {
      console.log("handleCanvasChange triggered");
      await checkCanvasChanges();
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        console.log("Auto-save timer fired from onChange");
        saveNoteInternal(true);
      }, 3000);
    };

    // (Optional) You can also keep onStrokeEnd for other purposes.
    const handleStrokeEnd = async () => {
      console.log("handleStrokeEnd triggered");
      // We clear and reset the timer here too.
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        console.log("Auto-save timer fired from onStrokeEnd");
        saveNoteInternal(true);
      }, 3000);
    };

    const handleClear = () => {
      if (canvasRef.current) {
        canvasRef.current.clearCanvas();
        if (typeof onChange === "function") {
          onChange(true);
        }
      }
    };

    // Central save function. isAutoSave indicates if this is an auto-save.
    const saveNoteInternal = async (isAutoSave = false) => {
      if (!canvasRef.current) return;
      try {
        if (isAutoSave && typeof onAutoSaving === "function") {
          onAutoSaving(true);
          // (Optional) simulate a delay if needed
          // await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        let paths;
        try {
          paths = await canvasRef.current.exportPaths();
        } catch (error) {
          if (error.message && error.message.includes("No stroke found")) {
            paths = "[]";
          } else {
            throw error;
          }
        }
        await setDoc(
          doc(db, "projects", projectId, "notes", "freeform"),
          { paths },
          { merge: true }
        );
        let savedPaths;
        try {
          savedPaths = await canvasRef.current.exportPaths();
        } catch (error) {
          if (error.message && error.message.includes("No stroke found")) {
            savedPaths = "[]";
          } else {
            throw error;
          }
        }
        setInitialPaths(savedPaths);
        if (typeof onChange === "function") {
          onChange(false);
        }
        // For manual save, trigger the Swal message and wait for it to close.
        if (!isAutoSave) {
          await Swal.fire({
            icon: "success",
            title: "Note Saved",
            text: "Your freeform note has been saved successfully.",
          });
        }
        return savedPaths;
      } catch (error) {
        console.error("Error saving note:", error);
        if (!isAutoSave) {
          await Swal.fire({
            icon: "error",
            title: "Save Failed",
            text: "An error occurred while saving your note.",
          });
        }
        throw error;
      } finally {
        if (isAutoSave && typeof onAutoSaving === "function") {
          onAutoSaving(false);
        }
      }
    };

    useImperativeHandle(ref, () => ({
      exportPaths: async () =>
        canvasRef.current ? await canvasRef.current.exportPaths() : null,
      loadPaths: async (paths) =>
        canvasRef.current ? await canvasRef.current.loadPaths(paths) : null,
      clearCanvas: () => {
        if (canvasRef.current) canvasRef.current.clearCanvas();
      },
      // When manually saving, we clear any pending auto-save timer and call saveNoteInternal with isAutoSave false.
      saveNote: async () => {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }
        return await saveNoteInternal(false);
      },
    }));

    return (
      <div style={{ width: "100%", height: "400px", position: "relative" }}>
        <SketchCanvasWrapper
          ref={canvasRef}
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            width: "100%",
          }}
          strokeWidth={2}
          strokeColor="black"
          canvasColor="#fff"
          width="100%"
          height="400px"
          onStrokeEnd={handleStrokeEnd}
          onChange={handleCanvasChange}
          tabIndex="0"
        />
        {loading && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "400px",
              background: "rgba(255,255,255,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              transition: "opacity 0.3s ease",
            }}
          >
            <p style={{ margin: 0 }}>Loading...</p>
          </div>
        )}
      </div>
    );
  }
);

export default FreeformNote;
