// File: src/components/Notes/ShoppingList.jsx
import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import {
  doc,
  collection,
  getDocs,
  updateDoc,
  addDoc,
  deleteDoc,
} from "firebase/firestore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { db } from "@config";
import Swal from "sweetalert2";
import "../../styles/components/notesModal.css";

const ShoppingList = forwardRef(
  ({ projectId, onChange, onAutoSaving }, ref) => {
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState("");
    const autoSaveTimerRef = useRef(null);

    // Function to trigger auto-save after a debounce delay.
    const triggerAutoSave = () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        console.log("ShoppingList auto-save timer fired");
        autoSaveShoppingList();
      }, 3000);
    };

    // Auto-save function: simulate a delay so the UI spinner can be seen,
    // then reset the unsaved flag.
    const autoSaveShoppingList = async () => {
      if (typeof onAutoSaving === "function") {
        onAutoSaving(true);
      }
      // Simulate a delay (e.g., 1500ms) to mimic saving.
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (typeof onChange === "function") {
        onChange(false);
      }
      if (typeof onAutoSaving === "function") {
        onAutoSaving(false);
      }
    };

    // Fetch items when projectId changes.
    useEffect(() => {
      if (!projectId) return;
      const fetchItems = async () => {
        try {
          const querySnapshot = await getDocs(
            collection(db, `projects/${projectId}/shoppingList`)
          );
          const list = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          const sortedList = list.sort((a, b) => a.order - b.order);
          setItems(sortedList);
          onChange && onChange(false);
        } catch (error) {
          console.error("Error fetching checklist items:", error);
        }
      };
      fetchItems();
    }, [projectId]);

    const handleAddItem = async () => {
      if (!newItem.trim()) return;
      const newItemData = { text: newItem, completed: false, order: 0 };
      try {
        const docRef = await addDoc(
          collection(db, `projects/${projectId}/shoppingList`),
          newItemData
        );
        setItems((prev) => [
          { id: docRef.id, ...newItemData },
          ...prev.map((item, index) => ({ ...item, order: index + 1 })),
        ]);
        setNewItem("");
        onChange && onChange(true);
        triggerAutoSave();
      } catch (error) {
        console.error("Error adding new checklist item:", error);
      }
    };

    const deleteItem = async (id) => {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "This item will be permanently deleted!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Delete",
      });
      if (result.isConfirmed) {
        try {
          await deleteDoc(doc(db, `projects/${projectId}/shoppingList`, id));
          setItems((prev) => prev.filter((item) => item.id !== id));
          onChange && onChange(true);
          triggerAutoSave();
        } catch (error) {
          console.error("Error deleting checklist item:", error);
        }
      }
    };

    const toggleComplete = async (id, isComplete) => {
      try {
        await updateDoc(doc(db, `projects/${projectId}/shoppingList`, id), {
          completed: isComplete,
        });
        setItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, completed: isComplete } : item
          )
        );
        onChange && onChange(true);
        triggerAutoSave();
      } catch (error) {
        console.error("Error toggling checklist item:", error);
      }
    };

    const handleDragEnd = async (result) => {
      if (!result.destination) return;
      const updatedItems = Array.from(items);
      const [movedItem] = updatedItems.splice(result.source.index, 1);
      updatedItems.splice(result.destination.index, 0, movedItem);
      setItems(updatedItems);
      try {
        await Promise.all(
          updatedItems.map((item, index) =>
            updateDoc(doc(db, `projects/${projectId}/shoppingList`, item.id), {
              order: index,
            })
          )
        );
        onChange && onChange(true);
        triggerAutoSave();
      } catch (error) {
        console.error("Error updating checklist order:", error);
      }
    };

    const editItemText = async (id, text) => {
      try {
        await updateDoc(doc(db, `projects/${projectId}/shoppingList`, id), {
          text,
        });
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, text } : item))
        );
        onChange && onChange(true);
        triggerAutoSave();
      } catch (error) {
        console.error("Error editing checklist item:", error);
      }
    };

    useImperativeHandle(ref, () => ({
      saveNote: async () => {
        // Clear any pending auto-save timer.
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }
        // For manual save, show a confirmation alert.
        await Swal.fire({
          icon: "success",
          title: "Shopping List Saved",
          text: "Your shopping list has been saved successfully.",
        });
        onChange && onChange(false);
      },
    }));

    return (
      <div className="checklist-container">
        {!projectId ? (
          <div className="alert alert-info">
            <i className="bi bi-info-circle mx-2"></i>
            <span>
              Please select a project from the dropdown above to edit the
              checklist.
            </span>
          </div>
        ) : (
          <>
            <h5>Checklist</h5>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                padding: "10px",
                marginBottom: "5px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                backgroundColor: "#f0f0f0",
              }}
            >
              <input
                type="text"
                className="form-control"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Add new item..."
                onKeyPress={(e) => e.key === "Enter" && handleAddItem()}
                style={{
                  border: "none",
                  background: "transparent",
                  width: "100%",
                }}
              />
            </div>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="checklist">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    style={{ maxHeight: "400px", overflowY: "auto" }}
                  >
                    {items.map((item, index) => (
                      <Draggable
                        key={`${item.id}-${index}`}
                        draggableId={`${item.id}-${index}`}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{
                              ...provided.draggableProps.style,
                              display: "flex",
                              alignItems: "center",
                              padding: "10px",
                              marginBottom: "5px",
                              backgroundColor: item.completed
                                ? "#d3f9d8"
                                : "#f0f0f0",
                              border: "1px solid #ddd",
                              borderRadius: "5px",
                              textDecoration: item.completed
                                ? "line-through"
                                : "none",
                            }}
                          >
                            <span
                              {...provided.dragHandleProps}
                              style={{ cursor: "grab", marginRight: "10px" }}
                            >
                              <i className="bi bi-grip-vertical"></i>
                            </span>
                            <input
                              type="checkbox"
                              checked={item.completed}
                              onChange={() =>
                                toggleComplete(item.id, !item.completed)
                              }
                              style={{ marginRight: "10px" }}
                            />
                            <input
                              type="text"
                              value={item.text}
                              onChange={(e) =>
                                editItemText(item.id, e.target.value)
                              }
                              onBlur={(e) =>
                                editItemText(item.id, e.target.value.trim())
                              }
                              style={{
                                border: "none",
                                background: "transparent",
                                width: "100%",
                                cursor: "text",
                              }}
                            />
                            <button
                              onClick={() => deleteItem(item.id)}
                              style={{
                                marginLeft: "10px",
                                background: "transparent",
                                border: "none",
                                color: "red",
                                cursor: "pointer",
                              }}
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </>
        )}
      </div>
    );
  }
);

export default ShoppingList;
