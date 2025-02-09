import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
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

const ShoppingList = forwardRef(({ projectId, onChange }, ref) => {
  const [items, setItems] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [newItem, setNewItem] = useState("");

  // Fetch items when projectId changes
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
        if (onChange) onChange(false); // Reset unsaved changes on initial load
      } catch (error) {
        console.error("Error fetching checklist items:", error);
      }
    };

    fetchItems();
  }, [projectId, onChange]);

  const handleAddItem = async () => {
    if (!newItem.trim()) return;
    const newItemData = {
      text: newItem,
      completed: false,
      order: 0,
    };
    try {
      const docRef = await addDoc(
        collection(db, `projects/${projectId}/shoppingList`),
        newItemData
      );
      setItems((prevItems) => {
        const updatedItems = [
          { id: docRef.id, ...newItemData },
          ...prevItems.map((item, index) => ({
            ...item,
            order: index + 1,
          })),
        ];
        return updatedItems;
      });
      setNewItem("");
      if (onChange) onChange(true);
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
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Delete",
    });
    if (result.isConfirmed) {
      try {
        await deleteDoc(doc(db, `projects/${projectId}/shoppingList`, id));
        setItems((prevItems) => prevItems.filter((item) => item.id !== id));
        Swal.fire("Deleted!", "Your item has been deleted.", "success");
        if (onChange) onChange(true);
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
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === id ? { ...item, completed: isComplete } : item
        )
      );
      if (onChange) onChange(true);
    } catch (error) {
      console.error("Error toggling checklist item:", error);
    }
  };

  const handleDragEnd = async (result) => {
    setIsDragging(false);
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
      if (onChange) onChange(true);
    } catch (error) {
      console.error("Error updating checklist order:", error);
    }
  };

  const editItemText = async (id, text) => {
    try {
      await updateDoc(doc(db, `projects/${projectId}/shoppingList`, id), {
        text,
      });
      setItems((prevItems) =>
        prevItems.map((item) => (item.id === id ? { ...item, text } : item))
      );
      if (onChange) onChange(true);
    } catch (error) {
      console.error("Error editing checklist item:", error);
    }
  };

  // Expose a saveNote method so the parent can trigger a save.
  // For this component, we assume that any local changes have already been written to Firestore,
  // so we simply show a confirmation message.
  useImperativeHandle(ref, () => ({
    saveNote: async () => {
      await Swal.fire({
        target: document.body,
        icon: "success",
        title: "Shopping List Saved",
        text: "Your shopping list has been saved successfully.",
      });
      if (onChange) onChange(false); // Reset unsaved changes flag after "saving"
    },
  }));

  return (
    <div className="checklist-container">
      {!projectId ? (
        <div className="alert alert-info">
          Please select a project from the dropdown above to edit the checklist.
        </div>
      ) : (
        <>
          <h5>Checklist</h5>
          {/* Input field to add a new item */}
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
            onDragEnd={handleDragEnd}
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
                          {/* Drag Handle */}
                          <span
                            {...provided.dragHandleProps}
                            style={{ cursor: "grab", marginRight: "10px" }}
                          >
                            <i className="bi bi-grip-vertical"></i>
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
                            onChange={(e) =>
                              editItemText(item.id, e.target.value)
                            }
                            onBlur={(e) =>
                              editItemText(item.id, e.target.value.trim())
                            }
                            disabled={isDragging}
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
});

export default ShoppingList;
