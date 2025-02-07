// File: src/hooks/useCustomerForm.js
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@config";
import { logActivity } from "../utils/activityLogger";
import Swal from "sweetalert2";

const useCustomerForm = ({
  customer,
  handleSave,
  handleEditCustomer,
  handleClose,
}) => {
  const initialCustomerData = {
    projectId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    streetName: "",
    city: "",
    state: "Ontario",
    postalCode: "",
    country: "Canada",
    anyPets: false,
    anyKids: false,
    parkingAvailable: false,
    referredBy: "",
    specialConsiderations: "",
    customerNotes: "",
    pets: [],
    kids: [],
    parkingLocation: "",
    parkingIsPaid: false,
  };

  const [error, setError] = useState("");
  const [customerData, setCustomerData] = useState(initialCustomerData);
  const [projects, setProjects] = useState([]);
  const [projectTouched, setProjectTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [petAccordionOpen, setPetAccordionOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // NEW: isSaving state to indicate saving progress
  const [isSaving, setIsSaving] = useState(false);

  // Fetch projects from Firestore when the hook mounts.
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsCollection = collection(db, "projects");
        const projectSnapshot = await getDocs(projectsCollection);
        const projectList = projectSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProjects(projectList);
      } catch (err) {
        console.error("Error fetching projects:", err);
      }
    };
    fetchProjects();
  }, []);

  // Pre-fill customer data if editing.
  useEffect(() => {
    if (customer) {
      setCustomerData({
        id: customer.id,
        projectId: customer.projectId || "",
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        email: customer.email || "",
        phone: formatPhoneNumber(customer.phone || ""),
        streetName: customer.streetName || "",
        city: customer.city || "",
        state: customer.state || "Ontario",
        postalCode: customer.postalCode || "",
        country: customer.country || "Canada",
        anyPets: customer.anyPets ?? false,
        anyKids: customer.anyKids ?? false,
        parkingAvailable: customer.parkingAvailable ?? false,
        referredBy: customer.referredBy || "",
        specialConsiderations: customer.specialConsiderations || "",
        customerNotes: customer.customerNotes || "",
        pets: customer.pets || [],
        kids: customer.kids || [],
        parkingLocation: customer.parkingLocation || "",
        parkingIsPaid: customer.parkingIsPaid ?? false,
      });
    } else {
      setCustomerData(initialCustomerData);
    }
    setError("");
    setCurrentStep(1);
  }, [customer]);

  // Clear errors and reset submitAttempted when currentStep changes.
  useEffect(() => {
    setError("");
    setSubmitAttempted(false);
  }, [currentStep]);

  // --- Utility Functions ---
  const formatPhoneNumber = (value) => {
    if (!value) return "";
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 3) return `(${cleaned}`;
    if (cleaned.length <= 6)
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomerData((prev) => ({ ...prev, [name]: value }));
  };

  const validateCurrentStep = () => {
    if (currentStep === 1) {
      if (
        !customerData.firstName.trim() ||
        !customerData.lastName.trim() ||
        !customerData.email.trim() ||
        !customerData.phone.trim()
      ) {
        setError("Please fill in all required contact info fields.");
        return false;
      }
    } else if (currentStep === 2) {
      if (
        !customerData.streetName.trim() ||
        !customerData.city.trim() ||
        !customerData.state.trim() ||
        !customerData.postalCode.trim() ||
        !customerData.country.trim()
      ) {
        setError("Please fill in all required address fields.");
        return false;
      }
    }
    setError("");
    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFinalSubmit = async () => {
    setSubmitAttempted(true);
    if (
      !customerData.firstName.trim() ||
      !customerData.lastName.trim() ||
      !customerData.email.trim() ||
      !customerData.phone.trim() ||
      !customerData.streetName.trim() ||
      !customerData.city.trim() ||
      !customerData.state.trim() ||
      !customerData.postalCode.trim() ||
      !customerData.country.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    if (customerData.anyPets) {
      if (customerData.pets.length === 0) {
        setError("Please add at least one pet detail.");
        return;
      }
      for (let pet of customerData.pets) {
        if (!pet.type || !pet.name) {
          setError("Please fill in all required pet details (Type and Name).");
          return;
        }
      }
    }
    if (customerData.anyKids) {
      if (customerData.kids.length === 0) {
        setError("Please add at least one kid detail.");
        return;
      }
      for (let kid of customerData.kids) {
        if (!kid.gender || !kid.name || !kid.age) {
          setError(
            "Please fill in all required kid details (Gender, Name, Age)."
          );
          return;
        }
      }
    }
    if (customerData.parkingAvailable) {
      if (!customerData.parkingLocation.trim()) {
        setError("Please select a parking location.");
        return;
      }
    }
    const finalData = { ...customerData };
    console.log("Submitting final data:", finalData);

    // Set saving indicator on
    setIsSaving(true);
    try {
      if (customer && customer.id) {
        await handleEditCustomer(finalData);
        console.log("handleEditCustomer resolved");
        await logActivity(
          "Customer Updated",
          `Customer ${customerData.firstName} ${customerData.lastName} was updated.`
        );
      } else {
        await handleSave(finalData);
        console.log("handleSave resolved");
        await logActivity(
          "New Customer",
          `${customerData.firstName} ${customerData.lastName} was added.`
        );
      }
      // Show SweetAlert2 success message
      await Swal.fire({
        title: "Success!",
        text: "Customer saved successfully!",
        icon: "success",
        confirmButtonText: "OK",
      });
      handleClose();
    } catch (err) {
      console.error("Error saving customer:", err);
      setError("There was an error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Pets Array Management ---
  const addPet = () => {
    setCustomerData((prev) => ({
      ...prev,
      pets: [...prev.pets, { type: "", name: "", friendly: false }],
    }));
  };

  const updatePet = (index, field, value) => {
    const newPets = [...customerData.pets];
    newPets[index][field] = value;
    setCustomerData((prev) => ({ ...prev, pets: newPets }));
  };

  const removePet = (index) => {
    const newPets = customerData.pets.filter((_, i) => i !== index);
    setCustomerData((prev) => ({ ...prev, pets: newPets }));
  };

  // --- Kids Array Management ---
  const addKid = () => {
    setCustomerData((prev) => ({
      ...prev,
      kids: [...prev.kids, { gender: "", name: "", age: "" }],
    }));
  };

  const updateKid = (index, field, value) => {
    const newKids = [...customerData.kids];
    newKids[index][field] = value;
    setCustomerData((prev) => ({ ...prev, kids: newKids }));
  };

  const removeKid = (index) => {
    const newKids = customerData.kids.filter((_, i) => i !== index);
    setCustomerData((prev) => ({ ...prev, kids: newKids }));
  };

  return {
    customerData,
    setCustomerData,
    error,
    projects,
    projectTouched,
    setProjectTouched,
    submitAttempted,
    setSubmitAttempted,
    petAccordionOpen,
    setPetAccordionOpen,
    currentStep,
    totalSteps,
    handleChange,
    formatPhoneNumber,
    handleNext,
    handleBack,
    handleFinalSubmit,
    isSaving, // Return the saving state
    addPet,
    updatePet,
    removePet,
    addKid,
    updateKid,
    removeKid,
  };
};

export default useCustomerForm;
