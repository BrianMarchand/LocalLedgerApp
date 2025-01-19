// --- Page: ProjectsContext.jsx ---
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
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

// --- Authentication Check ---
const isAuthenticated = () => {
  if (!auth.currentUser) {
    toastError("No authenticated user.");
    return false;
  }
  return true;
};

export const ProjectsProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false); // ✅ New state
  const [isReordering, setIsReordering] = useState(false); // ✅ Track reordering
  const prevProjectsRef = useRef(null); // ✅ Store previous project order

  // --- Firestore Listener ---
  useEffect(() => {
    let unsubscribeFirestore = null;

    const setupFirestoreListener = (user) => {
      if (!user) return;

      console.log("✅ User authenticated. Setting up Firestore listener...");

      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }

      unsubscribeFirestore = onSnapshot(
        query(
          collection(db, "projects"),
          where("ownerId", "==", user.uid),
          orderBy("order", "asc"),
        ),
        (snapshot) => {
          const updatedProjects = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          // 🚀 Prevent flickering: Only update if projects actually changed
          const prevOrder = prevProjectsRef.current?.map((p) => p.id).join(",");
          const newOrder = updatedProjects.map((p) => p.id).join(",");

          if (prevOrder === newOrder) {
            console.log("🔄 Skipping UI update (Order unchanged)");
            return;
          }

          console.log("✅ Projects fetched:", updatedProjects);
          prevProjectsRef.current = updatedProjects;
          setProjects(updatedProjects);
        },
        (error) => {
          console.error("🔥 Firestore listener error:", error.message);
        },
      );
    };

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setupFirestoreListener(user);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  // --- Fetch Projects (Manual Call) ---
  const fetchProjects = async (includeTransactions = false) => {
    if (dragging) return; // ✅ Skip fetching if drag is active

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
    newProject = {
      name: "Untitled Project",
      budget: 0,
      location: "Unknown",
      estimatedCompletionDate: null,
    },
  ) => {
    if (!isAuthenticated()) return;

    try {
      const newDocRef = doc(collection(db, "projects"));

      const projectData = {
        ...newProject,
        ownerId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        order: projects.length, // Set order dynamically
      };

      await setDoc(newDocRef, projectData);

      toastSuccess("Project added successfully!");
    } catch (err) {
      console.error(`Error adding project "${newProject.name}":`, err.message);
      toastError("Failed to add project.");
      throw err;
    }
  };

  // --- Update Project ---
  const updateProject = async (updatedProject) => {
    if (!isAuthenticated()) return;
    const docRef = doc(db, "projects", updatedProject.id);

    try {
      await updateDoc(docRef, updatedProject);

      setProjects((prevProjects) =>
        prevProjects.map((project) =>
          project.id === updatedProject.id
            ? { ...project, ...updatedProject }
            : project,
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
    if (!isAuthenticated()) return;

    try {
      const batch = writeBatch(db);

      for (const sub of SUBCOLLECTIONS) {
        const subSnap = await getDocs(collection(db, `projects/${id}/${sub}`));
        subSnap.forEach((docSnap) => batch.delete(docSnap.ref));
      }

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
        fetchProjects,
        addProject,
        updateProject,
        deleteProject,
        setProjects,
        setDragging,
        isReordering,
        setIsReordering,
      }}
    >
      {children}
    </ProjectsContext.Provider>
  );
};
