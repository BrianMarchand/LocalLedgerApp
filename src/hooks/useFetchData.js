import { useEffect, useState } from "react";
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
import { db } from "../firebaseConfig";

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
        console.log("Fetched Project:", projectData); // Debug
        setProject(projectData);
        return projectData;
      } else {
        console.error("Project not found.");
        setError({ type: "project", message: "Project not found." });
      }
    } catch (err) {
      console.error("Error fetching project:", err);
      setError({ type: "project", message: err.message });
    }
  };

  const fetchTransactions = async () => {
    try {
      const transactionsRef = collection(
        db,
        `projects/${projectId}/transactions`,
      );
      const transactionsSnap = await getDocs(
        query(transactionsRef, orderBy("order")),
      );

      const transactionsData = transactionsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("Fetched Transactions:", transactionsData); // Debug
      setTransactions(transactionsData);
      return transactionsData;
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError({ type: "transactions", message: err.message });
    }
  };

  const checkAndUpdateStatus = async (project, transactions) => {
    try {
      // Adjust the condition to match your transaction data structure
      const hasDeposit = transactions.some(
        (t) =>
          t.category === "Client Payment" && // Ensure the category matches
          t.name?.toLowerCase().includes("deposit"), // Check for "deposit" in the name or other field
      );

      console.log(
        `Checking for deposit in project ${project.name}:`,
        transactions,
      );
      console.log("Has Deposit:", hasDeposit);

      if (project.status === "new" && hasDeposit) {
        const projectRef = doc(db, "projects", project.id);
        await updateDoc(projectRef, {
          status: "in-progress",
          statusDate: serverTimestamp(),
        });

        console.log(`Updated project ${project.name} to 'in-progress'`);
        setProject((prev) => ({ ...prev, status: "in-progress" })); // Update state locally
      }
    } catch (err) {
      console.error("Error updating project status:", err);
    }
  };

  const refetch = async () => {
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
  };

  useEffect(() => {
    if (projectId) {
      refetch();
    }
  }, [projectId]);

  useEffect(() => {
    console.log("Raw Fetched Transactions:", transactions); // Debug
  }, [transactions]);

  return { project, transactions, loading, error, refetch };
};

export default useFetchData;
