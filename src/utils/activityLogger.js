// File: src/utils/activityLogger.js

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@config";

export const logActivity = async (title, description, additionalData = {}) => {
  try {
    await addDoc(collection(db, "activity"), {
      title,
      description,
      ...additionalData,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};
