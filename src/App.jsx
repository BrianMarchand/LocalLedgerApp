import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ProjectList from "./components/ProjectList";
import ProjectDashboard from "./components/ProjectDashboard";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { ThemeProvider } from "./context/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="app-container">
          {/* Toast Container */}
          <ToastContainer position="top-center" autoClose={3000} />
          <Routes>
            {/* Existing Routes */}
            <Route path="/" element={<ProjectList />} />
            <Route path="/project/:id" element={<ProjectDashboard />} />

            {/* Authentication Routes */}
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
