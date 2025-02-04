// File: src/components/ProfilePictureUploader.jsx

import React, { useState, useEffect } from "react";
import { storage } from "@config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const ProfilePictureUploader = ({ currentUrl, onUpload }) => {
  // currentUrl: existing profile image URL (if any)
  // onUpload: callback to update the parent's state with the new URL

  const [preview, setPreview] = useState(
    currentUrl || "/images/default-avatar.png"
  );
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Update preview when currentUrl prop changes
  useEffect(() => {
    if (currentUrl) {
      setPreview(currentUrl);
    }
  }, [currentUrl]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Create a local preview for the selected file
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    // Create a unique storage reference using file name and timestamp
    const storageRef = ref(
      storage,
      `profilePictures/${file.name}-${Date.now()}`
    );
    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      onUpload(downloadURL);
    } catch (error) {
      console.error("Upload error:", error);
      alert("There was an error uploading the image. Please try again.");
    }
    setUploading(false);
  };

  return (
    <div className="profile-picture-uploader">
      <img
        src={preview}
        alt="Profile Preview"
        style={{ width: 100, height: 100, borderRadius: "50%" }}
      />
      <input type="file" accept="image/*" onChange={handleFileChange} />
      {file && (
        <button onClick={handleUpload} disabled={uploading}>
          {uploading ? "Uploading..." : "Upload Image"}
        </button>
      )}
    </div>
  );
};

export default ProfilePictureUploader;
