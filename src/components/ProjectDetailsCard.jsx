import React, { useEffect, useState } from "react";
import { calculateProgress } from "../utils/progressUtils"; // Import utility
import { getBadgeClass, getBadgeLabel } from "../utils/badgeUtils";
import { useProjects } from "../context/ProjectsContext";
import Swal from "sweetalert2";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebaseConfig";

const ProjectDetailsCard = ({ project, transactions = [] }) => {
  // **State to Hold Transactions After Validation**
  const [validTransactions, setValidTransactions] = useState([]);
  const [progressData, setProgressData] = useState({
    percentage: 0,
    status: "new",
    income: 0,
    expenses: 0,
  });

  const fetchProjectById = async (id) => {
    try {
      const docRef = doc(db, "projects", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const project = { id: docSnap.id, ...docSnap.data() };

        // Fetch transactions
        const transactionsRef = collection(db, `projects/${id}/transactions`);
        const transactionsSnapshot = await getDocs(transactionsRef);
        project.transactions = transactionsSnapshot.docs.map((txn) => ({
          id: txn.id,
          ...txn.data(),
        }));

        return project;
      } else {
        throw new Error("Project not found");
      }
    } catch (error) {
      console.error("Error fetching project by ID:", error);
      throw error;
    }
  };

  useEffect(() => {
    const fetchUpdatedTransactions = async () => {
      const transactionsRef = collection(
        db,
        `projects/${project.id}/transactions`,
      );
      const transactionsSnapshot = await getDocs(transactionsRef);

      const validTransactions = transactionsSnapshot.docs.map((txn) => ({
        id: txn.id,
        ...txn.data(),
      }));

      const result = calculateProgress(project.budget, validTransactions);
      setProgressData(result); // Update progress
    };

    fetchUpdatedTransactions(); // Fetch transactions on load
  }, [project.id]); // Dependency on project ID

  // **Load Transactions Safely**
  useEffect(() => {
    // Prefer passed transactions, fallback to project.transactions
    const loadedTransactions = transactions.length
      ? transactions
      : project.transactions || [];

    // **Ensure Transactions Are Valid Before Using Them**
    const validatedTransactions = loadedTransactions.filter(
      (t) => t && t.amount > 0 && t.type && t.category,
    );

    // Update Transactions State
    setValidTransactions(validatedTransactions);

    // **Calculate Progress**
    const result = calculateProgress(project.budget, validatedTransactions);
    setProgressData(result);

    // Debugging Logs
    console.log("Validated Transactions:", validatedTransactions);
    console.log("Progress Data:", result);
  }, [project.budget, transactions, project.transactions]); // Watch for changes

  // **Budget Formatting**
  const formatBudgetWithEmoji = (budget) => {
    const formattedBudget = `$${budget?.toLocaleString() || "0"}`;
    return budget > 99999 ? `${formattedBudget} 🎉` : formattedBudget;
  };

  const handleStatusChange = async (newStatus) => {
    try {
      console.log("Changing status to:", newStatus);

      // Rule 1: Prevent marking as complete if budget not met
      if (newStatus === "completed" && progressData.percentage < 100) {
        Swal.fire({
          icon: "warning",
          title: "Budget Not Met",
          text: "You cannot mark this project as complete until the budget is 100% fulfilled.",
        });
        setSelectedStatus(projectDetails.status); // Revert dropdown
        return;
      }

      // Rule 2: Prevent marking as in-progress if no client payment
      const hasClientPayment = validTransactions.some(
        (t) =>
          t.type === "income" &&
          (t.details.toLowerCase().includes("deposit") ||
            t.details.toLowerCase().includes("client payment")),
      );

      if (newStatus === "in-progress" && !hasClientPayment) {
        Swal.fire({
          icon: "warning",
          title: "No Client Payment",
          text: "You cannot mark this project as in-progress until a client payment or deposit has been received.",
        });
        setSelectedStatus(projectDetails.status); // Revert dropdown
        return;
      }

      // Proceed with the status update if rules are satisfied
      const docRef = doc(db, "projects", projectDetails.id);
      await updateDoc(docRef, {
        status: newStatus,
        statusDate: new Date(),
      });

      // Update the state if Firestore update succeeds
      setProjectDetails((prev) => ({
        ...prev,
        status: newStatus,
      }));

      setSelectedStatus(newStatus); // Sync dropdown state

      Swal.fire({
        icon: "success",
        title: "Status Updated",
        text: `Project status has been changed to "${newStatus}".`,
      });

      console.log("Firestore Updated!");
    } catch (error) {
      console.error("Error updating status:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update project status. Please try again.",
      });
      setSelectedStatus(projectDetails.status); // Revert dropdown on error
    }
  };

  const [projectDetails, setProjectDetails] = useState(project); // Default to passed project
  const [selectedStatus, setSelectedStatus] = useState(projectDetails.status); // Track dropdown state

  useEffect(() => {
    const fetchProjectDetails = async () => {
      const updatedProject = await fetchProjectById(project.id);
      setProjectDetails(updatedProject); // Update state with fresh data
    };

    fetchProjectDetails();
  }, [project.id]); // Runs when the project ID changes

  useEffect(() => {
    console.log("ProjectDetails Loaded:", projectDetails);
    console.log("Progress Data:", progressData);
  }, [projectDetails, progressData]);

  // **Render Card**
  return (
    <div className="global-card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5>{project.name || "Unnamed Project"}</h5>
        <span className={getBadgeClass(projectDetails.status)}>
          {getBadgeLabel(projectDetails.status)}
        </span>
      </div>
      <div className="card-body">
        <p className="lh-1">
          <i className="bi bi-geo-alt-fill text-primary me-2"></i>
          <strong>Location:</strong> {project.location || "N/A"}
        </p>
        <p className="lh-1">
          <i className="bi bi-bank text-success me-2"></i>
          <strong>Budget:</strong> {formatBudgetWithEmoji(project.budget)}
        </p>
        <p className="lh-1">
          <i className="bi bi-calendar-check text-secondary me-2"></i>
          <strong>Created:</strong>{" "}
          {project.createdAt?.toDate().toLocaleDateString() || "N/A"}
        </p>
        <p className="lh-1">
          <i className="bi bi-card-text text-secondary me-2"></i>
          <strong>Status Note:</strong> {project.statusNote || "No notes."}
        </p>

        {/* Status Dropdown */}
        <div className="d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-substack text-secondary"></i>
          <strong className="text-nowrap me-2">Change Status:</strong>

          {["on-hold", "cancelled", "completed"].includes(
            projectDetails.status,
          ) ? (
            <button
              className="btn btn-outline-warning btn-sm d-flex align-items-center gap-1"
              title="Re-open Project"
              onClick={async () => {
                const result = await Swal.fire({
                  title: "Re-open Project?",
                  text: "This will change the status back to 'New'. Continue?",
                  icon: "question",
                  showCancelButton: true,
                  confirmButtonColor: "#28a745",
                  cancelButtonColor: "#3085d6",
                  confirmButtonText: "Yes, re-open it!",
                  cancelButtonText: "Cancel",
                });

                if (result.isConfirmed) {
                  try {
                    const docRef = doc(db, "projects", projectDetails.id);
                    await updateDoc(docRef, {
                      status: "new",
                      statusDate: new Date(),
                    });

                    setProjectDetails((prev) => ({
                      ...prev,
                      status: "new",
                    }));

                    setSelectedStatus("new");
                    Swal.fire(
                      "Reopened!",
                      "The project has been reopened.",
                      "success",
                    );
                  } catch (error) {
                    console.error("Error reopening project:", error);
                    Swal.fire(
                      "Error",
                      "Failed to re-open project. Please try again.",
                      "error",
                    );
                  }
                }
              }}
            >
              <i className="bi bi-arrow-repeat"></i> Re-open
            </button>
          ) : (
            <select
              id="status"
              className="form-select w-auto"
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                handleStatusChange(e.target.value);
              }}
            >
              <option value="new">New</option>
              <option
                value="in-progress"
                disabled={
                  !validTransactions.some(
                    (t) =>
                      t.type === "income" &&
                      (t.details.toLowerCase().includes("deposit") ||
                        t.details.toLowerCase().includes("client payment")),
                  )
                }
              >
                In Progress
              </option>
              <option
                value="completed"
                disabled={projectDetails.status === "new"}
              >
                Completed
              </option>
              <option
                value="on-hold"
                disabled={projectDetails.status === "new"}
              >
                On Hold
              </option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}
        </div>

        {/* Progress Bar */}
        <div className="d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-graph-up-arrow text-secondary"></i>
          <strong className="text-nowrap me-2">Progress:</strong>

          <div className="progress flex-grow-1" style={{ height: "30px" }}>
            {progressData.status === "over-budget" && (
              <p className="text-danger m-0">
                Warning: Expenses exceed budget by $
                {progressData.expenses - progressData.income - project.budget}!
              </p>
            )}
            <div
              className={`progress-bar ${
                progressData.status === "complete"
                  ? "bg-success"
                  : progressData.status === "over-budget"
                    ? "bg-danger"
                    : "bg-primary"
              }`}
              role="progressbar"
              style={{
                width: `${progressData.percentage}%`,
              }}
              aria-valuenow={progressData.percentage}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              {`${progressData.percentage}%`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsCard;
