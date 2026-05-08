function formatCurrency(value) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value || 0);
}

function getMonthKey(date = new Date()) {
  return new Date(date).toISOString().slice(0, 7);
}

function daysInMonth(monthKey) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(year, month, 0).getDate();
}

function getDayOfMonth(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 1 : date.getDate();
}

function normalizeTransaction(transaction) {
  return {
    id: String(transaction._id || transaction.id),
    title: transaction.title || "",
    amount: Number(transaction.amount || 0),
    type: transaction.type,
    category: transaction.category || "",
    date: getMonthKey(transaction.date) + `-${String(getDayOfMonth(transaction.date)).padStart(2, "0")}`,
    note: transaction.note || ""
  };
}

function groupExpensesByCategory(transactions) {
  return transactions
    .filter((item) => item.type === "expense")
    .reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + Number(item.amount || 0);
      return acc;
    }, {});
}

function analyzeSpendingPatterns(transactions, monthlyBudget = 0) {
  const normalizedTransactions = transactions.map(normalizeTransaction);
  const currentMonth = getMonthKey();
  const now = new Date();
  const dayOfMonth = Math.max(now.getDate(), 1);
  const monthLength = daysInMonth(currentMonth);
  const currentTransactions = normalizedTransactions.filter((item) => item.date.startsWith(currentMonth));
  const currentExpenses = currentTransactions.filter((item) => item.type === "expense");
  const currentIncome = currentTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const currentSpend = currentExpenses.reduce((sum, item) => sum + item.amount, 0);
  const projectedExpenses = currentSpend > 0 ? Math.round((currentSpend / dayOfMonth) * monthLength) : 0;
  const remainingBudget = Math.max(Number(monthlyBudget || 0) - currentSpend, 0);
  const categories = Object.entries(groupExpensesByCategory(currentTransactions))
    .map(([category, amount]) => ({ category, amount }))
    .sort((left, right) => right.amount - left.amount);
  const previousMonthKey = getMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const previousByCategory = groupExpensesByCategory(
    normalizedTransactions.filter((item) => item.type === "expense" && item.date.startsWith(previousMonthKey))
  );
  const overspendingCategories = categories
    .map((item) => {
      const previousAmount = previousByCategory[item.category] || 0;
      const deltaPercent = previousAmount
        ? Math.round(((item.amount - previousAmount) / previousAmount) * 100)
        : item.amount > Math.max(Number(monthlyBudget || 0) * 0.12, 5000)
          ? 100
          : 0;

      return {
        ...item,
        previousAmount,
        deltaPercent
      };
    })
    .filter((item) => item.deltaPercent >= 20 || item.amount >= Number(monthlyBudget || 0) * 0.25)
    .slice(0, 3);
  const upcomingBills = currentTransactions
    .filter((item) => {
      const text = `${item.category} ${item.title} ${item.note}`;
      const day = getDayOfMonth(item.date);
      return (
        item.type === "expense" &&
        /bill|rent|emi|subscription|insurance|utility|internet/i.test(text) &&
        day >= dayOfMonth &&
        day <= dayOfMonth + 7
      );
    })
    .sort((left, right) => getDayOfMonth(left.date) - getDayOfMonth(right.date))
    .slice(0, 3);

  return {
    currentIncome,
    currentSpend,
    projectedExpenses,
    projectedBudgetUsage: monthlyBudget ? Math.round((projectedExpenses / monthlyBudget) * 100) : 0,
    remainingBudget,
    overspendingCategories,
    upcomingBills,
    isOverspending: Boolean(monthlyBudget && (currentSpend > monthlyBudget || projectedExpenses > monthlyBudget)),
    isLowBalance: currentIncome - currentSpend < Math.max(Number(monthlyBudget || 0) * 0.15, 5000)
  };
}

function buildSmartNotifications({ transactions, user }) {
  const monthlyBudget = Number(user.budget?.monthlyBudget || 0);
  const analysis = analyzeSpendingPatterns(transactions, monthlyBudget);
  const totalIncome = transactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpenses = transactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const balance = totalIncome - totalExpenses;
  const now = Date.now();
  const notifications = [];

  if (analysis.isOverspending) {
    notifications.push({
      id: "smart-overspending",
      type: "warning",
      title: "Overspending alert",
      message: `At this pace, expenses may reach ${formatCurrency(analysis.projectedExpenses)} this month (${analysis.projectedBudgetUsage}% of budget).`,
      createdAt: new Date(now),
      read: false
    });
  }

  analysis.overspendingCategories.forEach((item, index) => {
    notifications.push({
      id: `smart-category-${item.category}-${index}`,
      type: "warning",
      title: `${item.category} spending is high`,
      message: item.previousAmount
        ? `${item.category} is ${item.deltaPercent}% above last month. Try trimming ${formatCurrency(Math.round(item.amount * 0.1))}.`
        : `${item.category} has reached ${formatCurrency(item.amount)} this month. Set a cap before the next purchase.`,
      createdAt: new Date(now - (index + 1) * 60 * 1000),
      read: false
    });
  });

  analysis.upcomingBills.forEach((bill, index) => {
    notifications.push({
      id: `smart-bill-${bill.id}`,
      type: "info",
      title: "Bill reminder",
      message: `${bill.title} for ${formatCurrency(bill.amount)} is due around day ${getDayOfMonth(bill.date)}. Keep that cash reserved.`,
      createdAt: new Date(now - (index + 4) * 60 * 1000),
      read: false
    });
  });

  if (analysis.isLowBalance || balance < 5000) {
    notifications.push({
      id: "smart-low-balance",
      type: "warning",
      title: "Low balance warning",
      message: `Available balance is ${formatCurrency(balance)}. Prioritize bills and pause non-essential spends.`,
      createdAt: new Date(now - 8 * 60 * 1000),
      read: false
    });
  }

  const goal = user.goals?.find((item) => Number(item.saved || 0) < Number(item.target || 0));
  if (goal && analysis.remainingBudget > 0) {
    notifications.push({
      id: "smart-coach-goal",
      type: "success",
      title: "Personal finance coach",
      message: `You can route ${formatCurrency(Math.min(analysis.remainingBudget, 2000))} toward ${goal.title} without crossing the monthly budget.`,
      createdAt: new Date(now - 10 * 60 * 1000),
      read: false
    });
  }

  if (!notifications.length) {
    notifications.push({
      id: "smart-all-clear",
      type: "success",
      title: "Smart alerts all clear",
      message: "Spending, bills, and balance look controlled right now. Keep tracking daily.",
      createdAt: new Date(now),
      read: false
    });
  }

  return notifications.slice(0, 8);
}

module.exports = {
  analyzeSpendingPatterns,
  buildSmartNotifications
};