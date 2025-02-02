// File: src/pages/ProjectList.jsx 

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
import LoadingSpinner from "../LoadingSpinner"; // Import the spinner
import { fetchProjectsFromDB, handleDragEnd } from "./projectUtils";
import { useAuth } from "../../context/AuthContext"; // Uses Firebase AuthContext
import QuickActions from "../../components/QuickActions";

function ProjectList() {
  const navigate = useNavigate();
  const {
    projects,
    setProjects,
    fetchProjects,
    loading,
    addProject,
    setIsReordering,
  } = useProjects();
  const { currentUser } = useAuth(); // This is already handling auth
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false); // State for loading animation

  useEffect(() => {
    if (currentUser) {
      console.log("Authenticated user:", currentUser.uid);
      fetchProjectsFromDB(currentUser, setProjects); // Pass full user object
    } else {
      console.warn("No authenticated user found.");
    }
  }, [currentUser]);

  // Function to determine correct status when reopening a project (code omitted for brevity)
  // ...

  return (
    <div>
      <Navbar page="projectDashboard" />
      <div className="container-fluid mt-5">
        <div className="container-xl">
          {/* Quick Actions Header */}
          <div className="dashboard-header mb-4">
            <h1 className="dashboard-title">Current Projects</h1>
            <div className="quick-actions-wrapper">
              <QuickActions
                onAddProject={() => setShowModal(true)}
                onAddTransaction={() => setShowTransactionModal(true)}
              />
            </div>
          </div>
          {loading && !isUpdating ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p>Loading Your Projects...</p>
            </div>
          ) : (
            <DragDropContext
              onDragEnd={(result) => {
                setIsUpdating(true); // Show loading animation on reorder
                handleDragEnd(
                  result,
                  projects,
                  setProjects,
                  fetchProjects,
                  () => {
                    setTimeout(() => setIsUpdating(false), 500); // Delay UI flicker
                  },
                );
              }}
            >
              {isUpdating && <LoadingSpinner text="Updating order..." />}
              <Droppable droppableId="projects" direction="horizontal">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="d-flex flex-wrap"
                    style={{
                      width: "100%",
                      maxWidth: "1250px",
                      margin: "0 auto",
                      gap: "20px",
                      justifyContent: "flex-start",
                      alignItems: "stretch",
                      opacity: isUpdating ? 0.5 : 1,
                      pointerEvents: isUpdating ? "none" : "auto",
                    }}
                  >
                    {projects.map((project, index) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        index={index}
                        fetchProjects={fetchProjects}
                        setEditingProject={setEditingProject}  // Pass the edit handler
                        setShowModal={setShowModal}            // Pass the modal handler
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
    </div>
  );
}

export default ProjectList;