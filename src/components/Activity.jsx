// File: src/pages/Activity.jsx

import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@config";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { Link } from "react-router-dom";
import "../styles/global.css";
import "../styles/components/Dashboard.css";
import AddProjectModal from "../components/AddProjectModal";
import TransactionModal from "../components/TransactionModal";
import CustomerModal from "../components/CustomerModal";

const Activity = () => {
  const [activities, setActivities] = useState([]);
  // Modal state declarations
  const [showModal, setShowModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  useEffect(() => {
    // Query the "activity" collection for the 20 most recent events
    const q = query(
      collection(db, "activity"),
      orderBy("timestamp", "desc"),
      limit(20)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activityList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setActivities(activityList);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div>
      <Navbar page="activity" />
      <div className="dashboard-main-container">
        <Sidebar
          onAddProject={() => setShowModal(true)}
          onAddTransaction={() => setShowTransactionModal(true)}
          onAddCustomer={() => setShowCustomerModal(true)}
        />
        <div className="dashboard-content-container">
          <div className="dashboard-content">
            <div className="dashboard-left">
              <div className="dashboard-summary-cards">
                <div className="dashboard-card card-activity">
                  <h3>Activity Log</h3>
                  <div className="recent-activity-list">
                    {activities.length > 0 ? (
                      <ul>
                        {activities.map((activity) => {
                          // Format timestamp as "Day Month Year" (no time)
                          const dateStr = activity.timestamp
                            ? new Date(
                                activity.timestamp.seconds * 1000
                              ).toLocaleDateString("en-US", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })
                            : "";
                          return (
                            <li key={activity.id}>
                              {dateStr} - {activity.title || "Event"} -{" "}
                              {activity.description || "No details available"}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p>No recent activity available.</p>
                    )}
                  </div>
                  <Link to="/activity" className="card-link">
                    Refresh Activity Log
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Render the modals */}
      <AddProjectModal
        show={showModal}
        handleClose={() => setShowModal(false)}
      />
      <TransactionModal
        show={showTransactionModal}
        handleClose={() => setShowTransactionModal(false)}
        projects={[]} // You can replace with projects from context if needed
      />
      <CustomerModal
        show={showCustomerModal}
        handleClose={() => setShowCustomerModal(false)}
        handleSave={(customerData) => {
          console.log("Customer saved:", customerData);
        }}
        handleEditCustomer={(customerData) => {
          console.log("Customer edited:", customerData);
        }}
      />
    </div>
  );
};

export default Activity;
