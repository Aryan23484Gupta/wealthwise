export const  formatCurrency = (value) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(value);
}

export const  generateId = (prefix) => {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export const  computeTotals = (transactions) => {
  return transactions.reduce(
    (acc, item) => {
      if (item.type === "income") {
        acc.income += item.amount;
      } else {
        acc.expenses += item.amount;
      }
      acc.balance = acc.income - acc.expenses;
      return acc;
    },
    { income: 0, expenses: 0, balance: 0 }
  );
}

export function getRecentTransactions(transactions, count = 5) {
  return [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, count);
}

export function computeCategoryBreakdown(transactions) {
  const grouped = transactions
    .filter((item) => item.type === "expense")
    .reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {});

  return Object.entries(grouped).map(([name, value], index) => ({
    name,
    value,
    fill: chartPalette[index % chartPalette.length]
  }));
}

export function getMonthKey(date) {
  return new Date(date).toISOString().slice(0, 7);
}

export function computeMonthlyTrend(transactions) {
  const grouped = transactions.reduce((acc, item) => {
    const month = getMonthKey(item.date);
    acc[month] = acc[month] || { month, income: 0, expenses: 0 };
    acc[month][item.type === "income" ? "income" : "expenses"] += item.amount;
    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month));
}

export function filterTransactions(transactions, filters) {
  return transactions.filter((item) => {
    const matchesCategory = filters.category === "All" || item.category === filters.category;
    const matchesType = filters.type === "All" || item.type === filters.type;
    const matchesDate = !filters.month || item.date.startsWith(filters.month);
    const matchesAmount = !filters.minAmount || item.amount >= Number(filters.minAmount);

    return matchesCategory && matchesType && matchesDate && matchesAmount;
  });
}

export function getBudgetUsage(transactions, monthlyBudget) {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const spent = transactions
    .filter((item) => item.type === "expense" && item.date.startsWith(currentMonth))
    .reduce((sum, item) => sum + item.amount, 0);

  return {
    spent,
    percentage: monthlyBudget ? Math.round((spent / monthlyBudget) * 100) : 0,
    remaining: Math.max(monthlyBudget - spent, 0)
  };
}

export function getGoalProgress(goals) {
  return goals.map((goal) => ({
    ...goal,
    percentage: Math.round((goal.saved / goal.target) * 100)
  }));
}

export function getSavingsDelta(monthlyTrend) {
  const [previous, current] = monthlyTrend.slice(-2);
  if (!current || !previous) {
    return 0;
  }

  return current.income - current.expenses - (previous.income - previous.expenses);
}

export const chartPalette = ["#1d4ed8", "#0f766e", "#f97316", "#9333ea", "#dc2626", "#ca8a04"];
