import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

function ProjectList() {
  const navigate = useNavigate();

  // State Management
  const [projects, setProjects] = useState([]); // Store projects from Firestore

// Fetch projects from Firestore
const fetchProjects = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'projects')); // Firestore query
    const projectList = querySnapshot.docs.map(doc => ({
      id: doc.id, // Use Firestore doc ID
      ...doc.data(),
    }));
    setProjects(projectList); // Update state
  } catch (error) {
    console.error('Error fetching projects:', error);
  }
};

// Load projects on component mount
useEffect(() => {
  fetchProjects();
}, []);

  const [editingProject, setEditingProject] = useState(null);

  // --- Start New Project ---
  const startNewProject = async () => {
    const newProject = {
      name: "",
      location: "",
      budget: "",
      status: "",
    };
  
    try {
      const docRef = await addDoc(collection(db, 'projects'), newProject); // Save to Firestore
      fetchProjects(); // Refresh project list
      setEditingProject({ id: docRef.id, ...newProject }); // Start editing new project
    } catch (error) {
      console.error('Error adding project:', error);
    }
  };

// --- Save Project ---
const saveProject = async () => {
  // --- Validation Check ---
  if (!editingProject.name || !editingProject.status) { // Check for empty name or status
    alert("Please fill out all required fields before saving."); // Show error message
    return; // Stop the save if validation fails
  }

  try {
    // Reference Firestore doc
    const docRef = doc(db, 'projects', editingProject.id);

    // Update in Firestore
    await updateDoc(docRef, editingProject);

    // Refresh project list
    fetchProjects();

    // Exit edit mode
    setEditingProject(null);

    // Navigate to the project dashboard
    navigate(`/project/${editingProject.id}`);
  } catch (error) {
    console.error('Error updating project:', error); // Log any errors
  }
};

  // --- Delete Project ---
  const deleteProject = async (id) => {
    try {
      const docRef = doc(db, 'projects', id); // Reference Firestore doc
      await deleteDoc(docRef); // Delete from Firestore
      fetchProjects(); // Refresh project list
    } catch (error) {
      console.error('Error deleting project:', error);
    }
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