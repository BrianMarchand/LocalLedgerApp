// File: src/components/CreateTestUser.jsx

import React from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@config"; // Firestore instance from your config

const CreateTestUser = () => {
  // Using the provided UID for the test user
  const testUserUID = "4kKw9RQerVeToaLmsdct1IasWxj2";

  const handleCreateTestUser = async () => {
    try {
      // Reference to the user document in the "users" collection
      const userRef = doc(db, "users", testUserUID);

      // Create/update the document with our nested structure
      await setDoc(userRef, {
        accountInfo: {
          username: "", // To be updated by the user later
        },
        appearance: {
          theme: "light", // Default theme
        },
        companyInfo: {
          companyName: "Test Company",
          businessAddress: "",
          businessPhone: "",
          businessEmail: "",
        },
        notifications: {
          emailNotifications: true,
          dashboardNotifications: true,
        },
        other: {
          email: "test@example.com",
          displayName: "Test User",
          role: "user",
          createdAt: serverTimestamp(),
        },
        personalInfo: {
          firstName: "Test",
          lastName: "User",
          nickname: "",
          shortBio: "",
          profilePictureUrl: "",
        },
      });

      console.log("Test user created successfully for UID:", testUserUID);
      alert("Test user created successfully! Check your Firestore console.");
    } catch (error) {
      // Log the full error message and object for debugging
      console.error("Error creating test user:", error.message, error);
      alert("Error creating test user: " + error.message);
    }
  };

  return (
    <div style={{ padding: "1rem", textAlign: "center" }}>
      <h3>Create Test User</h3>
      <button onClick={handleCreateTestUser}>
        Create Test User in Firestore
      </button>
    </div>
  );
};

export default CreateTestUser;
