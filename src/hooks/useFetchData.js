import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
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
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError({ type: "transactions", message: err.message });
    }
  };

  const refetch = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchProject();
      await fetchTransactions();
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
