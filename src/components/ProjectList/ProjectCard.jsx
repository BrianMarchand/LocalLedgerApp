// File: src/pages/ProjectCard.jsx 

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDocs,
  collection,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@config";
import { calculateProgress } from "../../utils/progressUtils";
import { getBadgeClass, getBadgeLabel } from "../../utils/badgeUtils";
import Swal from "sweetalert2";
import { toastSuccess, toastError } from "../../utils/toastNotifications";
import { Draggable } from "@hello-pangea/dnd";

// ProjectCard Component: Displays individual project details with action buttons
const ProjectCard = ({
  project,
  index,
  fetchProjects,
  setEditingProject, // Passed from parent (ProjectList)
  setShowModal       // Passed from parent (ProjectList)
}) => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [progressData, setProgressData] = useState({
    percentage: 0,
    status: "new",
    income: 0,
    expenses: 0,
  });

  // Inline helper function for confirmation dialogs
  const confirmAction = async (action, title, text, successMessage) => {
    const result = await Swal.fire({
      title,
      text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, proceed!",
      cancelButtonText: "Cancel",
    });
    if (result.isConfirmed) {
      await action();
      toastSuccess(successMessage);
    }
  };

  // Inline helper to update project status
  const updateProjectStatus = async (newStatus) => {
    try {
      const docRef = doc(db, "projects", project.id);
      await updateDoc(docRef, {
        status: newStatus,
        statusDate: new Date(),
      });
      toastSuccess(`Project "${project.name}" updated to "${newStatus}"`);
      fetchProjects(); // Refresh projects list after update
    } catch (error) {
      toastError("Failed to update project status.");
    }
  };

  // Calculate total income from "Client Payment" transactions
  const totalIncome = transactions
    .filter((t) => t.category === "Client Payment")
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  // Fetch transactions for this project on mount or when project changes
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const transactionsRef = collection(
          db,
          `projects/${project.id}/transactions`
        );
        const transactionsSnapshot = await getDocs(transactionsRef);
        const transactionsData = transactionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTransactions(transactionsData);

        // Calculate progress based on budget and transactions
        const progress = calculateProgress(project.budget || 0, transactionsData);
        setProgressData(progress);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      }
    };

    fetchTransactions();
  }, [project.id, project.budget]);

  return (
    <Draggable key={project.id} draggableId={project.id} index={index}>
      {(provided) => (
        <div
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          ref={provided.innerRef}
          style={{
            ...provided.draggableProps.style,
            width: "400px",
            minWidth: "400px",
            maxWidth: "400px",
            flex: "1 1 auto",
            display: "flex",
          }}
        >
          <div
            className={`shadow-sm clickable-card ${project.status === "cancelled" ? "disabled" : ""}`}
            style={{
              flex: "1 1 calc(33.333% - 20px)",
              minWidth: "350px",
              maxWidth: "420px",
            }}
          >
            {/* HEADER */}
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>{project.name || "Unnamed Project"}</span>
              <div className={getBadgeClass(project.status)}>
                {getBadgeLabel(project.status)}
              </div>
            </div>

            {/* BODY */}
            <div className="card-body">
              <p className="mb-3">
                <i className="bi bi-geo-alt-fill text-primary me-2"></i>
                <strong>Location:</strong> {project.location || "N/A"}
              </p>
              <p className="mb-3">
                <i className="bi bi-calendar-event text-info me-2"></i>
                <strong>Estimated Completion: </strong>
                {project.estimatedCompletionDate
                  ? new Date(project.estimatedCompletionDate).toLocaleDateString()
                  : "Not Set"}
              </p>
              <p className="mb-3">
                <i className="bi bi-bank text-success me-2"></i>
                <strong>Budget:</strong> ${Number(project.budget)?.toLocaleString() || "0"}
              </p>
              <p className="mb-3">
                <i className="bi bi-list-check text-secondary me-2"></i>
                <strong>Transactions:</strong> {transactions.length}
              </p>
              <p className="mb-3">
                <i className="bi bi-card-text text-secondary me-2"></i>
                <strong>Status Note:</strong> {project.statusNote || "No notes."}
              </p>
              <i className="bi bi-graph-up-arrow text-secondary me-2 mb-3"></i>
              <strong>Progress:</strong>
              <div className="progress" style={{ height: "24px" }}>
                <div
                  className={`progress-bar ${
                    progressData.status === "completed"
                      ? "bg-success"
                      : progressData.status === "over-budget"
                      ? "bg-danger"
                      : "bg-primary"
                  }`}
                  role="progressbar"
                  style={{
                    width: `${progressData.percentage}%`,
                    fontSize: "11px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  aria-valuenow={progressData.percentage}
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  {`${progressData.percentage}%`}
                </div>
              </div>
            </div>

            {/* FOOTER BUTTON GROUP */}
            <div className="card-footer d-flex flex-wrap gap-2">
              {/* View Project */}
              <button
                className="btn btn-primary"
                title="View Project"
                onClick={() => navigate(`/project/${project.id}`)}
              >
                <i className="bi bi-eye"></i>
              </button>
              {/* Edit Project */}
              <button
                className="btn btn-secondary"
                title="Edit Project"
                onClick={() => {
                  setEditingProject(project);
                  setShowModal(true);
                }}
              >
                <i className="bi bi-pencil-square"></i>
              </button>
              {/* Reopen Project (if status is on-hold, cancelled, or completed) */}
              {["on-hold", "cancelled", "completed"].includes(project.status) && (
                <button
                  className="btn btn-warning d-flex align-items-center"
                  title="Reopen Project"
                  onClick={async () => {
                    try {
                      // Fetch transactions to check for a deposit
                      const transactionsRef = collection(db, `projects/${project.id}/transactions`);
                      const transactionsSnap = await getDocs(transactionsRef);
                      const transactionsData = transactionsSnap.docs.map((doc) => doc.data());
                      const hasDeposit = transactionsData.some(
                        (t) =>
                          t.category === "Client Payment" &&
                          t.description?.toLowerCase().includes("deposit")
                      );
                      const newStatus = hasDeposit ? "in-progress" : "new";
                      await confirmAction(
                        async () => {
                          const docRef = doc(db, "projects", project.id);
                          await updateDoc(docRef, {
                            status: newStatus,
                            statusDate: new Date(),
                          });
                          fetchProjects();
                        },
                        "Reopen Project?",
                        `Reopening "${project.name}". Status will be set to "${newStatus}".`,
                        `Project "${project.name}" reopened as "${newStatus}".`
                      );
                    } catch (error) {
                      console.error("Error reopening project:", error);
                      toastError("Failed to reopen project.");
                    }
                  }}
                >
                  <i className="bi bi-arrow-repeat"></i>
                </button>
              )}
              {/* If project is not on-hold, cancelled, or completed */}
              {!["on-hold", "cancelled", "completed"].includes(project.status) && (
                <>
                  <button
                    className="btn btn-warning"
                    title="Put on Hold"
                    onClick={() =>
                      confirmAction(
                        () => updateProjectStatus("on-hold"),
                        "Put Project on Hold?",
                        `Are you sure you want to put "${project.name}" on hold?`,
                        `Project "${project.name}" is now on hold.`
                      )
                    }
                  >
                    <i className="bi bi-pause-circle"></i>
                  </button>
                  {totalIncome >= project.budget && (
                    <button
                      className="btn btn-success"
                      title="Mark as Complete"
                      onClick={() =>
                        confirmAction(
                          () => updateProjectStatus("completed"),
                          "Mark as Complete?",
                          `Mark "${project.name}" as complete? This action cannot be undone.`,
                          `Project "${project.name}" marked as complete!`
                        )
                      }
                    >
                      <i className="bi bi-check-circle"></i>
                    </button>
                  )}
                  <button
                    className="btn btn-danger"
                    title="Cancel Project"
                    onClick={() =>
                      confirmAction(
                        () => updateProjectStatus("cancelled"),
                        "Cancel Project?",
                        `Are you sure you want to cancel "${project.name}"? This cannot be undone.`,
                        `Project "${project.name}" has been cancelled.`
                      )
                    }
                  >
                    <i className="bi bi-x-circle"></i>
                  </button>
                </>
              )}
              {/* Delete Project */}
              <button
                className="btn btn-danger"
                title="Delete Project"
                onClick={() =>
                  confirmAction(
                    async () => {
                      await deleteDoc(doc(db, "projects", project.id));
                      fetchProjects();
                    },
                    "Delete Project?",
                    `This will permanently delete the project "${project.name}".`,
                    `Project "${project.name}" has been deleted.`
                  )
                }
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default ProjectCard;