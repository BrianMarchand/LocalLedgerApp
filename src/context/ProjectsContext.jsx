import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { toast } from "react-toastify";

// Create Context
const ProjectsContext = createContext();

// Hook for easy access in other components
export const useProjects = () => useContext(ProjectsContext);

// Provider Component
export const ProjectsProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Real-time listener for projects
  useEffect(() => {
    console.log("Setting up Firestore listener...");

    const unsubscribe = onSnapshot(
      query(collection(db, "projects"), orderBy("order", "asc")),
      (snapshot) => {
        const projectList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Fetched Projects from Firestore:", projectList); // <-- Debugging log
        setProjects(projectList); // <-- Should update state here
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching projects: ", err);
        setError("Failed to fetch projects.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // Add Project
  const addProject = async (newProject) => {
    const docRef = await addDoc(collection(db, "projects"), {
      ...newProject,
      createdAt: serverTimestamp(),
      order: projects.length, // Incremental order
    });
    return { id: docRef.id, ...newProject };
  };

  // Update Project
  const updateProject = async (id, updatedData) => {
    const projectRef = doc(db, "projects", id);
    await updateDoc(projectRef, updatedData);
  };

  // Add this function to handle saving projects properly
  const saveProject = async (project) => {
    console.log("Saving new project:", project);

    try {
      // Create a new document with the specified ID
      const projectRef = doc(db, "projects", project.id); // Reference with ID
      await setDoc(projectRef, {
        ...project,
        createdAt: serverTimestamp(),
      });

      console.log(`Project created with ID: ${project.id}`);

      // Force refresh projects after saving
      const updatedProjects = [...projects, { id: project.id, ...project }];
      setProjects(updatedProjects);

      toast.success("Project saved successfully!");
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error(`Failed to save project: ${error.message}`);
    }
  };

  // Delete Project and Sub-Collections
  const deleteProject = async (id) => {
    console.log("Attempting to delete project and sub-collections for ID:", id);

    try {
      // --- Step 1: Delete all transactions (sub-collections) ---
      console.log(`Step 1: Checking transactions for project ID: ${id}`);
      const transactionsRef = collection(db, `projects/${id}/transactions`);
      const transactionsSnapshot = await getDocs(transactionsRef);

      console.log(
        `Found ${transactionsSnapshot.size} transactions for deletion.`,
      );

      if (!transactionsSnapshot.empty) {
        const batch = writeBatch(db);

        transactionsSnapshot.forEach((doc) => {
          console.log(`Queuing transaction ID: ${doc.id} for deletion.`);
          batch.delete(doc.ref); // Queue each transaction for deletion
        });

        await batch.commit(); // Execute batch delete
        console.log(`Deleted all transactions for project ID: ${id}`);
      } else {
        console.log("No transactions found for this project.");
      }

      // --- Step 2: Delete the parent project ---
      console.log(`Step 2: Attempting to delete parent project ID: ${id}`);
      const projectRef = doc(db, "projects", id);

      // Log existence check before deletion
      const projectSnapshot = await getDoc(projectRef);
      if (!projectSnapshot.exists()) {
        console.warn(`Project ID: ${id} does not exist in Firestore.`);
      } else {
        console.log(`Project ID: ${id} exists and will be deleted.`);
        await deleteDoc(projectRef); // Delete project
        console.log(`Successfully deleted project ID: ${id}`);
      }

      // --- Step 3: Force Refresh UI ---
      console.log("Step 3: Force refreshing UI.");
      const updatedProjects = projects.filter((p) => p.id !== id);
      setProjects(updatedProjects); // Update local state
      console.log("Force refreshed projects:", updatedProjects);
    } catch (error) {
      console.error("Error deleting project or sub-collections:", error);
      toast.error(`Failed to delete project: ${error.message}`);
    }
  };

  const checkOrderFields = async () => {
    const querySnapshot = await getDocs(collection(db, "projects"));
    querySnapshot.forEach((docSnap, index) => {
      const data = docSnap.data();
      if (!data.order) {
        console.warn(`Missing order field for project ID: ${docSnap.id}`);
      } else {
        console.log(`Order field exists for project ID: ${docSnap.id}`);
      }
    });
  };

  const fixOrderFields = async () => {
    const querySnapshot = await getDocs(collection(db, "projects"));
    querySnapshot.forEach(async (docSnap, index) => {
      const data = docSnap.data();
      if (!data.order || typeof data.order !== "number") {
        const projectRef = doc(db, "projects", docSnap.id);
        await updateDoc(projectRef, { order: index });
        console.log(`Fixed order for project ID: ${docSnap.id}`);
      }
    });
  };

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
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};
