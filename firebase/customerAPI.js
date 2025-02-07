import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

export const saveNewCustomer = async (data) => {
  try {
    // Create a new document in the "customers" collection
    const docRef = await addDoc(collection(db, "customers"), data);
    console.log("Customer added with ID:", docRef.id);
    return docRef;
  } catch (error) {
    console.error("Error adding customer:", error);
    throw error;
  }
};

export const updateExistingCustomer = async (data) => {
  if (!data.id) {
    throw new Error("Customer ID is missing for update.");
  }
  try {
    const docRef = doc(db, "customers", data.id);
    await updateDoc(docRef, data);
    console.log("Customer updated successfully with ID:", data.id);
  } catch (error) {
    console.error("Error updating customer:", error);
    throw error;
  }
};
