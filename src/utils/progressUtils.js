// -- Page: progressUtils.js --

/**
 * Calculates the progress percentage based on budget and expenses.
 * @param {number} budget - The total budget for the project.
 * @param {Array} transactions - List of transactions for the project.
 * @returns {object} - Progress data including percentage, status, and details.
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
      const amount =
        t?.amount && !isNaN(parseFloat(t.amount)) ? parseFloat(t.amount) : 0;

      if (amount > 0) {
        t.category === "Client Payment"
          ? (acc.income += amount)
          : (acc.expenses += amount);
      }

      return acc;
    },
    { income: 0, expenses: 0 },
  );

  // **3. Calculate Available Budget**
  const availableBudget = totalBudget - expenses;

  // **4. Calculate Progress**
  const progress = totalBudget > 0 ? (expenses / totalBudget) * 100 : 100;
  const cappedProgress = Math.min(progress, 100);

  // **5. Determine Status**
  const status =
    cappedProgress === 0
      ? "new"
      : expenses > totalBudget
        ? "over-budget"
        : cappedProgress >= 100
          ? "complete"
          : "in-progress";

  // **6. Return All Data**
  return {
    percentage: Math.round(cappedProgress),
    status,
    income,
    expenses,
  };
};
