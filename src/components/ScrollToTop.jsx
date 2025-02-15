// File: src/components/ScrollToTop.jsx
import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    // If your scrollable container has an id "main-content":
    const container = document.getElementById("dashboard-main-container");
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      // Fallback to window scroll if container is not found
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname]);
  return null;
};

export default ScrollToTop;
