// File: src/pages/ProjectList.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, Link, Navigate } from "react-router-dom";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@config";
import { Spinner } from "react-bootstrap";
import { useProjects } from "../../context/ProjectsContext";
import { useAuth } from "../../context/AuthContext";
import QuickActions from "../../components/QuickActions";
import AddProjectModal from "../../components/AddProjectModal";
import TransactionModal from "../../components/TransactionModal";
import CustomerModal from "../../components/CustomerModal";
import ProjectCard from "./ProjectCard";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./ProjectList.css";
import Swal from "sweetalert2";
import { toastError, toastSuccess } from "../../utils/toastNotifications";
import {
  saveNewCustomer,
  updateExistingCustomer,
} from "../../../firebase/customerAPI";
import Layout from "../../components/Layout";

function ProjectList() {
  const navigate = useNavigate();
  const { projects, setProjects, fetchProjects, loading, addProject } =
    useProjects();
  const { currentUser } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [viewMode, setViewMode] = useState("cards");
  // Build a mapping of customerId => "FirstName LastName"
  const [customerMap, setCustomerMap] = useState({});

  // Realtime listener for projects
  useEffect(() => {
    if (currentUser) {
      console.log("Authenticated user:", currentUser.uid);
      const projectsQuery = query(
        collection(db, "projects"),
        where("ownerId", "==", currentUser.uid),
        orderBy("order", "asc")
      );
      const unsubscribe = onSnapshot(
        projectsQuery,
        (snapshot) => {
          const newProjectList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setProjects(newProjectList);
        },
        (error) => {
          console.error("Error fetching projects:", error);
        }
      );
      return () => unsubscribe();
    } else {
      console.warn("No authenticated user found.");
    }
  }, [currentUser, setProjects]);

  // Real-time listener for customers
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "customers"),
      (snapshot) => {
        const map = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          map[doc.id] = `${data.firstName} ${data.lastName}`;
        });
        setCustomerMap(map);
      },
      (error) => {
        console.error("Error fetching customers for list view", error);
      }
    );
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

  // Separate projects by type
  const fixedProjects = projects.filter(
    (p) => (p.projectType || "fixed") === "fixed"
  );
  const tmProjects = projects.filter(
    (p) => (p.projectType || "fixed") === "time_and_materials"
  );

  // Helper function to confirm actions
  const confirmAction = async (action, title, text, successMessage) => {
    const result = await Swal.fire({
      title,
      text,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, proceed!",
      cancelButtonText: "Cancel",
    });
    if (result.isConfirmed) {
      await action();
      toastSuccess(successMessage);
    }
  };

  // Render cards view
  const renderCards = () => (
    <>
      {fixedProjects.length > 0 && (
        <section className="mb-5">
          <h2>Fixed Budget Projects</h2>
          <div className="project-list-grid">
            {fixedProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                fetchProjects={fetchProjects}
                setEditingProject={setEditingProject}
                setShowModal={setShowModal}
              />
            ))}
          </div>
        </section>
      )}
      {tmProjects.length > 0 && (
        <section className="mb-5">
          <h2>Time &amp; Materials Projects</h2>
          <div className="project-list-grid">
            {tmProjects.map((project, index) => (
              <ProjectCard
                key={project.id}
                project={project}
                index={index}
                fetchProjects={fetchProjects}
                setEditingProject={setEditingProject}
                setShowModal={setShowModal}
              />
            ))}
          </div>
        </section>
      )}
    </>
  );

  // Render list view as a table-like layout using divs.
  const renderList = () => {
    const renderFixedList = () => (
      <>
        <h2>Fixed Budget Projects</h2>
        <div className="project-list-table global-card">
          <div className="project-header-row">
            <div className="project-cell" style={{ flex: "1.5" }}>
              Project Name
            </div>
            <div className="project-cell" style={{ flex: "1.2" }}>
              Location
            </div>
            <div className="project-cell" style={{ flex: "1.2" }}>
              Estimated Completion
            </div>
            <div className="project-cell" style={{ flex: "1.5" }}>
              Customer
            </div>
            <div className="project-cell" style={{ flex: "1.2" }}>
              Budget
            </div>
            <div className="project-cell" style={{ flex: "1" }}>
              Transactions
            </div>
            <div className="project-cell" style={{ flex: "1" }}>
              Status
            </div>
            <div className="project-cell" style={{ flex: "2" }}>
              Status Note
            </div>
            <div className="project-cell" style={{ flex: "1" }}>
              Progress
            </div>
            <div className="project-cell" style={{ flex: "0 0 150px" }}>
              Actions
            </div>
          </div>
          {fixedProjects.map((project) => {
            const progress = project.progress || "0%";
            const totalIncome = project.transactions
              ? project.transactions
                  .filter((t) => t.category === "Client Payment")
                  .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0)
              : 0;
            return (
              <div key={project.id} className="project-row">
                <div className="project-cell" style={{ flex: "1.5" }}>
                  {project.name || "Unnamed"}
                </div>
                <div className="project-cell" style={{ flex: "1.2" }}>
                  {project.location || "N/A"}
                </div>
                <div className="project-cell" style={{ flex: "1.2" }}>
                  {project.estimatedCompletionDate
                    ? new Date(
                        project.estimatedCompletionDate
                      ).toLocaleDateString()
                    : "Not Set"}
                </div>
                <div className="project-cell" style={{ flex: "1.5" }}>
                  {customerMap[project.customerId] || "N/A"}
                </div>
                <div className="project-cell" style={{ flex: "1.2" }}>
                  $
                  {Number(project.budget)?.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }) || "0"}
                </div>
                <div className="project-cell" style={{ flex: "1" }}>
                  {project.transactions ? project.transactions.length : "0"}
                </div>
                <div className="project-cell" style={{ flex: "1" }}>
                  {project.status}
                </div>
                <div className="project-cell" style={{ flex: "2" }}>
                  {project.statusNote || "No notes."}
                </div>
                <div className="project-cell" style={{ flex: "1" }}>
                  {progress}
                </div>
                <div
                  className="project-cell actions-cell"
                  style={{ flex: "0 0 150px" }}
                >
                  <button
                    className="btn btn-primary btn-sm"
                    title="View Project"
                    onClick={() => navigate(`/project/${project.id}`)}
                  >
                    <i className="bi bi-eye"></i>
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    title="Edit Project"
                    onClick={() => {
                      setEditingProject(project);
                      setShowModal(true);
                    }}
                  >
                    <i className="bi bi-pencil-square"></i>
                  </button>
                  {["on-hold", "cancelled", "completed"].includes(
                    project.status
                  ) ? (
                    <button
                      className="btn btn-warning btn-sm"
                      title="Reopen Project"
                      onClick={() =>
                        confirmAction(
                          async () => {
                            const projRef = doc(db, "projects", project.id);
                            await updateDoc(projRef, {
                              status: "new",
                              statusDate: new Date(),
                            });
                            fetchProjects();
                          },
                          "Reopen Project?",
                          `Reopening "${project.name}". Status will be set to "new".`,
                          `Project "${project.name}" reopened as "new".`
                        )
                      }
                    >
                      <i className="bi bi-arrow-repeat"></i>
                    </button>
                  ) : (
                    <>
                      <button
                        className="btn btn-warning btn-sm"
                        title="Put on Hold"
                        onClick={() =>
                          confirmAction(
                            async () => {
                              const projRef = doc(db, "projects", project.id);
                              await updateDoc(projRef, {
                                status: "on-hold",
                                statusDate: new Date(),
                              });
                              fetchProjects();
                            },
                            "Put Project on Hold?",
                            `Are you sure you want to put "${project.name}" on hold?`,
                            `Project "${project.name}" is now on hold.`
                          )
                        }
                      >
                        <i className="bi bi-pause-circle"></i>
                      </button>
                      {(isTM || (!isTM && totalIncome >= project.budget)) && (
                        <button
                          className="btn btn-success btn-sm"
                          title="Mark as Complete"
                          onClick={() =>
                            confirmAction(
                              async () => {
                                const projRef = doc(db, "projects", project.id);
                                await updateDoc(projRef, {
                                  status: "completed",
                                  statusDate: new Date(),
                                });
                                fetchProjects();
                              },
                              "Mark as Complete?",
                              `Mark "${project.name}" as complete? This action cannot be undone.`,
                              `Project "${project.name}" marked as complete!`
                            )
                          }
                        >
                          <i className="bi bi-check-circle"></i>
                        </button>
                      )}
                      <button
                        className="btn btn-danger btn-sm"
                        title="Cancel Project"
                        onClick={() =>
                          confirmAction(
                            async () => {
                              const projRef = doc(db, "projects", project.id);
                              await updateDoc(projRef, {
                                status: "cancelled",
                                statusDate: new Date(),
                              });
                              fetchProjects();
                            },
                            "Cancel Project?",
                            `Are you sure you want to cancel "${project.name}"? This cannot be undone.`,
                            `Project "${project.name}" has been cancelled.`
                          )
                        }
                      >
                        <i className="bi bi-x-circle"></i>
                      </button>
                    </>
                  )}
                  <button
                    className="btn btn-danger btn-sm"
                    title="Delete Project"
                    onClick={() =>
                      confirmAction(
                        async () => {
                          await deleteDoc(doc(db, "projects", project.id));
                          fetchProjects();
                        },
                        "Delete Project?",
                        `This will permanently delete the project "${project.name}".`,
                        `Project "${project.name}" has been deleted.`
                      )
                    }
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </>
    );

    const renderTMList = () => (
      <>
        <h2>Time &amp; Materials Projects</h2>
        <div className="project-list-table global-card">
          <div className="project-header-row">
            <div className="project-cell" style={{ flex: "1.5" }}>
              Project Name
            </div>
            <div className="project-cell" style={{ flex: "1.2" }}>
              Location
            </div>
            <div className="project-cell" style={{ flex: "1.2" }}>
              Estimated Completion
            </div>
            <div className="project-cell" style={{ flex: "1.5" }}>
              Customer
            </div>
            <div className="project-cell" style={{ flex: "1.2" }}>
              Day Rate
            </div>
            <div className="project-cell" style={{ flex: "1.2" }}>
              Hourly Rate
            </div>
            <div className="project-cell" style={{ flex: "1" }}>
              Transactions
            </div>
            <div className="project-cell" style={{ flex: "1" }}>
              Status
            </div>
            <div className="project-cell" style={{ flex: "2" }}>
              Status Note
            </div>
            <div className="project-cell" style={{ flex: "0 0 150px" }}>
              Actions
            </div>
          </div>
          {tmProjects.map((project) => (
            <div key={project.id} className="project-row">
              <div className="project-cell" style={{ flex: "1.5" }}>
                {project.name || "Unnamed"}
              </div>
              <div className="project-cell" style={{ flex: "1.2" }}>
                {project.location || "N/A"}
              </div>
              <div className="project-cell" style={{ flex: "1.2" }}>
                {project.estimatedCompletionDate
                  ? new Date(
                      project.estimatedCompletionDate
                    ).toLocaleDateString()
                  : "Not Set"}
              </div>
              <div className="project-cell" style={{ flex: "1.5" }}>
                {customerMap[project.customerId] || "N/A"}
              </div>
              <div className="project-cell" style={{ flex: "1.2" }}>
                $
                {Number(project.dayRate)?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0"}
              </div>
              <div className="project-cell" style={{ flex: "1.2" }}>
                $
                {Number(project.hourlyRate)?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0"}
              </div>
              <div className="project-cell" style={{ flex: "1" }}>
                {project.transactions ? project.transactions.length : "0"}
              </div>
              <div className="project-cell" style={{ flex: "1" }}>
                {project.status}
              </div>
              <div className="project-cell" style={{ flex: "2" }}>
                {project.statusNote || "No notes."}
              </div>
              <div
                className="project-cell actions-cell"
                style={{ flex: "0 0 150px" }}
              >
                <button
                  className="btn btn-primary btn-sm"
                  title="View Project"
                  onClick={() => navigate(`/project/${project.id}`)}
                >
                  <i className="bi bi-eye"></i>
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  title="Edit Project"
                  onClick={() => {
                    setEditingProject(project);
                    setShowModal(true);
                  }}
                >
                  <i className="bi bi-pencil-square"></i>
                </button>
                {["on-hold", "cancelled", "completed"].includes(
                  project.status
                ) ? (
                  <button
                    className="btn btn-warning btn-sm"
                    title="Reopen Project"
                    onClick={() =>
                      confirmAction(
                        async () => {
                          const projRef = doc(db, "projects", project.id);
                          await updateDoc(projRef, {
                            status: "new",
                            statusDate: new Date(),
                          });
                          fetchProjects();
                        },
                        "Reopen Project?",
                        `Reopening "${project.name}". Status will be set to "new".`,
                        `Project "${project.name}" reopened as "new".`
                      )
                    }
                  >
                    <i className="bi bi-arrow-repeat"></i>
                  </button>
                ) : (
                  <>
                    <button
                      className="btn btn-warning btn-sm"
                      title="Put on Hold"
                      onClick={() =>
                        confirmAction(
                          async () => {
                            const projRef = doc(db, "projects", project.id);
                            await updateDoc(projRef, {
                              status: "on-hold",
                              statusDate: new Date(),
                            });
                            fetchProjects();
                          },
                          "Put Project on Hold?",
                          `Are you sure you want to put "${project.name}" on hold?`,
                          `Project "${project.name}" is now on hold.`
                        )
                      }
                    >
                      <i className="bi bi-pause-circle"></i>
                    </button>
                    {(isTM || (!isTM && totalIncome >= project.budget)) && (
                      <button
                        className="btn btn-success btn-sm"
                        title="Mark as Complete"
                        onClick={() =>
                          confirmAction(
                            async () => {
                              const projRef = doc(db, "projects", project.id);
                              await updateDoc(projRef, {
                                status: "completed",
                                statusDate: new Date(),
                              });
                              fetchProjects();
                            },
                            "Mark as Complete?",
                            `Mark "${project.name}" as complete? This action cannot be undone.`,
                            `Project "${project.name}" marked as complete!`
                          )
                        }
                      >
                        <i className="bi bi-check-circle"></i>
                      </button>
                    )}
                    <button
                      className="btn btn-danger btn-sm"
                      title="Cancel Project"
                      onClick={() =>
                        confirmAction(
                          async () => {
                            const projRef = doc(db, "projects", project.id);
                            await updateDoc(projRef, {
                              status: "cancelled",
                              statusDate: new Date(),
                            });
                            fetchProjects();
                          },
                          "Cancel Project?",
                          `Are you sure you want to cancel "${project.name}"? This cannot be undone.`,
                          `Project "${project.name}" has been cancelled.`
                        )
                      }
                    >
                      <i className="bi bi-x-circle"></i>
                    </button>
                  </>
                )}
                <button
                  className="btn btn-danger btn-sm"
                  title="Delete Project"
                  onClick={() =>
                    confirmAction(
                      async () => {
                        await deleteDoc(doc(db, "projects", project.id));
                        fetchProjects();
                      },
                      "Delete Project?",
                      `This will permanently delete the project "${project.name}".`,
                      `Project "${project.name}" has been deleted.`
                    )
                  }
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </>
    );

    return (
      <>
        {fixedProjects.length > 0 && renderFixedList()}
        {tmProjects.length > 0 && renderTMList()}
      </>
    );
  };

  return (
    <Layout
      pageTitle="Project List"
      onAddProject={() => setShowModal(true)}
      onAddTransaction={() => setShowTransactionModal(true)}
      onAddCustomer={() => setShowCustomerModal(true)}
    >
      <div className="container-fluid">
        <div className="dashboard-header mb-4 d-flex justify-content-between align-items-center">
          <h1 className="dashboard-title">Current Projects</h1>
          <div className="view-mode-toggle d-flex align-items-center gap-2">
            <span>View:</span>
            <button
              className={`btn btn-sm ${viewMode === "cards" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setViewMode("cards")}
            >
              Cards
            </button>
            <button
              className={`btn btn-sm ${viewMode === "list" ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setViewMode("list")}
            >
              List
            </button>
          </div>
          <div className="quick-actions-wrapper">
            <QuickActions
              onAddProject={() => setShowModal(true)}
              onAddTransaction={() => setShowTransactionModal(true)}
              onAddCustomer={() => setShowCustomerModal(true)}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p>Loading Your Projects...</p>
          </div>
        ) : viewMode === "cards" ? (
          renderCards()
        ) : (
          renderList()
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
