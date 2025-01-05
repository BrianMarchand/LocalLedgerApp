// ================================
// 1. Core React and Third-Party Libraries
// ================================
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Bootstrap
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";

// Toast Notifications
import { ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ================================
// 2. Global Styles and Resets
// ================================
import "./styles/resets.css"; // CSS Reset (Base Layer)
import "./styles/global.css"; // Global Styles (Next Layer)
import "./styles/theme.css"; // Theme Styles (Overrides + Variables)
import "./styles/utilities.css"; // Utilities (Reusable Classes)

// ================================
// 3. Context Providers
// ================================
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";

// ================================
// 4. Pages and Components
// ================================
// Pages
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import Profile from "./pages/Profile";

// Components
import ProjectList from "./components/ProjectList";
import ProjectDashboard from "./components/ProjectDashboard";
import Dashboard from "./components/Dashboard/Dashboard";

// ================================
// 5. Final Setup - Default Component
// ================================

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            transition={Slide}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/project/:id" element={<ProjectDashboard />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
