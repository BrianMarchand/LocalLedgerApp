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

  useEffect(() => {
    if (currentUser) {
      console.log("Authenticated user:", currentUser.uid);
      fetchProjectsFromDB(currentUser, setProjects); // Pass full user object
    } else {
      console.warn("No authenticated user found.");
    }
  }, [currentUser]);

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
          handleClose={() => setShowModal(false)}
          saveProject={addProject}
        />
      </div>
    </div>
  );
}

export default ProjectList;
