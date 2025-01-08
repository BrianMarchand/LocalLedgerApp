import React, { createContext, useContext, useEffect, useState } from "react";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  query,
  orderBy,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { toast } from "react-toastify";

// Create Context
const ProjectsContext = createContext();

// Custom Hook
export const useProjects = () => useContext(ProjectsContext);

// Provider Component
export const ProjectsProvider = ({ children }) => {
  // State Management
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // --- Authentication Listener ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        console.log("User authenticated:", currentUser.email);
        setUser(currentUser);
      } else {
        console.warn("No authenticated user.");
        setUser(null);
      }
    });
    return () => unsubscribe(); // Cleanup
  }, []);

  // --- Fetch Projects with Transactions ---
  const fetchProjectsWithTransactions = async () => {
    try {
      setLoading(true); // Start loading
      if (!user) {
        console.warn("No authenticated user, skipping fetch.");
        setLoading(false);
        return;
      }

      console.log("Fetching projects with transactions...");
      const querySnapshot = await getDocs(collection(db, "projects"));
      const projectsList = [];

      for (const docSnap of querySnapshot.docs) {
        const project = { id: docSnap.id, ...docSnap.data() };

        // Fetch transactions subcollection
        const transactionsRef = collection(
          db,
          `projects/${project.id}/transactions`,
        );
        const transactionsSnapshot = await getDocs(transactionsRef);

        // Attach transactions
        project.transactions = transactionsSnapshot.docs.map((txn) => ({
          id: txn.id,
          ...txn.data(),
        }));

        projectsList.push(project);
      }

      console.log("Fetched Projects:", projectsList);
      setProjects(projectsList);
      setLoading(false);
      console.log("Final Projects with Transactions:", projectsList); // Debug log
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Failed to fetch projects.");
      setError("Failed to fetch projects.");
      setLoading(false); // Stop loading
    }
  };

  // --- Automatically Fetch Projects After Auth ---
  useEffect(() => {
    if (user) {
      console.log("User authenticated, fetching projects...");
      fetchProjectsWithTransactions(); // Fetch projects once the user is authenticated
    } else {
      console.log("User not authenticated, skipping project fetch.");
      setProjects([]); // Clear projects if no user
    }
  }, [user]); // Runs whenever `user` changes

  // --- Add Project ---
  const addProject = async (newProject) => {
    if (!user) {
      toast.error("You must be logged in to add projects.");
      throw new Error("User not authenticated.");
    }

    try {
      const docRef = await addDoc(collection(db, "projects"), {
        ...newProject,
        createdAt: serverTimestamp(),
        order: projects.length,
      });
      toast.success("Project added successfully!");
      fetchProjectsWithTransactions(); // Refresh
      return { id: docRef.id, ...newProject };
    } catch (error) {
      console.error("Error adding project:", error);
      toast.error("Failed to add project.");
    }
  };

  // --- Update Project ---
  const updateProject = async (id, updatedData) => {
    if (!user) {
      toast.error("You must be logged in to update projects.");
      throw new Error("User not authenticated.");
    }

    try {
      const projectRef = doc(db, "projects", id);
      await updateDoc(projectRef, updatedData);
      toast.success("Project updated successfully!");
      fetchProjectsWithTransactions(); // Refresh
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project.");
    }
  };

  // --- Delete Project (with Subcollections) ---
  const deleteProject = async (id) => {
    if (!user) {
      toast.error("You must be logged in to delete projects.");
      throw new Error("User not authenticated.");
    }

    try {
      // Delete transactions first
      const transactionsRef = collection(db, `projects/${id}/transactions`);
      const transactionsSnapshot = await getDocs(transactionsRef);

      if (!transactionsSnapshot.empty) {
        const batch = writeBatch(db);
        transactionsSnapshot.forEach((txn) => batch.delete(txn.ref));
        await batch.commit();
      }

      // Delete project
      await deleteDoc(doc(db, "projects", id));
      toast.success("Project deleted successfully!");
      fetchProjectsWithTransactions(); // Refresh
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project.");
    }
  };

  // --- Save Project ---
  const saveProject = async (project) => {
    if (!user) {
      toast.error("You must be logged in to save projects.");
      throw new Error("User not authenticated.");
    }

    try {
      const projectRef = doc(db, "projects", project.id);
      await setDoc(projectRef, {
        ...project,
        createdAt: serverTimestamp(),
      });

      toast.success("Project saved successfully!");
      fetchProjectsWithTransactions(); // Refresh
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error(`Failed to save project: ${error.message}`);
    }
  };

  // --- Provide Context ---
  return (
    <ProjectsContext.Provider
      value={{
        projects,
        setProjects,
        loading,
        error,
        addProject,
        updateProject,
        deleteProject,
        fetchProjectsWithTransactions,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};
