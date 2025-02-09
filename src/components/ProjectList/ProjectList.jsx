// File: src/pages/ProjectList.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
} from "firebase/firestore";
import { db } from "@config";
import { Spinner } from "react-bootstrap";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import { useProjects } from "../../context/ProjectsContext";
import { useAuth } from "../../context/AuthContext";
import QuickActions from "../../components/QuickActions";
import AddProjectModal from "../../components/AddProjectModal";
import TransactionModal from "../../components/TransactionModal";
import CustomerModal from "../../components/CustomerModal";
import ProjectCard from "./ProjectCard";
import LoadingSpinner from "../LoadingSpinner";
import { fetchProjectsFromDB, handleDragEnd } from "./projectUtils";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./ProjectList.css";
import { toastError, toastSuccess } from "../../utils/toastNotifications";
import {
  saveNewCustomer,
  updateExistingCustomer,
} from "../../../firebase/customerAPI";
import Layout from "../../components/Layout";
import ActivityTicker from "../../components/ActivityTicker";

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
  const { currentUser } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    if (currentUser) {
      console.log("Authenticated user:", currentUser.uid);
      fetchProjectsFromDB(currentUser, setProjects);
    } else {
      console.warn("No authenticated user found.");
    }
  }, [currentUser]);

  useEffect(() => {
    const activitiesQuery = query(
      collection(db, "activity"),
      orderBy("timestamp", "desc"),
      limit(3)
    );
    const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
      const activitiesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecentActivities(activitiesList);
    });
    return () => unsubscribe();
  }, []);

  const handleTransactionSave = async (newTransaction) => {
    if (!newTransaction.projectId) {
      toastError("Please select a project first.");
      return;
    }
    try {
      const transactionsRef = collection(
        db,
        `projects/${newTransaction.projectId}/transactions`
      );
      await addDoc(transactionsRef, {
        ...newTransaction,
        date: new Date(newTransaction.date),
        createdAt: new Date(),
      });
      toastSuccess("Transaction added successfully!");
    } catch (error) {
      console.error("Error adding transaction:", error.message);
      toastError("Failed to add transaction.");
    }
  };

  const formatActivity = (activity) => {
    const dateStr = activity.timestamp
      ? new Date(activity.timestamp.seconds * 1000).toLocaleDateString(
          "en-US",
          {
            day: "numeric",
            month: "long",
            year: "numeric",
          }
        )
      : "";
    let eventType = activity.title || "Event";
    let message = activity.description || "";
    return { dateStr, eventType, message };
  };

  return (
    <Layout
      pageTitle="Project List"
      activities={recentActivities}
      formatActivity={formatActivity}
      onAddProject={() => setShowModal(true)}
      onAddTransaction={() => setShowTransactionModal(true)}
      onAddCustomer={() => setShowCustomerModal(true)}
    >
      <div className="container-fluid">
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
              setIsUpdating(true);
              handleDragEnd(
                result,
                projects,
                setProjects,
                fetchProjects,
                () => {
                  setTimeout(() => setIsUpdating(false), 500);
                }
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
                      setEditingProject={setEditingProject}
                      setShowModal={setShowModal}
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
            setEditingProject(null);
          }}
          saveProject={addProject}
          editingProject={editingProject}
        />
        <TransactionModal
          show={showTransactionModal}
          handleClose={() => setShowTransactionModal(false)}
          handleSave={handleTransactionSave}
          projects={projects}
        />
        <CustomerModal
          show={showCustomerModal}
          handleClose={() => setShowCustomerModal(false)}
          handleSave={saveNewCustomer}
          handleEditCustomer={updateExistingCustomer}
        />
      </div>
    </Layout>
  );
}

export default ProjectList;
