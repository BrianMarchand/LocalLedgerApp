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
import { toastSuccess, toastError } from "../utils/toastNotifications";

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

  const handleSave = async () => {
    if (
      !addTransactionForm.description ||
      !addTransactionForm.amount ||
      !addTransactionForm.category
    ) {
      toastError("All fields are required.");
      return;
    }

    try {
      const localDate = new Date(addTransactionForm.date);
      localDate.setHours(0, 0, 0, 0);

      await addDoc(collection(db, `projects/${projectId}/transactions`), {
        ...addTransactionForm,
        date: Timestamp.fromDate(localDate),
      });

      toastSuccess("Transaction added!");
      setIsAddingTransaction(false);
      fetchTransactions();
    } catch (error) {
      console.error("Error adding transaction:", error);
      toastError("Failed to add transaction.");
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateDoc(
        doc(db, `projects/${projectId}/transactions`, editingTransaction.id),
        {
          ...editTransactionForm,
          date: Timestamp.fromDate(new Date(editTransactionForm.date)),
        },
      );

      toastSuccess("Transaction updated!");
      setEditingTransaction(null);
      fetchTransactions();
    } catch (error) {
      console.error("Error updating transaction:", error);
      toastError("Failed to update transaction.");
    }
  };

  const handleDelete = async (transactionId) => {
    try {
      await deleteDoc(
        doc(db, `projects/${projectId}/transactions`, transactionId),
      );
      toastSuccess("Transaction deleted!");
      fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toastError("Failed to delete transaction.");
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
    handleSaveEdit,
    handleDelete,
    isAddingTransaction,
    setIsAddingTransaction,
    editingTransaction,
    setEditingTransaction,
    addTransactionForm,
    handleAddTransactionChange,
    editTransactionForm,
    handleEditTransactionChange,
  };
};

export default useTransactions;
