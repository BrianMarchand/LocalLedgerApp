import React, { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { doc, onSnapshot, collection } from "firebase/firestore";
import { db } from "@config";
import Swal from "sweetalert2";
import "../../styles/components/ProjectCalendar.css";

// Helper: Given a Firestore Timestamp or Date input, return a local "YYYY-MM-DD" string.
const toLocalDateString = (dateInput) => {
  let d;
  if (dateInput?.toDate) {
    d = dateInput.toDate();
  } else {
    d = new Date(dateInput);
  }
  // Create a new Date using local year, month, and day.
  const localDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return localDate.toISOString().split("T")[0];
};

const DEBUG = process.env.NODE_ENV === "development";

const ProjectCalendar = ({ projectId }) => {
  const [events, setEvents] = useState([]);
  // Use a custom 3‑week view (adjust as needed)
  const [view, setView] = useState("dayGridThreeWeek");
  const calendarRef = useRef(null);

  // Local state for events from the project document and transactions.
  const [projectEvents, setProjectEvents] = useState([]);
  const [transactionEvents, setTransactionEvents] = useState([]);

  // Listen to the project document for project dates.
  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "projects", projectId),
      (docSnap) => {
        if (docSnap.exists()) {
          const project = docSnap.data();
          const eventsFromProject = [];

          if (DEBUG) {
            console.log("📌 Retrieved Project Data:", project);
          }

          // Add project start date event using createdAt.
          if (project.createdAt) {
            const startDateString = toLocalDateString(project.createdAt);
            eventsFromProject.push({
              title: "Project Start 🚀",
              start: startDateString,
              color: "#17a2b8",
              allDay: true,
            });
          }

          // Add Estimated Completion Date event.
          if (project.estimatedCompletionDate) {
            const compDateString = toLocalDateString(project.estimatedCompletionDate);
            eventsFromProject.push({
              title: "Estimated Completion 🏁",
              start: compDateString,
              color: "#ff6347",
              allDay: true,
            });
          }

          setProjectEvents(eventsFromProject);
        } else {
          if (DEBUG) {
            console.warn("⚠️ Project not found:", projectId);
          }
        }
      },
      (error) => {
        console.error("Error fetching project data:", error);
      }
    );
    return () => unsubscribe();
  }, [projectId]);

  // Listen to the transactions subcollection for events.
  useEffect(() => {
    const transactionsRef = collection(db, "projects", projectId, "transactions");
    const unsubscribe = onSnapshot(
      transactionsRef,
      (snapshot) => {
        const eventsFromTransactions = [];
        snapshot.docs.forEach((docSnap) => {
          const transaction = docSnap.data();
          if (!transaction.date) {
            if (DEBUG) {
              console.warn("🚨 Skipping transaction without date:", transaction);
            }
            return;
          }
          // If the stored date is a Timestamp, convert it; if it’s a string, use it.
          const dateString =
            typeof transaction.date === "string"
              ? transaction.date
              : toLocalDateString(transaction.date);

          let color = "#6c757d"; // Default gray
          let icon = "⚙️";       // Default icon
          switch (transaction.category) {
            case "Client Payment":
              color = "#28a745";
              icon = "💰";
              break;
            case "Labour":
              color = "#007bff";
              icon = "🏗️";
              break;
            case "Materials":
              color = "#ffc107";
              icon = "🏠";
              break;
            case "Miscellaneous":
              color = "#6c757d";
              icon = "⚙️";
              break;
            default:
              break;
          }

          eventsFromTransactions.push({
            title: `${icon} ${transaction.description || "Transaction"}`,
            start: dateString,
            color,
            extendedProps: transaction,
            allDay: true,
          });
        });

        if (DEBUG) {
          console.log("✅ Transactions Added to Calendar:", eventsFromTransactions);
        }
        setTransactionEvents(eventsFromTransactions);
      },
      (error) => {
        console.error("Error fetching transactions:", error);
      }
    );
    return () => unsubscribe();
  }, [projectId]);

  // Combine project and transaction events.
  useEffect(() => {
    setEvents([...projectEvents, ...transactionEvents]);
  }, [projectEvents, transactionEvents]);

  // Event click handler.
  const handleEventClick = ({ event }) => {
    const { title, extendedProps } = event;
    if (title.includes("Estimated Completion") || title.includes("Project Start")) {
      Swal.fire({
        title,
        html: `<strong>Date:</strong> ${event.start}`,
        icon: "info",
      });
    } else if (extendedProps) {
      Swal.fire({
        title,
        html: `<strong>Amount:</strong> $${extendedProps.amount?.toLocaleString() || "N/A"}<br>
               <strong>Category:</strong> ${extendedProps.category || "N/A"}<br>
               <strong>Type:</strong> ${extendedProps.type || "N/A"}<br>
               <strong>Description:</strong> ${extendedProps.description || "No details"}`,
        icon: "info",
      });
    } else {
      if (DEBUG) {
        console.warn("Event clicked, but missing expected data:", event);
      }
    }
  };

  const handleViewChange = (e) => {
    const newView = e.target.value;
    setView(newView);
    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(newView);
    }
  };

  return (
    <div className="global-card h-100">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="bi bi-calendar3 me-2"></i>Project Calendar
        </h5>
        <select
          className="form-select form-select-sm w-auto"
          value={view}
          onChange={handleViewChange}
          aria-label="Select calendar view"
        >
          <option value="dayGridThreeWeek">3 Weeks</option>
          <option value="dayGridMonth">Full Month</option>
        </select>
      </div>
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView={view}
        views={{
          dayGridThreeWeek: { type: "dayGrid", duration: { weeks: 3 } },
        }}
        events={events}
        eventClick={handleEventClick}
        height="auto"
        contentHeight={400}
        aspectRatio={1.8}
      />
    </div>
  );
};

export default ProjectCalendar;