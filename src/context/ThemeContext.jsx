import React, { createContext, useContext, useState, useEffect } from "react";

// Create the Theme Context
const ThemeContext = createContext();

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  // Get theme from localStorage or default to 'light'
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("theme") === "dark",
  );

  // Apply theme to the <html> tag
  useEffect(() => {
    const theme = darkMode ? "dark" : "light";

    // Set Bootstrap's theme attribute on <html>
    document.documentElement.setAttribute("data-bs-theme", theme);

    // Persist theme in localStorage
    localStorage.setItem("theme", theme);
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
