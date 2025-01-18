import React, { useEffect, useState, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@config";
import Swal from "sweetalert2";
import "../../styles/components/ProjectCalendar.css";

const ProjectCalendar = ({ projectId }) => {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState("dayGridFourWeek"); // ✅ Default to 3-week view
  const calendarRef = useRef(null); // ✅ Create a reference to the calendar instance

  useEffect(() => {
    const fetchProjectData = async () => {
      try {
        const docRef = doc(db, "projects", projectId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const project = docSnap.data();
          const newEvents = [];

          console.log("📌 Retrieved Project Data:", project); // Debugging

          // ✅ Add Estimated Completion Date
          if (project.estimatedCompletionDate) {
            newEvents.push({
              title: "Estimated Completion 🏁",
              start: new Date(project.estimatedCompletionDate),
              color: "#ff6347", // Tomato red
            });
          }

          // ✅ Add Transactions to Calendar (Fix Firestore Timestamp Issue)
          if (project.transactions && Array.isArray(project.transactions)) {
            project.transactions.forEach((transaction) => {
              if (!transaction.date) {
                console.warn(
                  "🚨 Skipping transaction without date:",
                  transaction,
                );
                return; // Skip transactions without a date
              }

              // 🔥 Fix Firestore Timestamp conversion
              // 🔥 Fix Firestore Timestamp conversion and force time to midnight
              let transactionDate;
              if (transaction.date.toDate) {
                transactionDate = transaction.date.toDate(); // Convert Firestore Timestamp to Date
              } else {
                transactionDate = new Date(transaction.date); // Already a Date format
              }

              // ✅ Force all events to appear at 00:00 (midnight)
              transactionDate.setHours(0, 0, 0, 0);

              if (isNaN(transactionDate)) {
                console.warn("🚨 Invalid transaction date:", transaction);
                return; // Skip if the date is invalid
              }

              let color = "#6c757d"; // Default gray
              let icon = "⚙️"; // Default icon

              switch (transaction.category) {
                case "Client Payment":
                  color = "#28a745"; // Green
                  icon = "💰";
                  break;
                case "Labour":
                  color = "#007bff"; // Blue
                  icon = "🏗️";
                  break;
                case "Materials":
                  color = "#ffc107"; // Yellow
                  icon = "🏠";
                  break;
                case "Miscellaneous":
                  color = "#6c757d"; // Gray
                  icon = "⚙️";
                  break;
                default:
                  break;
              }

              newEvents.push({
                title: `${icon} ${transaction.description || "Transaction"}`,
                start: transactionDate,
                color,
                extendedProps: transaction, // Store full transaction data
              });
            });

            console.log("✅ Transactions Added to Calendar:", newEvents); // Debugging
          } else {
            console.warn("⚠️ No transactions found for project:", projectId);
          }

          setEvents(newEvents);
        } else {
          console.warn("⚠️ Project not found:", projectId);
        }
      } catch (error) {
        console.error("Error fetching project data:", error);
      }
    };

    fetchProjectData();
  }, [projectId]);

  // ✅ Show Transaction Details on Click
  const handleEventClick = ({ event }) => {
    const { title, extendedProps } = event;

    if (title.includes("Estimated Completion")) {
      // ✅ Handle Estimated Completion Event
      Swal.fire({
        title: "Estimated Completion Date",
        html: `<strong>Completion Date:</strong> ${event.start.toLocaleDateString()}`,
        icon: "info",
      });
    } else if (extendedProps) {
      // ✅ Handle Transactions
      Swal.fire({
        title: title,
        html: `<strong>Amount:</strong> $${extendedProps.amount?.toLocaleString() || "N/A"}<br>
               <strong>Category:</strong> ${extendedProps.category || "N/A"}<br>
               <strong>Type:</strong> ${extendedProps.type || "N/A"}<br>
               <strong>Description:</strong> ${extendedProps.description || "No details"}`,
        icon: "info",
      });
    } else {
      console.warn("Event clicked, but missing expected data:", event);
    }
  };

  // ✅ Handle View Change (Now Works!)
  const handleViewChange = (e) => {
    const newView = e.target.value;
    setView(newView);

    if (calendarRef.current) {
      const calendarApi = calendarRef.current.getApi();
      calendarApi.changeView(newView); // ✅ This updates the view dynamically
    }
  };

  return (
    <div className="global-card h-100">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <i className="bi bi-calendar3 me-2"></i>Project Calendar
        </h5>
        {/* ✅ View Selector */}
        <select
          className="form-select form-select-sm w-auto"
          value={view}
          onChange={handleViewChange} // ✅ Now properly updates the view
        >
          <option value="dayGridFourWeek">4 Weeks</option>
          <option value="dayGridMonth">Full Month</option>
        </select>
      </div>
      <FullCalendar
        ref={calendarRef} // ✅ Attach the ref to the calendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView={view}
        views={{
          dayGridFourWeek: { type: "dayGrid", duration: { weeks: 4 } }, // ✅ Custom 3-week view
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
