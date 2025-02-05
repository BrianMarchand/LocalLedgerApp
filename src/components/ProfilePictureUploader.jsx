// File: src/components/ProfilePictureUploader.jsx
import React, { useState, useRef } from "react";
import Swal from "sweetalert2";
import { storage } from "@config"; // Ensure your firebase storage is exported from your config
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

const ProfilePictureUploader = ({
  currentUrl,
  onUpload,
  hidePreview = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState("");
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "error",
        title: "Invalid File",
        text: "Please select a valid image file.",
      });
      return;
    }
    setSelectedFileName(file.name);
    handleUpload(file);
  };

  const handleUpload = (file) => {
    const storageRef = ref(
      storage,
      `profilePictures/${Date.now()}-${file.name}`
    );
    setUploading(true);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        setProgress(percent);
      },
      (error) => {
        console.error("Upload error:", error);
        Swal.fire({
          icon: "error",
          title: "Upload Error",
          text: "Failed to upload image. Please try again.",
        });
        setUploading(false);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          setUploading(false);
          setProgress(0);
          setSelectedFileName("");
          onUpload(downloadURL);
          Swal.fire({
            icon: "success",
            title: "Upload Successful",
            text: "Your profile picture has been uploaded.",
            timer: 1500,
            showConfirmButton: false,
          });
        });
      }
    );
  };

  return (
    <div className="profile-picture-uploader">
      {!hidePreview && currentUrl && (
        <div className="mb-3 text-center">
          <small className="text-muted d-block">Current Image:</small>
          <img
            src={currentUrl}
            alt="Current profile"
            className="rounded-circle"
            style={{
              width: "75px",
              height: "75px",
              objectFit: "cover",
              border: "2px solid #ddd",
            }}
          />
        </div>
      )}
      <div className="text-center">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button
          type="button"
          className="btn btn-outline-primary"
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Choose Image"}
        </button>
      </div>
      {selectedFileName && (
        <div className="mt-2 text-center">
          <small className="text-muted">{selectedFileName}</small>
        </div>
      )}
      {uploading && (
        <div className="progress mt-2" style={{ height: "5px" }}>
          <div
            className="progress-bar"
            role="progressbar"
            style={{ width: `${progress}%` }}
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
      )}
    </div>
  );
};

export default ProfilePictureUploader;
