import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import Navbar from "../components/Navbar"; // Import Navbar

const Dashboard = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [availableFunds, setAvailableFunds] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      const querySnapshot = await getDocs(collection(db, "projects"));
      const projects = querySnapshot.docs.map((doc) => doc.data());

      setProjects(projects.length);
      setTotalExpenses(
        projects.reduce((sum, proj) => sum + (proj.totalExpenses || 0), 0),
      );
      setAvailableFunds(
        projects.reduce((sum, proj) => sum + (proj.availableFunds || 0), 0),
      );
    };

    fetchStats();
  }, []);

  return (
    <div>
      <Navbar page="dashboard" /> {/* Pass 'dashboard' as prop */}
      <div className="container py-4">
        <h1 className="text-center mb-4">Dashboard</h1>
        {/* Display Stats */}
        <div className="row">
          <div className="col-md-4">
            <div className="card shadow-sm text-center">
              <h5>Projects</h5>
              <p className="display-6">{projects}</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm text-center">
              <h5>Total Expenses</h5>
              <p className="display-6">${totalExpenses}</p>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm text-center">
              <h5>Available Funds</h5>
              <p className="display-6">${availableFunds}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
