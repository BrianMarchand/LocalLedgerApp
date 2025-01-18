// -- Page: useFetchData.js --

import { useEffect, useState, useCallback } from "react";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@config";
import { validateStatusTransition } from "../utils/statusValidation";
import { toast } from "react-toastify";

const useFetchData = (projectId) => {
  const [project, setProject] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProject = async () => {
    try {
      const projectRef = doc(db, "projects", projectId);
      const projectSnap = await getDoc(projectRef);

      if (projectSnap.exists()) {
        const projectData = { id: projectSnap.id, ...projectSnap.data() };

        console.log("Fetched Project:", projectData);
        setProject(projectData);
        return projectData;
      } else {
        console.error("Project not found.");
        setError({ type: "project", message: "Project not found." });
        return null;
      }
    } catch (err) {
      console.error("Error fetching project:", err);
      setError({ type: "project", message: err.message });
      return null;
    }
  };

  const fetchTransactions = async () => {
    try {
      const transactionsRef = collection(
        db,
        `projects/${projectId}/transactions`,
      );
      const transactionsSnap = await getDocs(transactionsRef);

      const transactionsData = transactionsSnap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
        };
      });

      console.log("Fetched Transactions:", transactionsData);
      setTransactions(transactionsData);
      return transactionsData;
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError({ type: "transactions", message: err.message });
      return [];
    }
  };

  const checkAndUpdateStatus = async (project, transactions) => {
    if (!project || !Array.isArray(transactions)) {
      console.warn("No project or transactions to validate.");
      return;
    }

    // Validate transition to "In Progress" for "new" projects
    const { valid, reason } = validateStatusTransition(
      "in-progress",
      transactions,
      { percentage: project.progress || 0 },
    );

    if (valid && project.status === "new") {
      try {
        const projectRef = doc(db, "projects", project.id);
        await updateDoc(projectRef, {
          status: "in-progress",
          statusDate: serverTimestamp(),
        });

        setProject((prev) => ({
          ...prev,
          status: "in-progress",
        }));

        toast.success(`Project status updated to "In Progress"!`);
      } catch (err) {
        console.error("Error updating status:", err);
        toast.error("Failed to update project status.");
      }
    } else {
      console.warn("Status not updated. Reason:", reason);
    }
  };

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const projectData = await fetchProject();
      const transactionsData = await fetchTransactions();

      if (projectData && transactionsData.length > 0) {
        await checkAndUpdateStatus(projectData, transactionsData);
      }
    } catch (error) {
      console.error("Error during refetch:", error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (projectId) {
      refetch();
    }
  }, [projectId, refetch]);

  useEffect(() => {
    console.log("Raw Fetched Transactions:", transactions);
  }, [transactions]);

  return { project, transactions, loading, error, refetch };
};

export default useFetchData;
