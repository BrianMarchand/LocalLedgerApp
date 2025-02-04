// In some parent component (e.g., ProfilePage.jsx or Navbar.jsx)
import React, { useState } from "react";
import UserProfileModal from "../../src/components/UserProfileModal";

const ProfilePage = () => {
  const [showProfileModal, setShowProfileModal] = useState(false);

  return (
    <div>
      <button onClick={() => setShowProfileModal(true)}>Edit Profile</button>
      <UserProfileModal
        show={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </div>
  );
};

export default ProfilePage;
