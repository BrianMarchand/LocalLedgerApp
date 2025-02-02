// File: src/App.jsx

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
import PasswordReset from "./pages/PasswordReset";
import Profile from "./pages/Profile";

// Components
import ProjectList from "./components/ProjectList/ProjectList";
import Dashboard from "./components/Dashboard/Dashboard";
import ProjectDashboard from "./components/ProjectDashboard/ProjectDashboard";
import Customers from "./components/Customers/Customers";
import TransactionSummary from "./components/Transactions/TransactionSummary";
import Activity from "./components/Activity";

// ================================
// 5. Marchand Household Budget
// ================================
import AppSelector from "./AppSelector";
import MarchandDashboard from "./MarchandHousehold/pages/MarchandDashboard";

// ================================
// 6. Final Setup - Default Component
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
            <Route path="/password-reset" element={<PasswordReset />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/project/:id" element={<ProjectDashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route
              path="/transaction-summary"
              element={<TransactionSummary />}
            />
            <Route path="/activity" element={<Activity />} />{" "}
            {/* New Activity Route */}
            <Route path="/select-app" element={<AppSelector />} />
            <Route path="/marchand-household" element={<MarchandDashboard />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
