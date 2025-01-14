import React, { useState, useEffect } from "react";
import {
  doc,
  collection,
  getDocs,
  updateDoc,
  addDoc,
} from "firebase/firestore";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, X } from "react-bootstrap-icons";
import { db } from "@config";
import Swal from "sweetalert2";

const EditableChecklist = ({ projectId }) => {
  const [items, setItems] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [newItem, setNewItem] = useState(""); // Always-available input field

  // Fetch items
  useEffect(() => {
    const fetchItems = async () => {
      const querySnapshot = await getDocs(
        collection(db, `projects/${projectId}/shoppingList`),
      );
      const list = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const sortedList = list.sort((a, b) => a.order - b.order);
      setItems(sortedList);
    };

    fetchItems();
  }, [projectId]);

  // Add a new item right below the input field
  const handleAddItem = async () => {
    if (!newItem.trim()) return;

    const newItemData = {
      text: newItem,
      completed: false,
      order: 0, // Add at the top with order 0
    };

    // Add to Firestore
    const docRef = await addDoc(
      collection(db, `projects/${projectId}/shoppingList`),
      newItemData,
    );

    // Update local state (add at the top)
    setItems((prevItems) => {
      const updatedItems = [
        { id: docRef.id, ...newItemData },
        ...prevItems.map((item, index) => ({
          ...item,
          order: index + 1, // Shift orders down
        })),
      ];
      return updatedItems;
    });

    setNewItem(""); // Clear input field
  };

  // Handle delete
  const deleteItem = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This item will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete",
    });

    if (result.isConfirmed) {
      await deleteDoc(doc(db, `projects/${projectId}/shoppingList`, id));
      setItems((prevItems) => prevItems.filter((item) => item.id !== id));
      Swal.fire("Deleted!", "Your item has been deleted.", "success");
    }
  };

  // Toggle Complete
  const toggleComplete = async (id, isComplete) => {
    await updateDoc(doc(db, `projects/${projectId}/shoppingList`, id), {
      completed: isComplete,
    });

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.id === id ? { ...item, completed: isComplete } : item,
      ),
    );
  };

  // Handle drag-and-drop
  const handleDragEnd = async (result) => {
    setIsDragging(false); // Reset dragging state

    if (!result.destination) return;

    const updatedItems = Array.from(items);
    const [movedItem] = updatedItems.splice(result.source.index, 1);
    updatedItems.splice(result.destination.index, 0, movedItem);

    setItems(updatedItems);

    await Promise.all(
      updatedItems.map((item, index) =>
        updateDoc(doc(db, `projects/${projectId}/shoppingList`, item.id), {
          order: index,
        }),
      ),
    );
  };

  // Edit item text
  const editItemText = async (id, text) => {
    await updateDoc(doc(db, `projects/${projectId}/shoppingList`, id), {
      text,
    });

    setItems((prevItems) =>
      prevItems.map((item) => (item.id === id ? { ...item, text } : item)),
    );
  };

  return (
    <div className="checklist-container">
      <h5>Checklist</h5>

      {/* Always-available input at the top */}
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

      {/* Drag-and-Drop List */}
      <DragDropContext
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd} // Reset drag state globally
      >
        <Droppable droppableId="checklist">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
              {items.map((item, index) => (
                <Draggable
                  key={item.id}
                  draggableId={item.id.toString()}
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
                        backgroundColor: item.completed ? "#d3f9d8" : "#f0f0f0",
                        border: "1px solid #ddd",
                        borderRadius: "5px",
                        textDecoration: item.completed
                          ? "line-through"
                          : "none",
                      }}
                    >
                      {/* Drag Handle */}
                      <span
                        {...provided.dragHandleProps}
                        style={{ cursor: "grab", marginRight: "10px" }}
                      >
                        <GripVertical />
                      </span>

                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() =>
                          toggleComplete(item.id, !item.completed)
                        }
                        style={{ marginRight: "10px" }}
                      />

                      {/* Editable Text */}
                      <input
                        type="text"
                        value={item.text}
                        onChange={(e) => editItemText(item.id, e.target.value)}
                        onBlur={(e) =>
                          editItemText(item.id, e.target.value.trim())
                        }
                        disabled={isDragging} // Disable input while dragging
                        style={{
                          border: "none",
                          background: "transparent",
                          width: "100%",
                          cursor: isDragging ? "default" : "text",
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
                        <X size={20} /> {/* Set icon size */}
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
    </div>
  );
};

export default EditableChecklist;
