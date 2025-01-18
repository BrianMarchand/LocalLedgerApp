import React from "react";

const NotificationsPanel = ({ alerts }) => {
  return (
    <div className="notifications-panel">
      <h4>🔔 Notifications</h4>
      {alerts.length === 0 ? (
        <p>No alerts at this time.</p>
      ) : (
        <ul>
          {alerts.map((alert, index) => (
            <li key={index} className={`alert-item alert-${alert.type}`}>
              {alert.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPanel;
