// File: src/pages/ProjectDetailsCard.jsx
import React, { useEffect, useState } from "react";
import { calculateProgress } from "../utils/progressUtils"; // Import utility
import { getBadgeClass, getBadgeLabel } from "../utils/badgeUtils";
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
  console.log("ProjectDetailsCard Loaded:", project);

  const [validTransactions, setValidTransactions] = useState([]);
  const [progressData, setProgressData] = useState({
    percentage: 0,
    status: "new",
    income: 0,
    expenses: 0,
  });
  // State to hold customer info (fetched using project.customerId)
  const [customerInfo, setCustomerInfo] = useState(null);

  // For status dropdown functionality
  const [projectDetails, setProjectDetails] = useState(project);
  const [selectedStatus, setSelectedStatus] = useState(projectDetails.status);

  // Flag to differentiate Fixed Budget from T&M projects
  const isFixedBudget = project.projectType === "fixed";

  // Fetch the complete project details (including transactions)
  const fetchProjectById = async (id) => {
    try {
      const docRef = doc(db, "projects", id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const projectData = { id: docSnap.id, ...docSnap.data() };
        // Fetch transactions
        const transactionsRef = collection(db, `projects/${id}/transactions`);
        const transactionsSnapshot = await getDocs(transactionsRef);
        projectData.transactions = transactionsSnapshot.docs.map((txn) => ({
          id: txn.id,
          ...txn.data(),
        }));
        return projectData;
      } else {
        throw new Error("Project not found");
      }
    } catch (error) {
      console.error("Error fetching project by ID:", error);
      throw error;
    }
  };

  // Fetch customer info based on project.customerId
  useEffect(() => {
    const fetchCustomer = async () => {
      if (project && project.customerId) {
        try {
          const customerRef = doc(db, "customers", project.customerId);
          const customerSnap = await getDoc(customerRef);
          if (customerSnap.exists()) {
            setCustomerInfo(customerSnap.data());
          } else {
            setCustomerInfo(null);
          }
        } catch (error) {
          console.error("Error fetching customer info:", error);
          setCustomerInfo(null);
        }
      }
    };
    fetchCustomer();
  }, [project]);

  // Fetch transactions and calculate progress
  useEffect(() => {
    const fetchUpdatedTransactions = async () => {
      const transactionsRef = collection(
        db,
        `projects/${project.id}/transactions`
      );
      const transactionsSnapshot = await getDocs(transactionsRef);
      const allTransactions = transactionsSnapshot.docs.map((txn) => ({
        id: txn.id,
        ...txn.data(),
      }));
      const result = calculateProgress(project.budget, allTransactions);
      setProgressData(result);
    };
    fetchUpdatedTransactions();
  }, [project.id]);

  useEffect(() => {
    const loadedTransactions =
      transactions.length > 0 ? transactions : project.transactions || [];
    const validatedTransactions = loadedTransactions.filter(
      (t) => t && t.amount > 0 && t.type && t.category
    );
    setValidTransactions(validatedTransactions);
    const result = calculateProgress(project.budget, validatedTransactions);
    setProgressData(result);
    console.log("Validated Transactions:", validatedTransactions);
    console.log("Progress Data:", result);
  }, [project.budget, transactions, project.transactions]);

  useEffect(() => {
    console.log("Received Transactions in ProjectDetailsCard:", transactions);
  }, [transactions]);

  // Format budget with an emoji if large
  const formatBudgetWithEmoji = (budget) => {
    const formattedBudget = `$${budget?.toLocaleString() || "0"}`;
    return budget > 99999 ? `${formattedBudget} 🎉` : formattedBudget;
  };

  // Update projectDetails on mount/when project.id changes
  useEffect(() => {
    const fetchProjectDetails = async () => {
      const updatedProject = await fetchProjectById(project.id);
      setProjectDetails(updatedProject);
      setSelectedStatus(updatedProject.status);
    };
    fetchProjectDetails();
  }, [project.id]);

  useEffect(() => {
    console.log("ProjectDetails Loaded:", projectDetails);
    console.log("Progress Data:", progressData);
  }, [projectDetails, progressData]);

  // Determine if there is a deposit transaction
  const hasDeposit = validTransactions.some(
    (txn) =>
      txn.category === "Client Payment" &&
      txn.description?.toLowerCase().includes("deposit")
  );

  // Update status function:
  const handleStatusChange = async (newStatus) => {
    // For T&M projects, update status freely.
    if (!isFixedBudget) {
      try {
        const docRef = doc(db, "projects", projectDetails.id);
        await updateDoc(docRef, {
          status: newStatus,
          statusDate: new Date(),
        });
        setProjectDetails((prev) => ({
          ...prev,
          status: newStatus,
        }));
        toast.success(`Project status updated to "${newStatus}".`);
      } catch (error) {
        console.error("Error updating status:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to update project status.",
        });
        setSelectedStatus(projectDetails.status);
      }
      return;
    }

    // For Fixed Budget projects, perform validations
    try {
      const { valid, reason } = validateStatusTransition(
        newStatus,
        validTransactions,
        progressData
      );
      if (!valid) {
        Swal.fire({
          icon: "warning",
          title: "Invalid Status Change",
          text: reason,
        });
        setSelectedStatus(projectDetails.status);
        return;
      }

      // For "completed", ensure the full budget is paid.
      if (
        newStatus === "completed" &&
        progressData.income < (project.budget || 0)
      ) {
        await Swal.fire({
          icon: "error",
          title: "Budget Incomplete",
          text: "The project cannot be marked as Completed until the full budget is paid.",
        });
        setSelectedStatus(projectDetails.status);
        return;
      }

      // Optionally confirm if marking as completed
      if (newStatus === "completed") {
        const result = await Swal.fire({
          icon: "question",
          title: "Mark as Complete?",
          text: "This will finalize the project. Proceed?",
          showCancelButton: true,
          confirmButtonText: "Yes",
          cancelButtonText: "No",
        });
        if (!result.isConfirmed) {
          setSelectedStatus(projectDetails.status);
          return;
        }
      }

      // Update Firestore with the new status
      const docRef = doc(db, "projects", projectDetails.id);
      await updateDoc(docRef, {
        status: newStatus,
        statusDate: new Date(),
      });
      setProjectDetails((prev) => ({
        ...prev,
        status: newStatus,
      }));
      toast.success(`Project status updated to "${newStatus}".`);
    } catch (error) {
      console.error("Error updating status:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update project status.",
      });
      setSelectedStatus(projectDetails.status);
    }
  };

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
        {/* Customer block moved above Location */}
        <p className="lh-1">
          <i className="bi bi-person-fill text-primary me-2"></i>
          <strong>Customer:</strong>{" "}
          {customerInfo
            ? `${customerInfo.firstName} ${customerInfo.lastName}`
            : "N/A"}
        </p>
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
        {isFixedBudget ? (
          <p className="lh-1">
            <i className="bi bi-bank text-success me-2"></i>
            <strong>Budget:</strong> {formatBudgetWithEmoji(project.budget)}
          </p>
        ) : (
          <>
            <p className="lh-1">
              <i className="bi bi-clock text-success me-2"></i>
              <strong>Day Rate:</strong>{" "}
              {project.dayRate
                ? `$${Number(project.dayRate).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : "N/A"}
            </p>
            <p className="lh-1">
              <i className="bi bi-clock-history text-success me-2"></i>
              <strong>Hourly Rate:</strong>{" "}
              {project.hourlyRate
                ? `$${Number(project.hourlyRate).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                : "N/A"}
            </p>
          </>
        )}
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
            // For Fixed Budget projects, disable if no valid transactions; for T&M, always enabled
            disabled={isFixedBudget ? !validTransactions.length : false}
          >
            <option
              value="new"
              disabled={
                isFixedBudget &&
                projectDetails.status === "on-hold" &&
                hasDeposit
              }
            >
              New
            </option>
            <option value="in-progress" disabled={isFixedBudget && !hasDeposit}>
              In Progress
            </option>
            <option
              value="completed"
              disabled={
                isFixedBudget && progressData.income < (project.budget || 0)
              }
            >
              Completed
            </option>
            <option value="on-hold">On Hold</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Conditionally render progress indicator only for Fixed Budget projects */}
        {isFixedBudget && (
          <div className="d-flex align-items-center gap-2 mb-3">
            <i className="bi bi-graph-up-arrow text-secondary me-2"></i>
            <strong className="text-nowrap me-2">Progress:</strong>
            <div className="progress flex-grow-1" style={{ height: "30px" }}>
              {progressData.status === "over-budget" && (
                <p className="text-danger m-0">
                  Warning: Expenses exceed budget by $
                  {progressData.expenses - progressData.income - project.budget}
                  !
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
        )}
      </div>
    </div>
  );
};

export default ProjectDetailsCard;
