import React, { useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import { storage } from "@config"; // Ensure your firebase storage is exported from your config
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import "../styles/components/ProfilePictureUploader.css";

const ProfilePictureUploader = ({
  currentUrl,
  onUpload,
  hidePreview = false,
}) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  // Use null instead of empty string to represent "no image"
  const [imageUrl, setImageUrl] = useState(currentUrl || null);

  // Update local state if currentUrl prop changes
  useEffect(() => {
    setImageUrl(currentUrl || null);
  }, [currentUrl]);

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
          setImageUrl(downloadURL);
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

  // Trigger file selection for upload/replace
  const handleReplace = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Delete the image: set imageUrl to null and notify parent
  const handleDelete = () => {
    setImageUrl(null);
    onUpload(null);
  };

  // Use your custom placeholder image from the public folder
  const placeholder = "/images/profile-picture-placeholder.jpg";

  return (
    <div className="profile-picture-uploader">
      {!hidePreview && (
        <div className="image-container">
          <img
            src={imageUrl || placeholder}
            alt="Profile"
            className="profile-image rounded-circle"
            style={{
              width: "200px",
              height: "200px",
              objectFit: "cover",
              border: "2px solid #ddd",
            }}
          />
          {/* Overlay appears on hover */}
          <div className="overlay">
            {imageUrl ? (
              <>
                <button
                  type="button"
                  className="overlay-btn"
                  onClick={handleReplace}
                  disabled={uploading}
                >
                  Replace
                </button>
                <button
                  type="button"
                  className="overlay-btn"
                  onClick={handleDelete}
                  disabled={uploading}
                >
                  Delete
                </button>
              </>
            ) : (
              <button
                type="button"
                className="overlay-btn"
                onClick={handleReplace}
                disabled={uploading}
              >
                Upload
              </button>
            )}
          </div>
          {uploading && (
            <div className="progress-overlay">
              <div
                className="progress-bar"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </div>
      )}
      {/* Hidden file input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default ProfilePictureUploader;
