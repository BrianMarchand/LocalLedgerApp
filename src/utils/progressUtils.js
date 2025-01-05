// progressUtils.js

/**
 * Calculates the progress percentage based on budget and expenses.
 * @param {number} budget - The total budget for the project.
 * @param {Array} transactions - List of transactions for the project.
 * @returns {number} Progress percentage (0–100).
 */
export const calculateProgress = (budget, transactions = []) => {
  const totalBudget = parseFloat(budget) || 0; // Parse budget as number

  // Treat specific payment types as expenses
  const totalExpenses = transactions
    .filter(
      (t) => ["Debit", "VISA", "Cash"].includes(t.type), // Add valid expense types
    )
    .reduce((sum, t) => sum + t.amount, 0); // Sum amounts

  if (totalBudget <= 0) return 0; // Prevent division by zero
  const progress = (totalExpenses / totalBudget) * 100;

  return Math.round(Math.min(progress, 100)); // Cap at 100%
};
