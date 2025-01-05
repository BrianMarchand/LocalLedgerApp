/**
 * Calculates the progress percentage based on budget and expenses.
 * @param {number} budget - The total budget for the project.
 * @param {Array} transactions - List of transactions for the project.
 * @returns {object} Progress data including percentage, status, and details.
 */
export const calculateProgress = (budget, transactions = []) => {
  // **1. Validate Budget**
  const totalBudget = parseFloat(budget) || 0;
  if (totalBudget <= 0) {
    return { percentage: 0, status: "invalid", income: 0, expenses: 0 };
  }

  // **2. Categorize Transactions**
  const { income, expenses } = transactions.reduce(
    (acc, t) => {
      const amount = parseFloat(t.amount) || 0;
      if (amount <= 0) return acc; // Ignore invalid/negative amounts

      // **Categorize Transactions**
      switch (t.type) {
        case "E-Transfer":
          t.category === "Client Payment"
            ? (acc.income += amount) // Income for Client Payments
            : (acc.expenses += amount); // Expense otherwise
          break;

        case "Cash":
          t.category === "Labour"
            ? (acc.income += amount) // Income for Labour
            : (acc.expenses += amount); // Expense otherwise
          break;

        case "VISA":
        case "Debit":
          acc.expenses += amount; // Always Expenses
          break;

        default:
          break; // Skip unknown types
      }
      return acc;
    },
    { income: 0, expenses: 0 },
  );

  // **3. Adjust Budget Based on Income**
  const adjustedBudget = totalBudget + income; // Include income in available budget

  // **4. Calculate Progress**
  const progress = (expenses / adjustedBudget) * 100; // Percentage of spent budget
  const cappedProgress = Math.min(progress, 100); // Cap at 100%

  // **5. Determine Status**
  let status = "in-progress";
  if (progress === 0) status = "new";
  else if (progress >= 100) status = "complete";
  else if (expenses > adjustedBudget) status = "over-budget";

  // **6. Return All Data**
  return {
    percentage: Math.round(cappedProgress), // Always return as integer
    status,
    income,
    expenses,
  };
};
