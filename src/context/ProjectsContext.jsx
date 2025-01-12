import React, { createContext, useContext, useEffect, useState } from "react";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  query,
  orderBy,
  where,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { toast } from "react-toastify";

const ProjectsContext = createContext();

export const useProjects = () => useContext(ProjectsContext);

export const ProjectsProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false); // UI-related loading
  const [fetching, setFetching] = useState(false); // Data fetch state
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // --- Listen for Authentication Changes ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        console.log("User authenticated:", currentUser.uid);
        fetchProjectsWithTransactions(); // Fetch projects when logged in
      } else {
        console.log("No user authenticated, clearing projects.");
        setProjects([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- Fetch Projects with Subcollections ---
  const fetchProjectsWithTransactions = async () => {
    setFetching(true);
    setLoading(true);

    try {
      if (!auth.currentUser) throw new Error("No authenticated user.");
      console.log("Fetching projects for user:", auth.currentUser.uid);

      const snapshot = await getDocs(
        query(
          collection(db, "projects"),
          where("ownerId", "==", auth.currentUser.uid),
          orderBy("order", "asc"),
        ),
      );

      const projectsWithTransactions = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const project = { id: docSnap.id, ...docSnap.data() };

          // Fetch transactions for the project
          const transactionsSnapshot = await getDocs(
            collection(db, `projects/${project.id}/transactions`),
          );

          project.transactions = transactionsSnapshot.docs.map((txn) => ({
            id: txn.id,
            ...txn.data(),
          }));

          // Check for deposit transaction
          const hasDepositTransaction = project.transactions.some(
            (txn) =>
              txn.category === "Client Payment" &&
              txn.description?.toLowerCase().includes("deposit"),
          );

          if (project.status === "new" && hasDepositTransaction) {
            console.log(`Updating project "${project.name}" to 'in-progress'`);
            await updateDoc(doc(db, "projects", project.id), {
              status: "in-progress",
              statusDate: serverTimestamp(),
            });
            project.status = "in-progress"; // Update locally
          }

          return project;
        }),
      );

      setProjects(projectsWithTransactions);
      console.log(
        "All projects fetched and updated in state:",
        projectsWithTransactions,
      );
    } catch (err) {
      console.error("Error fetching projects with transactions:", err.message);
      setError("Failed to fetch projects.");
    } finally {
      setFetching(false);
      setLoading(false);
    }
  };

  // --- Add Project ---
  const addProject = async (newProject) => {
    try {
      if (!user) throw new Error("No authenticated user.");

      const newDoc = await addDoc(collection(db, "projects"), {
        ...newProject,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        statusDate: serverTimestamp(),
        order: projects.length,
      });

      const addedProject = { id: newDoc.id, ...newProject };
      setProjects((prevProjects) => [...prevProjects, addedProject]); // Update locally

      toast.success("Project added successfully!");
    } catch (err) {
      console.error("Error adding project:", err.message);
      toast.error("Failed to add project.");
      throw err;
    }
  };

  // --- Update Project ---
  const updateProject = async (id, updatedData) => {
    try {
      if (!user) throw new Error("No authenticated user.");

      await updateDoc(doc(db, "projects", id), updatedData);

      toast.success("Project updated successfully!");
      fetchProjectsWithTransactions();
    } catch (err) {
      console.error("Error updating project:", err.message);
      toast.error("Failed to update project.");
      throw err;
    }
  };

  // --- Delete Project and Its Subcollections ---
  const deleteProject = async (id) => {
    try {
      if (!user) throw new Error("No authenticated user.");

      const subcollections = ["transactions", "shoppingList", "notes"];
      const batch = writeBatch(db);

      for (const sub of subcollections) {
        const subSnap = await getDocs(collection(db, `projects/${id}/${sub}`));
        subSnap.forEach((doc) => batch.delete(doc.ref));
      }

      batch.delete(doc(db, "projects", id));
      await batch.commit();

      toast.success("Project deleted successfully!");
      fetchProjectsWithTransactions();
    } catch (err) {
      console.error("Error deleting project:", err.message);
      toast.error("Failed to delete project.");
      throw err;
    }
  };

  // --- Clear Error ---
  const clearError = () => setError(null);

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        setProjects,
        loading,
        fetching, // Tracks fetching status
        error,
        addProject,
        updateProject,
        deleteProject,
        fetchProjects: fetchProjectsWithTransactions, // Unified fetch function
        clearError,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};
