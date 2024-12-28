import React, { createContext, useContext, useState, useEffect } from "react";

// Create the Theme Context
const ThemeContext = createContext();

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  // Get theme from localStorage or default to 'light'
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark",
  );

  // Apply theme to <body> class
  useEffect(() => {
    // Use Bootstrap's built-in theme attribute instead of custom classes
    document.documentElement.setAttribute(
      "data-bs-theme",
      darkMode ? "dark" : "light",
    );
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  // Toggle the theme
  const toggleTheme = () => setDarkMode((prevMode) => !prevMode);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useTheme = () => useContext(ThemeContext);
