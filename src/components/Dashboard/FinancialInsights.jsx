import React, { useEffect, useState } from "react";

const FinancialInsights = ({ projects }) => {
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    if (!projects.length) {
      setInsights([]);
      return;
    }

    let categorySpending = {};
    let totalBudget = 0;
    let totalSpent = 0;
    let budgetWarnings = [];
    let aiTips = [];

    projects.forEach((proj) => {
      totalBudget += proj.budget || 0;

      proj.transactions?.forEach((txn) => {
        const amount = parseFloat(txn.amount) || 0;
        const category = txn.category || "Miscellaneous";

        categorySpending[category] = (categorySpending[category] || 0) + amount;

        if (txn.category !== "Client Payment") {
          totalSpent += amount;
        }
      });

      if (proj.budget > 0 && totalSpent > proj.budget) {
        budgetWarnings.push({
          type: "budget",
          message: `🚨 Project "${proj.name}" is over budget by $${(
            totalSpent - proj.budget
          ).toLocaleString()}`,
        });
      }
    });

    // 🔍 Find spending trends
    const highestSpendingCategory = Object.entries(categorySpending).reduce(
      (prev, curr) => (curr[1] > prev[1] ? curr : prev),
      ["None", 0],
    );

    if (highestSpendingCategory[1] > 0) {
      aiTips.push({
        type: "spending",
        message: `📊 Your highest spending category is **${highestSpendingCategory[0]}** ($${highestSpendingCategory[1].toLocaleString()}). Consider reviewing costs in this area.`,
      });
    }

    if (totalBudget > 0) {
      const budgetUtilization = ((totalSpent / totalBudget) * 100).toFixed(1);
      aiTips.push({
        type: "budget",
        message: `📉 Budget Utilization: You've used **${budgetUtilization}%** of your total budget.`,
      });
    }

    setInsights([...budgetWarnings, ...aiTips]);
  }, [projects]);

  return (
    <div className="financial-insights">
      <h4>💡 AI-Powered Financial Insights</h4>
      {insights.length === 0 ? (
        <p className="text-muted">No insights available.</p>
      ) : (
        <ul>
          {insights.map((insight, index) => (
            <li key={index} className={`insight-item insight-${insight.type}`}>
              {insight.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FinancialInsights;
