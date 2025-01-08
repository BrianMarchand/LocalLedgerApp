import React from "react";
import MarchandNavbar from "../components/MarchandNav";

const MarchandDashboard = () => {
  return (
    <>
      <MarchandNavbar /> {/* Include the Navbar */}
      <div style={{ padding: "20px" }}>
        <h1>Marchand Household Dashboard</h1>
        <p>Welcome to the Marchand Household budget tracker!</p>
        <p>More features coming soon...</p>
      </div>
    </>
  );
};

export default MarchandDashboard;
