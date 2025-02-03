// File: src/components/ActivityTicker.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const ActivityTicker = ({ activities, formatActivity }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rolling, setRolling] = useState(false); // true when rolling out
  const [entering, setEntering] = useState(false); // true when rolling in
  const [isPaused, setIsPaused] = useState(false);

  // Cycle every 6 seconds (if not paused)
  useEffect(() => {
    if (activities.length === 0) return;
    if (isPaused) return;
    const timer = setTimeout(() => {
      setRolling(true);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activities, isPaused, currentIndex]);

  // When an animation ends, update state accordingly.
  const handleAnimationEnd = () => {
    if (rolling) {
      // Roll-out finished; update index and start roll-in.
      setCurrentIndex((prevIndex) => (prevIndex + 1) % activities.length);
      setRolling(false);
      setEntering(true);
    } else if (entering) {
      // Roll-in finished.
      setEntering(false);
    }
  };

  // Map activity types to parent links.
  const getActivityLink = (activity) => {
    if (activity.type === "new_customer") return "/customers";
    if (activity.type === "new_transaction") return "/transaction-summary";
    if (activity.type === "new_project") return "/projects";
    return "#";
  };

  let content;
  if (activities.length === 0) {
    content = <span>No recent activity available.</span>;
  } else {
    const activity = activities[currentIndex];
    const { dateStr, eventType, message } = formatActivity(activity);
    content = (
      <>
        <span className="ticker-date">{dateStr}</span>
        <span className="ticker-text">
          {eventType}
          <i className="bi bi-arrow-right-short"></i>
          {message}
        </span>
      </>
    );
    // Wrap content in a Link pointing to the activity’s parent page.
    content = (
      <Link to={getActivityLink(activity)} className="ticker-link">
        {content}
      </Link>
    );
  }

  return (
    <div
      className="dashboard-card card-activity activity-ticker-card"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="ticker-content-wrapper">
        <div className="ticker-header">
          <i className="bi bi-activity"></i>
          <span className="ticker-title">Recent Activity</span>
        </div>
        <div className="vertical-divider"></div>
        {/* The ticker-content element is clipped by its wrapper */}
        <div
          className={`ticker-content ${rolling ? "roll-out" : ""} ${entering ? "roll-in" : ""}`}
          onAnimationEnd={handleAnimationEnd}
        >
          {content}
        </div>
      </div>
    </div>
  );
};

export default ActivityTicker;
