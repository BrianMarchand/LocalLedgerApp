// --- Page: ProjectList.jsx ---

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../../context/ProjectsContext";
import Navbar from "../Navbar";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./ProjectList.css";
import AddProjectModal from "../AddProject/AddProjectModal";
import { Spinner } from "react-bootstrap";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import ProjectCard from "./ProjectCard";
import { fetchProjectsFromDB, handleDragEnd } from "./projectUtils";
import { useAuth } from "../../context/AuthContext"; // Uses Firebase AuthContext

function ProjectList() {
  const navigate = useNavigate();
  const { projects, setProjects, loading, addProject, fetchProjects } =
    useProjects();
  const { currentUser } = useAuth(); // This is already handling auth
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    if (currentUser) {
      console.log("Authenticated user:", currentUser.uid);
      fetchProjectsFromDB(currentUser, setProjects); // Pass full user object
    } else {
      console.warn("No authenticated user found.");
    }
  }, [currentUser]);

  // ✅ Function to determine correct status when reopening a project
  const handleReopenProject = async (project) => {
    try {
      const transactionsRef = collection(
        db,
        `projects/${project.id}/transactions`,
      );
      const transactionsSnap = await getDocs(transactionsRef);
      const transactions = transactionsSnap.docs.map((doc) => doc.data());

      // Check if any transactions contain "deposit" and are in "Client Payment"
      const hasDeposit = transactions.some(
        (t) =>
          t.category === "Client Payment" &&
          t.description?.toLowerCase().includes("deposit"),
      );

      const newStatus = hasDeposit ? "in-progress" : "new"; // ✅ Determine correct status

      // Confirm action
      const result = await Swal.fire({
        title: "Reopen Project?",
        text: `Reopening "${project.name}". Status will be set to "${newStatus}".`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#ffc107",
        cancelButtonColor: "#3085d6",
        confirmButtonText: "Yes, reopen it!",
        cancelButtonText: "Cancel",
      });

      if (result.isConfirmed) {
        // Update Firestore
        const docRef = doc(db, "projects", project.id);
        await updateDoc(docRef, {
          status: newStatus,
          statusDate: new Date(),
        });

        toastSuccess(`Project "${project.name}" reopened as "${newStatus}".`);
        fetchProjects(); // ✅ Refresh projects
      }
    } catch (error) {
      console.error("Error reopening project:", error);
      toastError("Failed to reopen project.");
    }
  };

  return (
    <div>
      <Navbar page="projectDashboard" />
      <div className="container mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>Your Current Projects</h1>
          <p>Something here.</p>
        </div>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p>Loading Your Projects...</p>
          </div>
        ) : (
          <DragDropContext
            onDragEnd={(result) => handleDragEnd(result, projects, setProjects)}
          >
            <Droppable droppableId="projects">
              {(provided) => (
                <div
                  className="row mt-5"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {projects.map((project, index) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      index={index}
                      fetchProjects={fetchProjects}
                      transactions={project.transactions || []}
                      setEditingProject={setEditingProject} // ✅ Allows editing
                      setShowModal={setShowModal} // ✅ Opens modal
                    />
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        <AddProjectModal
          show={showModal}
          handleClose={() => {
            setShowModal(false);
            setEditingProject(null); // Reset after closing
          }}
          saveProject={addProject}
          editingProject={editingProject} // Pass the selected project for editing
        />
      </div>
    </div>
  );
}

export default ProjectList;
