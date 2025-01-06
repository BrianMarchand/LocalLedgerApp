import React, { createContext, useContext, useEffect, useState } from "react";
import { db, auth } from "../firebaseConfig";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  doc,
  setDoc,
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
  // --- State Management ---
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- Authentication Check ---
  const [user, setUser] = useState(null);

  // Listen for auth changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        console.log("User is authenticated:", currentUser.email);
        setUser(currentUser); // Set authenticated user
      } else {
        console.warn("No authenticated user found.");
        setUser(null); // Clear user
      }
    });
    return unsubscribe; // Cleanup on unmount
  }, []);

  // --- Real-time listener for projects ---
  useEffect(() => {
    if (!user) {
      console.warn("Firestore listener skipped: No authenticated user.");
      setLoading(false);
      return; // Prevent listener setup if no user
    }

    console.log("Setting up Firestore listener...");

    const unsubscribe = onSnapshot(
      query(collection(db, "projects"), orderBy("order", "asc")),
      (snapshot) => {
        const projectList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Fetched Projects from Firestore:", projectList);
        setProjects(projectList);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching projects: ", err);
        if (err.code === "permission-denied") {
          toast.error("Firestore permissions error. Check Firestore rules.");
        }
        setError("Failed to fetch projects.");
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user]); // React only when the user changes

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
        order: projects.length, // Incremental order
      });
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

    const projectRef = doc(db, "projects", id);
    await updateDoc(projectRef, updatedData);
  };

  // --- Save Project ---
  const saveProject = async (project) => {
    if (!user) {
      toast.error("You must be logged in to save projects.");
      throw new Error("User not authenticated.");
    }

    console.log("Saving new project:", project);
    try {
      const projectRef = doc(db, "projects", project.id);
      await setDoc(projectRef, {
        ...project,
        createdAt: serverTimestamp(),
      });

      console.log(`Project created with ID: ${project.id}`);

      // Refresh projects after saving
      const updatedProjects = [...projects, { id: project.id, ...project }];
      setProjects(updatedProjects);

      toast.success("Project saved successfully!");
    } catch (error) {
      console.error("Error saving project:", error);
      toast.error(`Failed to save project: ${error.message}`);
    }
  };

  // --- Delete Project ---
  const deleteProject = async (id) => {
    if (!user) {
      toast.error("You must be logged in to delete projects.");
      throw new Error("User not authenticated.");
    }

    console.log("Attempting to delete project and sub-collections for ID:", id);
    try {
      // Delete sub-collections first
      const transactionsRef = collection(db, `projects/${id}/transactions`);
      const transactionsSnapshot = await getDocs(transactionsRef);

      if (!transactionsSnapshot.empty) {
        const batch = writeBatch(db);
        transactionsSnapshot.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }

      // Delete parent project
      const projectRef = doc(db, "projects", id);
      await deleteDoc(projectRef);

      // Refresh UI
      setProjects(projects.filter((p) => p.id !== id));
      toast.success("Project deleted successfully!");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error(`Failed to delete project: ${error.message}`);
    }
  };

  // --- Check Order Fields ---
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

  // --- Fix Order Fields ---
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

  // --- Fetch Projects Manually ---
  const fetchProjects = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "projects"));
      const projectList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(projectList);
      console.log("Fetched Projects from Firestore:", projectList);
    } catch (error) {
      console.error("Error fetching projects:", error);
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
        fetchProjects,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};
