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

  // Fetch a single project by ID
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
      toast.error("Failed to load project details.");
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

      // Optimistically update the local state first
      setProjects((prevProjects) =>
        prevProjects.map((proj) =>
          proj.id === id ? { ...proj, ...updatedData } : proj,
        ),
      );

      // Update Firestore
      await updateDoc(projectRef, updatedData);
      toast.success("Project updated successfully!");

      // Optional: Refetch data from Firestore to verify sync
      fetchProjectsWithTransactions();
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project.");
    }
  };

  // Status change: Mark a project as complete

  const markAsComplete = async (project) => {
    try {
      // Optimistically update state
      setProjects((prevProjects) =>
        prevProjects.map((p) =>
          p.id === project.id ? { ...p, status: "completed" } : p,
        ),
      );

      // Update Firestore
      const docRef = doc(db, "projects", project.id);
      await updateDoc(docRef, { status: "completed", statusDate: new Date() });

      toast.success(`Project "${project.name}" marked as complete!`);
    } catch (error) {
      console.error("Error marking project as complete:", error);
      toast.error("Failed to update project.");
    }
  };

  // Status change: Mark a project as in-progress

  const markAsInProgress = async (project) => {
    try {
      // Optimistically update state
      setProjects((prevProjects) =>
        prevProjects.map((p) =>
          p.id === project.id ? { ...p, status: "in-progress" } : p,
        ),
      );

      // Update Firestore
      const docRef = doc(db, "projects", project.id);
      await updateDoc(docRef, {
        status: "in-progress",
        statusDate: new Date(),
      });

      toast.success(`Project "${project.name}" marked as in progress!`);
    } catch (error) {
      console.error("Error marking project as in progress:", error);
      toast.error("Failed to update project.");
    }
  };

  // Status change: Mark a project as on-hold

  const putOnHold = async (project) => {
    try {
      // Optimistically update state
      setProjects((prevProjects) =>
        prevProjects.map((p) =>
          p.id === project.id ? { ...p, status: "on-hold" } : p,
        ),
      );

      // Update Firestore
      const docRef = doc(db, "projects", project.id);
      await updateDoc(docRef, { status: "on-hold", statusDate: new Date() });

      toast.success(`Project "${project.name}" is now on hold.`);
    } catch (error) {
      console.error("Error putting project on hold:", error);
      toast.error("Failed to update project.");
    }
  };

  // Status change: Cancel a project

  const cancelProject = async (project) => {
    try {
      // Optimistically update state
      setProjects((prevProjects) =>
        prevProjects.map((p) =>
          p.id === projectId
            ? { ...p, status: newStatus, statusDate: new Date() }
            : p,
        ),
      );

      // Force re-fetch to avoid stale state
      await fetchProjects(); // <-- Force sync with Firestore

      // Update Firestore
      const docRef = doc(db, "projects", project.id);
      await updateDoc(docRef, { status: "cancelled", statusDate: new Date() });

      console.log("Fetching updated projects...");
      const snapshot = await getDocs(collection(db, "projects"));
      const fetchedProjects = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setProjects(fetchedProjects); // Update context
      console.log("Updated Projects in Context:", fetchedProjects); // Debugging

      toast.success(`Project "${project.name}" has been cancelled.`);
    } catch (error) {
      console.error("Error cancelling project:", error);
      toast.error("Failed to update project.");
    }
  };

  // Status change helper: Reopen a project
  const reopenProject = async (project) => {
    try {
      // Optimistically update state
      setProjects((prevProjects) =>
        prevProjects.map((p) =>
          p.id === project.id ? { ...p, status: "in-progress" } : p,
        ),
      );

      // Update Firestore
      const docRef = doc(db, "projects", project.id);
      await updateDoc(docRef, {
        status: "in-progress",
        statusDate: new Date(),
      });

      toast.success(`Project "${project.name}" has been reopened!`);
    } catch (error) {
      console.error("Error reopening project:", error);
      toast.error("Failed to update project.");
    }
  };

  // Status change helper: Reset to new
  const resetToNew = async (project) => {
    try {
      // Optimistically update state
      setProjects((prevProjects) =>
        prevProjects.map((p) =>
          p.id === project.id ? { ...p, status: "new" } : p,
        ),
      );

      // Update Firestore
      const docRef = doc(db, "projects", project.id);
      await updateDoc(docRef, { status: "new", statusDate: new Date() });

      toast.success(`Project "${project.name}" reset to new status.`);
    } catch (error) {
      console.error("Error resetting project to new status:", error);
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
        fetchProjects: fetchProjectsWithTransactions,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};
