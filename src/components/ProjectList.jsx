import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function ProjectList() {
  const navigate = useNavigate();

  // State Management
  const [projects, setProjects] = useState(() => {
    const savedProjects = localStorage.getItem("projects");
    return savedProjects ? JSON.parse(savedProjects) : [];
  });

  const [editingProject, setEditingProject] = useState(null);

  // --- Start New Project ---
  const startNewProject = () => {
    const newProject = {
      id: Date.now(),
      name: "",
      location: "",
      budget: "",
      status: "Pending",
    };

    // Add placeholder project to the list
    setProjects([...projects, newProject]);
    setEditingProject(newProject);
  };

  // --- Save Project ---
  const saveProject = () => {
    const updatedProjects = projects.map((project) =>
      project.id === editingProject.id ? editingProject : project
    );

    // Update state and local storage
    setProjects(updatedProjects);
    localStorage.setItem("projects", JSON.stringify(updatedProjects));

    // Navigate to Project Dashboard
    navigate(`/project/${editingProject.id}`);
  };

  // --- Delete Project ---
  const deleteProject = (id) => {
    const updatedProjects = projects.filter((project) => project.id !== id);
    setProjects(updatedProjects);
    localStorage.setItem("projects", JSON.stringify(updatedProjects));
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Welcome to the Local Unlimited Project Tracker</h1>
      <button className="btn btn-primary mb-3" onClick={startNewProject}>
        Start a New Project
      </button>

      {projects.length === 0 ? (
        <p>No projects available. Start your first project!</p>
      ) : (
        <div className="row">
          {projects.map((project) => (
            <div key={project.id} className="col-md-4 mb-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  {editingProject && editingProject.id === project.id ? (
                    // --- Inline Edit Form ---
                    <>
                      <input
                        type="text"
                        placeholder="Project Name"
                        value={editingProject.name}
                        className="form-control mb-2"
                        onChange={(e) =>
                          setEditingProject({ ...editingProject, name: e.target.value })
                        }
                      />
                      <input
                        type="text"
                        placeholder="Location"
                        value={editingProject.location}
                        className="form-control mb-2"
                        onChange={(e) =>
                          setEditingProject({ ...editingProject, location: e.target.value })
                        }
                      />
                      <input
                        type="number"
                        placeholder="Budget"
                        value={editingProject.budget}
                        className="form-control mb-2"
                        onChange={(e) =>
                          setEditingProject({ ...editingProject, budget: e.target.value })
                        }
                      />
                      <select
                        className="form-select mb-2"
                        value={editingProject.status}
                        onChange={(e) =>
                          setEditingProject({ ...editingProject, status: e.target.value })
                        }
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                      </select>
                      <button className="btn btn-success" onClick={saveProject}>
                        Save
                      </button>
                    </>
                  ) : (
                    // --- Display Project Details ---
                    <>
                      <h5 className="card-title">{project.name || "New Project"}</h5>
                      <p className="card-text">
                        Location: {project.location || "N/A"} <br />
                        Budget: ${project.budget || 0} <br />
                        Status: {project.status}
                      </p>
                      <button
                        className="btn btn-primary me-2"
                        onClick={() => navigate(`/project/${project.id}`)}
                      >
                        View Project
                      </button>
                      <button
                        className="btn btn-secondary me-2"
                        onClick={() => setEditingProject(project)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => deleteProject(project.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProjectList;