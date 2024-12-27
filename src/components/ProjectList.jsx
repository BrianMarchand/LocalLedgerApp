import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

function ProjectList() {
  const navigate = useNavigate();

  // --- State Management ---
  const [projects, setProjects] = useState([]); // Store projects from Firestore
  const [editingProject, setEditingProject] = useState(null); // Track project being edited

  // --- Fetch Projects ---
  const fetchProjects = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'projects')); // Query Firestore
      const projectList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(projectList); // Update state
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  // --- Load Data on Component Mount ---
  useEffect(() => {
    fetchProjects(); // Fetch projects initially
  }, []);

  // --- Start New Project ---
  const startNewProject = async () => {
    const newProject = {
      name: "",
      location: "",
      budget: "",
      status: "new", // Default to 'new'
      statusDate: new Date(), // Default to today's date
      statusNote: "",
    };

    try {
      const docRef = await addDoc(collection(db, 'projects'), newProject); // Add to Firestore
      fetchProjects(); // Refresh list
      setEditingProject({ id: docRef.id, ...newProject }); // Enter edit mode
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

  // --- Save Project ---
  const saveProject = async () => {
    // --- Validation ---
    if (!editingProject.name || !editingProject.status) {
      alert("Please fill out all required fields.");
      return; // Prevent saving invalid data
    }

    try {
      const docRef = doc(db, 'projects', editingProject.id);
      await updateDoc(docRef, editingProject); // Update Firestore
      fetchProjects(); // Refresh project list
      setEditingProject(null); // Exit edit mode
      navigate(`/project/${editingProject.id}`); // Go to project details
    } catch (error) {
      console.error('Error updating project:', error);
    }
  };

  // --- Delete Project ---
  const deleteProject = async (id) => {
    try {
      const docRef = doc(db, 'projects', id);
      await deleteDoc(docRef); // Remove from Firestore
      fetchProjects(); // Refresh project list
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  // --- Status Badge Styles ---
  const getStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return 'badge bg-secondary'; // Gray
      case 'in-progress':
        return 'badge bg-primary'; // Blue
      case 'completed':
        return 'badge bg-success'; // Green
      case 'on-hold':
        return 'badge bg-warning'; // Yellow
      case 'cancelled':
        return 'badge bg-danger'; // Red
      default:
        return 'badge bg-light'; // Default
    }
  };

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Welcome to the Local Unlimited Project Tracker</h1>

      {/* Start New Project Button */}
      <button className="btn btn-primary mb-3" onClick={startNewProject}>
        Start a New Project
      </button>

      {/* Show Projects */}
      {projects.length === 0 ? (
        <p>No projects available. Start your first project!</p>
      ) : (
        <div className="row">
          {projects.map((project) => (
            <div key={project.id} className="col-md-4 mb-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  {/* --- Inline Edit Mode --- */}
                  {editingProject && editingProject.id === project.id ? (
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

                      {/* --- Status Dropdown --- */}
                      <select
                        className="form-select mb-2"
                        value={editingProject.status}
                        onChange={(e) =>
                          setEditingProject({ ...editingProject, status: e.target.value })
                        }
                      >
                        <option value="new">New</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="on-hold">On Hold</option>
                        <option value="cancelled">Cancelled</option>
                      </select>

                      <textarea
                        className="form-control mb-2"
                        placeholder="Notes (Optional)"
                        value={editingProject.statusNote}
                        onChange={(e) =>
                          setEditingProject({ ...editingProject, statusNote: e.target.value })
                        }
                      ></textarea>

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
                        Status: <span className={getStatusBadge(project.status)}>
                          {project.status}
                        </span>
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