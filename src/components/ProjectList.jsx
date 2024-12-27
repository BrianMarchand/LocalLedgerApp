import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';

function ProjectList() {
  const navigate = useNavigate();

  // --- State Management ---
  const [projects, setProjects] = useState([]); // Store projects from Firestore
  const [editingProject, setEditingProject] = useState(null); // Track project being edited
  const [tempProjects, setTempProjects] = useState([]); // Store temporary projects

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
  const startNewProject = () => {
    const tempProject = {
      id: `temp-${Date.now()}`, // Temporary ID
      name: "",
      location: "",
      budget: "",
      status: "new",
      statusDate: new Date(),
      statusNote: "",
      isTemp: true, // Mark as temporary
    };
    setEditingProject(tempProject); // Start editing mode
    setTempProjects([tempProject]); // Add to temporary list
  };

  // --- Save Project ---
  const saveProject = async () => {
    if (!editingProject.name || !editingProject.status) {
      alert("Please fill out all required fields.");
      return; // Prevent saving invalid data
    }
  
    try {
      if (editingProject.isTemp) {
        // Create a new project in Firestore
        const newDoc = await addDoc(collection(db, 'projects'), {
          name: editingProject.name,
          location: editingProject.location,
          budget: editingProject.budget,
          status: editingProject.status,
          statusDate: new Date(),
          statusNote: editingProject.statusNote,
        });
  
        console.log('New project saved:', newDoc.id);
        setTempProjects([]); // Clear temporary projects
      } else {
        // Update existing project
        const docRef = doc(db, 'projects', editingProject.id);
        await updateDoc(docRef, editingProject);
      }
  
      // Refresh the project list
      await fetchProjects(); // Important: Ensure all data reloads
      setEditingProject(null); // Exit edit mode
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  // --- Cancel Button ---
  const cancelEdit = () => {
    if (editingProject.isTemp) {
      setTempProjects([]); // Remove temporary projects
    }
    setEditingProject(null); // Exit edit mode
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

  // --- Status Color Mapping ---
const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'new':
      return 'primary';
    case 'in-progress':
      return 'warning';
    case 'completed':
      return 'success';
    case 'on-hold':
      return 'secondary';
    case 'cancelled':
      return 'danger';
    default:
      return 'light';
  }
};

// --- Format Timestamp ---
const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";

  // Handle Firestore Timestamp or JavaScript Date
  const date = timestamp.toDate ? timestamp.toDate() : timestamp;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};


const combinedProjects = [...tempProjects, ...projects]; // Merge temp and saved projects

  return (

    
<div className="navbar-padding"> {/* Apply padding here */}
  <div className="sticky-navbar bg-dark">
    <div className="container py-3">
      <div className="row align-items-center">
        <div className="col-auto">
          <h1 className="h4 text-white mb-0">Local Unlimited Project Tracker</h1>
        </div>
        <div className="col text-end">
          <button className="btn btn-light btn-sm" onClick={startNewProject}>
            <i className="bi bi-plus-lg me-1"></i> New Project
          </button>
        </div>
      </div>
    </div>
  </div>

    <div className="container mt-4">
      <h1 className="mb-4">Your current projects:</h1>

      {/* Show Projects */}
      {combinedProjects.length === 0 ? (
  <p>No projects available. <a href="#" onClick={startNewProject}>Start your first project!</a></p>
) : (
        <div className="row">
        {combinedProjects.map((project) => (
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
      
                    <div className="d-flex gap-2">
                      <button className="btn btn-success" onClick={saveProject}>
                        Save
                      </button>
      
                      <button
  className="btn btn-secondary"
  onClick={() => cancelEdit()} // Properly handle cancellation
>
  Cancel
</button>
                    </div>
                  </>
                ) : (
                  // --- Display Project Details ---
                  <>
                    <h5 className="card-title">{project.name || "New Project"}</h5>
                    <p className="card-text">
                      Location: {project.location || "N/A"} <br />
                      Budget: ${project.budget || 0} <br />
                      Status: <span className={`badge bg-${getStatusColor(project.status)} me-2`}>{project.status || "N/A"}</span><br />
                      Created: <span className="text-dark">{formatDate(project.statusDate)}</span>
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
    </div></div>
  );
}

export default ProjectList;