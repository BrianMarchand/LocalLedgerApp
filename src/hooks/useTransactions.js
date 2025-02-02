// File: src/hooks/useTransactions.js

import { useState, useEffect } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@config";
import Swal from "sweetalert2";

const useTransactions = (transactions, projectId, fetchTransactions) => {
  const [localTransactions, setLocalTransactions] = useState(transactions);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [addTransactionForm, setAddTransactionForm] = useState({
    date: "",
    description: "",
    amount: "",
    category: "",
    type: "",
  });

  const [editTransactionForm, setEditTransactionForm] = useState({
    date: "",
    description: "",
    amount: "",
    category: "",
    type: "",
  });

  useEffect(() => {
    setLocalTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleAddTransactionChange = (e) => {
    setAddTransactionForm({
      ...addTransactionForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditTransactionChange = (e) => {
    setEditTransactionForm({
      ...editTransactionForm,
      [e.target.name]: e.target.value,
    });
  };

  // Convert a "YYYY-MM-DD" string to a Date at local midnight.
  const parseLocalDateString = (dateString) => {
    const [year, month, day] = dateString.split("-");
    return new Date(Number(year), Number(month) - 1, Number(day));
  };

  const handleSave = async () => {
    if (
      !addTransactionForm.description ||
      !addTransactionForm.amount ||
      !addTransactionForm.category ||
      !addTransactionForm.date
    ) {
      await Swal.fire({
        icon: "error",
        title: "Missing Fields",
        text: "All fields are required.",
      });
      return;
    }

    try {
      const localDate = parseLocalDateString(addTransactionForm.date);
      await addDoc(collection(db, `projects/${projectId}/transactions`), {
        ...addTransactionForm,
        date: Timestamp.fromDate(localDate),
      });

      await Swal.fire({
        icon: "success",
        title: "Transaction Added",
        text: "The transaction was successfully added.",
      });
      setIsAddingTransaction(false);
      fetchTransactions();
    } catch (error) {
      console.error("Error adding transaction:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to add transaction.",
      });
    }
  };

  // Confirm deletion via SweetAlert2.
  // After deletion, if the transaction is a deposit, show an additional modal.
  const handleDelete = async (transaction) => {
    const confirmResult = await Swal.fire({
      title: "Delete Transaction?",
      text: "Are you sure you want to delete this transaction?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });
    if (!confirmResult.isConfirmed) return;

    try {
      await deleteDoc(doc(db, `projects/${projectId}/transactions`, transaction.id));

      if (
        transaction.category.toLowerCase() === "client payment" &&
        transaction.description.toLowerCase().includes("deposit")
      ) {
        await Swal.fire({
          title: "Deposit Deleted",
          text: "The deposit transaction was deleted. The project status will revert to New.",
          icon: "info",
        });
      } else {
        await Swal.fire({
          title: "Transaction Deleted",
          text: "The transaction was successfully deleted.",
          icon: "success",
        });
      }
      fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to delete transaction.",
      });
    }
  };

  return {
    localTransactions,
    isMobile,
    filterCategory,
    setFilterCategory,
    sortColumn,
    sortDirection,
    handleSort,
    handleSave,
    handleEditTransactionChange,
    handleDelete,
    isAddingTransaction,
    setIsAddingTransaction,
    editingTransaction,
    setEditingTransaction,
    addTransactionForm,
    handleAddTransactionChange, 
    editTransactionForm,
  };
};

export default useTransactions;