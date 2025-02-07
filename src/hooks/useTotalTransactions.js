// File: src/hooks/useTotalTransactions.js
import { useState, useEffect } from "react";
import { collectionGroup, query, onSnapshot } from "firebase/firestore";
import { db } from "@config";

const useTotalTransactions = () => {
  const [totalTransactions, setTotalTransactions] = useState(0);

  useEffect(() => {
    // Create a collectionGroup query to fetch all subcollections named "transactions"
    const transactionsQuery = query(collectionGroup(db, "transactions"));

    // Listen for real-time updates
    const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      setTotalTransactions(snapshot.size);
    });

    return () => unsubscribe();
  }, []);

  return totalTransactions;
};

export default useTotalTransactions;
