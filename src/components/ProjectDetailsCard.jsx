// -- Page: ProjectDetailsCard.jsx --

import React, { useEffect, useState } from "react";
import { calculateProgress } from "../utils/progressUtils"; // Import utility
import { getBadgeClass, getBadgeLabel } from "../utils/badgeUtils";
import { useProjects } from "../context/ProjectsContext";
import { validateStatusTransition } from "../utils/statusValidation";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "@config";

const ProjectDetailsCard = ({ project, transactions = [] }) => {
  console.log("ProjectDetailsCard Loaded:", project); // Log the project details as received

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

  useEffect(() => {
    console.log("Received Transactions in ProjectDetailsCard:", transactions);
  }, [transactions]);

  // **Budget Formatting**
  const formatBudgetWithEmoji = (budget) => {
    const formattedBudget = `$${budget?.toLocaleString() || "0"}`;
    return budget > 99999 ? `${formattedBudget} 🎉` : formattedBudget;
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const { valid, reason } = validateStatusTransition(
        newStatus,
        validTransactions,
        progressData,
      );

      if (!valid) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Status Change",
          text: reason,
        });
        setSelectedStatus(projectDetails.status); // Revert dropdown
        return;
      }

      // Confirm for critical changes
      if (newStatus === "completed" && progressData.percentage >= 100) {
        const result = await Swal.fire({
          icon: "question",
          title: "Mark as Complete?",
          text: "This will finalize the project. Proceed?",
          showCancelButton: true,
          confirmButtonText: "Yes",
          cancelButtonText: "No",
        });

        if (!result.isConfirmed) {
          setSelectedStatus(projectDetails.status); // Revert dropdown
          return;
        }
      }

      // Update Firestore
      const docRef = doc(db, "projects", projectDetails.id);
      await updateDoc(docRef, {
        status: newStatus,
        statusDate: new Date(),
      });

      // Update local state
      setProjectDetails((prev) => ({
        ...prev,
        status: newStatus,
      }));

      // Use toast to display success
      if (toast) {
        toast.success(`Project status updated to "${newStatus}".`);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update project status.",
      });

      // Revert dropdown selection
      setSelectedStatus(projectDetails.status);
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

  // --- Define hasDeposit at the start of the component ---
  const hasDeposit = validTransactions.some(
    (txn) =>
      txn.category === "Client Payment" &&
      txn.description?.toLowerCase().includes("deposit"),
  );

  // **Render Card**
  return (
    <div className="global-card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5>
          <i className="bi bi-folder2 me-2"></i>
          {project.name || "Unnamed Project"}
        </h5>
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
          <i className="bi bi-calendar-event text-info me-2"></i>
          <strong>Estimated Completion: </strong>
          {project.estimatedCompletionDate
            ? new Date(project.estimatedCompletionDate).toLocaleDateString()
            : "Not Set"}
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
          <i className="bi bi-list-check text-secondary me-2"></i>
          <strong>Transactions:</strong> {validTransactions.length || "0"}
        </p>
        <p className="lh-1">
          <i className="bi bi-card-text text-secondary me-2"></i>
          <strong>Status Note:</strong> {project.statusNote || "No notes."}
        </p>

        {/* Status Dropdown */}
        {/* Status Dropdown */}
        <div className="d-flex align-items-center gap-2 mb-3">
          <i className="bi bi-substack text-secondary"></i>
          <strong className="text-nowrap me-2">Change Status:</strong>

          <select
            id="status"
            className="form-select w-auto"
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              handleStatusChange(e.target.value);
            }}
            disabled={!validTransactions.length}
          >
            {/* ✅ Prevent "New" if reopening a project that already has a deposit */}
            <option
              value="new"
              disabled={projectDetails.status === "on-hold" && hasDeposit}
            >
              New
            </option>

            {/* ✅ Ensure "In Progress" is only enabled if a deposit exists */}
            <option value="in-progress" disabled={!hasDeposit}>
              In Progress
            </option>

            {/* ✅ Ensure "Completed" is only enabled if the full budget is paid */}
            <option
              value="completed"
              disabled={progressData.income < (project.budget || 0)}
            >
              Completed
            </option>

            <option value="on-hold">On Hold</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Progress Bar  */}
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
                fontSize: "11px", // ✅ Ensure text is readable
                fontWeight: "normal", // ✅ Make text stand out
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
      </div>
    </div>
  );
};

export default ProjectDetailsCard;
