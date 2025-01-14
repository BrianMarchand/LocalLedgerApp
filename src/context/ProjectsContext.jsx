// -- Page: ProjectsContext.jsx --

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

export const ProjectsProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Firestore Listener ---
  useEffect(() => {
    if (!auth.currentUser) return;

    console.log("Setting up Firestore listener for projects...");
    const unsubscribe = onSnapshot(
      query(
        collection(db, "projects"),
        where("ownerId", "==", auth.currentUser.uid),
        orderBy("order", "asc"),
      ),
      (snapshot) => {
        const projects = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProjects(projects);
        console.log("Projects fetched and updated in state:", projects);
      },
      (error) => {
        console.error("Error with Firestore listener:", error);
      },
    );

    return () => {
      console.log("Cleaning up Firestore listener...");
      unsubscribe();
    };
  }, [auth.currentUser?.uid]);

  // --- Fetch Projects with Transactions ---
  const fetchProjectsWithTransactions = async () => {
    try {
      const snapshot = await getDocs(
        query(collection(db, "projects"), orderBy("order", "asc")),
      );

      const projectsWithTransactions = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const project = { id: docSnap.id, ...docSnap.data() };

          const transactionsSnap = await getDocs(
            collection(db, `projects/${project.id}/transactions`),
          );

          project.transactions = transactionsSnap.docs.map((txSnap) =>
            txSnap.data(),
          );

          return project;
        }),
      );

      setProjects(projectsWithTransactions);
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
  };

  // --- Add Project ---
  const addProject = async (newProject) => {
    try {
      if (!auth.currentUser) throw new Error("No authenticated user.");

      // Generate a new document reference with a unique ID
      const newDocRef = doc(collection(db, "projects"));

      // Add the new project with the generated ID
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
      console.error("Error adding project:", err.message);
      toastError("Failed to add project.");
      throw err; // Rethrow for upstream error handling
    }
  };

  // --- Update Project ---
  const updateProject = async (updatedProject) => {
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
      console.error("Error updating project:", error.message);
      toastError("Failed to update project.");
    }
  };

  // --- Delete Project ---
  const deleteProject = async (id) => {
    try {
      if (!auth.currentUser) throw new Error("No authenticated user.");

      const batch = writeBatch(db);
      ["transactions", "shoppingList", "notes"].forEach(async (sub) => {
        const subSnap = await getDocs(collection(db, `projects/${id}/${sub}`));
        subSnap.forEach((docSnap) => batch.delete(docSnap.ref));
      });

      batch.delete(doc(db, "projects", id));
      await batch.commit();

      setProjects((prev) => prev.filter((project) => project.id !== id));
      toastSuccess("Project deleted successfully!");
    } catch (err) {
      console.error("Error deleting project:", err.message);
      toastError("Failed to delete project.");
    }
  };

  return (
    <ProjectsContext.Provider
      value={{
        projects,
        loading,
        fetchProjects: fetchProjectsWithTransactions, // Correct mapping here
        addProject,
        updateProject, // <-- Add updateProject to the context
        deleteProject,
        setProjects,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};
