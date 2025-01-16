import React, { createContext, useContext, useEffect, useState } from "react";
import { db, auth } from "@config";
import {
  collection,
  query,
  orderBy,
  where,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  getDocs,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { toastSuccess, toastError } from "../utils/toastNotifications";

const ProjectsContext = createContext();

export const useProjects = () => useContext(ProjectsContext);

const SUBCOLLECTIONS = ["transactions", "shoppingList", "notes"];

const isAuthenticated = () => {
  if (!auth.currentUser) {
    toastError("No authenticated user.");
    throw new Error("No authenticated user.");
  }
};

export const ProjectsProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Firestore Listener ---
  useEffect(() => {
    if (!auth.currentUser) {
      console.warn("No authenticated user. Skipping Firestore listener setup.");
      return;
    }

    console.log("Setting up Firestore listener for projects...");
    const unsubscribe = onSnapshot(
      query(
        collection(db, "projects"),
        where("ownerId", "==", auth.currentUser.uid),
        orderBy("order", "asc"),
      ),
      (snapshot) => {
        const updatedProjects = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProjects((prevProjects) => {
          if (
            JSON.stringify(prevProjects) !== JSON.stringify(updatedProjects)
          ) {
            console.log(
              "Projects fetched and updated in state:",
              updatedProjects,
            );
            return updatedProjects;
          }
          return prevProjects;
        });
      },
      (error) => {
        console.error("Error with Firestore listener:", error.message);
      },
    );

    return () => {
      console.log("Cleaning up Firestore listener...");
      unsubscribe();
    };
  }, [auth.currentUser?.uid]);

  // --- Consolidated Fetch Projects ---
  const fetchProjects = async (includeTransactions = false) => {
    setLoading(true);
    try {
      const snapshot = await getDocs(
        query(collection(db, "projects"), orderBy("order", "asc")),
      );

      const projects = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const project = { id: docSnap.id, ...docSnap.data() };

          if (includeTransactions) {
            try {
              const transactionsSnap = await getDocs(
                collection(db, `projects/${project.id}/transactions`),
              );
              project.transactions = transactionsSnap.docs.map((txSnap) =>
                txSnap.data(),
              );
            } catch (err) {
              console.warn(
                `Failed to fetch transactions for project: ${project.id}`,
                err.message,
              );
              project.transactions = [];
            }
          }

          return project;
        }),
      );

      setProjects(projects);
    } catch (error) {
      console.error("Error fetching projects:", error.message);
      toastError("Failed to fetch projects.");
    } finally {
      setLoading(false);
    }
  };

  // --- Add Project ---
  const addProject = async (
    newProject = { name: "Untitled Project", budget: 0, location: "Unknown" },
  ) => {
    isAuthenticated();

    try {
      const newDocRef = doc(collection(db, "projects"));

      await setDoc(newDocRef, {
        ...newProject,
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        order: projects.length, // Set order dynamically
      });

      setProjects((prevProjects) => {
        const addedProject = { id: newDocRef.id, ...newProject };
        if (!prevProjects.some((p) => p.id === addedProject.id)) {
          toastSuccess("Project added successfully!");
          return [...prevProjects, addedProject];
        }
        return prevProjects;
      });
    } catch (err) {
      console.error(`Error adding project "${newProject.name}":`, err.message);
      toastError("Failed to add project.");
      throw err;
    }
  };

  // --- Update Project ---
  const updateProject = async (updatedProject) => {
    isAuthenticated();
    const docRef = doc(db, "projects", updatedProject.id);

    try {
      await updateDoc(docRef, updatedProject);

      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === updatedProject.id ? updatedProject : project,
        ),
      );
      toastSuccess("Project updated successfully!");
    } catch (error) {
      console.error(
        `Error updating project "${updatedProject.name}":`,
        error.message,
      );
      toastError("Failed to update project.");
    }
  };

  // --- Delete Project ---
  const deleteProject = async (id) => {
    isAuthenticated();

    try {
      const batch = writeBatch(db);

      await Promise.all(
        SUBCOLLECTIONS.map(async (sub) => {
          try {
            const subSnap = await getDocs(
              collection(db, `projects/${id}/${sub}`),
            );
            subSnap.forEach((docSnap) => batch.delete(docSnap.ref));
          } catch (err) {
            console.warn(`Failed to delete subcollection: ${sub}`, err.message);
          }
        }),
      );

      batch.delete(doc(db, "projects", id));
      await batch.commit();

      setProjects((prev) => prev.filter((project) => project.id !== id));
      toastSuccess("Project deleted successfully!");
    } catch (err) {
      console.error(`Error deleting project with ID "${id}":`, err.message);
      toastError("Failed to delete project.");
    }
  };

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        loading,
        fetchProjects, // Consolidated function
        addProject,
        updateProject,
        deleteProject,
        setProjects,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};
