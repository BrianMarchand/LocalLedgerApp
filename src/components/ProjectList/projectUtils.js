import { db } from "@config";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  writeBatch,
  query,
  orderBy,
  where,
} from "firebase/firestore";

// --- Fetch All Projects ---
// --- Fetch All Projects ---
export const fetchProjectsFromDB = async (user, setProjects) => {
  // Ensure we have a valid user object
  if (!user || !user.uid) {
    console.error("User is not authenticated or missing UID.");
    return;
  }

  try {
    console.log(`Fetching projects for user: ${user.uid}`); // Debug log
    const snapshot = await getDocs(
      query(
        collection(db, "projects"),
        where("ownerId", "==", user.uid), // Ensure we only pass UID
        orderBy("order", "asc"),
      ),
    );

    const projectList = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log("Fetched Projects:", projectList);
    setProjects(projectList);
  } catch (error) {
    console.error("Error fetching projects:", error);
  }
};

// --- Update Project Status ---
export const updateProjectStatus = async (projectId, newStatus) => {
  try {
    const docRef = doc(db, "projects", projectId);
    await updateDoc(docRef, {
      status: newStatus,
      statusDate: new Date(),
    });
    console.log(`Project ${projectId} updated to status: ${newStatus}`);
  } catch (error) {
    console.error("Error updating project status:", error);
  }
};

// --- Add New Project ---
export const addNewProject = async (newProject) => {
  try {
    const snapshot = await getDocs(
      query(collection(db, "projects"), orderBy("order", "asc")),
    );
    const batch = writeBatch(db);

    snapshot.docs.forEach((docSnap) => {
      const projRef = doc(db, "projects", docSnap.id);
      const currentOrder = docSnap.data().order || 0;
      batch.update(projRef, { order: currentOrder + 1 });
    });

    await batch.commit(); // Update orders before adding the new project

    const newDoc = await addDoc(collection(db, "projects"), {
      ...newProject,
      order: 0,
      createdAt: new Date(),
    });

    console.log("New Project Added:", newDoc.id);
    return newDoc.id;
  } catch (error) {
    console.error("Error adding project:", error);
  }
};

// --- Drag & Drop Projects ---
export const handleDragEnd = async (result, projects, setProjects) => {
  const { source, destination } = result;

  if (!destination || destination.index === source.index) return;

  const reorderedProjects = Array.from(projects);
  const [movedProject] = reorderedProjects.splice(source.index, 1);
  reorderedProjects.splice(destination.index, 0, movedProject);

  setProjects(reorderedProjects); // Optimistic UI update

  try {
    const batch = writeBatch(db);
    reorderedProjects.forEach((proj, index) => {
      const projRef = doc(db, "projects", proj.id);
      batch.update(projRef, { order: index });
    });

    await batch.commit();
    console.log("Project order updated successfully!");
  } catch (error) {
    console.error("Error updating project order:", error);
  }
};
