export const  formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

export const  generateId = (prefix) => {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function toAmount(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getGoalContributionAmount(goal, amount) {
  const contribution = toAmount(amount);
  const remaining = Math.max(toAmount(goal?.target) - toAmount(goal?.saved), 0);

  if (contribution <= 0 || remaining <= 0) {
    return 0;
  }

  return Math.min(contribution, remaining);
}

export function createGoalContributionTransaction(goal, amount, options = {}) {
  const appliedAmount = getGoalContributionAmount(goal, amount);

  if (!appliedAmount) {
    return null;
  }

  return {
    id: options.id || generateId("txn"),
    title: `${goal.title} goal contribution`,
    amount: appliedAmount,
    type: "expense",
    category: "Savings",
    date: options.date || getLocalDateKey(),
    note: `Contribution to ${goal.title} savings goal`
  };
}

export const monthOptions = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" }
];

export const  computeTotals = (transactions) => {
  return transactions.reduce(
    (acc, item) => {
      const amount = toAmount(item.amount);

      if (item.type === "income") {
        acc.income += amount;
      } else {
        acc.expenses += amount;
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

export function formatDisplayDate(value, { includeTime = false } = {}) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  const dateText = `${day}-${month}-${year}`;

  if (!includeTime) {
    return dateText;
  }

  const timeText = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);

  return `${dateText} ${timeText}`;
}

export function formatMonthLabel(monthKey) {
  const [year, month] = String(monthKey).split("-");
  const option = monthOptions.find((item) => item.value === month);
  return option ? `${option.label.slice(0, 3)} ${year}` : monthKey;
}

export function computeCategoryBreakdown(transactions) {
  const grouped = transactions
    .filter((item) => item.type === "expense")
    .reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + toAmount(item.amount);
      return acc;
    }, {});

  return Object.entries(grouped).map(([name, value], index) => ({
    name,
    value,
    fill: chartPalette[index % chartPalette.length]
  }));
}

export function getMonthKey(date) {
  if (typeof date === "string" && /^\d{4}-\d{2}/.test(date)) {
    return date.slice(0, 7);
  }

  if (typeof date === "string") {
    const normalizedDate = date.trim();
    const dayFirstMatch = normalizedDate.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);

    if (dayFirstMatch) {
      const [, day, month, year] = dayFirstMatch;
      const numericDay = Number(day);
      const numericMonth = Number(month);

      if (numericDay >= 1 && numericDay <= 31 && numericMonth >= 1 && numericMonth <= 12) {
        return `${year}-${String(numericMonth).padStart(2, "0")}`;
      }
    }
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  return `${parsedDate.getFullYear()}-${month}`;
}

export function computeMonthlyTrend(transactions) {
  const grouped = transactions.reduce((acc, item) => {
    const month = getMonthKey(item.date);

    if (!month) {
      return acc;
    }

    acc[month] = acc[month] || { month, income: 0, expenses: 0 };
    acc[month][item.type === "income" ? "income" : "expenses"] += toAmount(item.amount);
    return acc;
  }, {});

  return Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month));
}

function shiftMonthKey(monthKey, offset) {
  const [year, month] = String(monthKey).split("-").map(Number);
  const date = new Date(year, month - 1 + offset, 1);
  return getCurrentMonthKey(date);
}

export function getMonthWindow(monthKey = getCurrentMonthKey(), count = 3) {
  return Array.from({ length: count }, (_, index) => shiftMonthKey(monthKey, index - count + 1));
}

export function computeMonthlyTrendWindow(transactions, endMonthKey = getCurrentMonthKey(), count = 3) {
  const trendByMonth = new Map(computeMonthlyTrend(transactions).map((item) => [item.month, item]));

  return getMonthWindow(endMonthKey, count).map((month) => ({
    month,
    income: trendByMonth.get(month)?.income || 0,
    expenses: trendByMonth.get(month)?.expenses || 0
  }));
}

export function filterTransactions(transactions, filters) {
  const selectedMonthKey = filters.year && filters.month ? `${filters.year}-${filters.month}` : filters.month;

  return transactions.filter((item) => {
    const matchesCategory = filters.category === "All" || item.category === filters.category;
    const matchesType = filters.type === "All" || item.type === filters.type;
    const matchesDate = !selectedMonthKey || getMonthKey(item.date) === selectedMonthKey;
    const matchesAmount = !filters.minAmount || toAmount(item.amount) >= Number(filters.minAmount);

    return matchesCategory && matchesType && matchesDate && matchesAmount;
  });
}

export function getCurrentMonthKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

export function getPeriodFromMonthKey(monthKey = getCurrentMonthKey()) {
  const [year, month] = String(monthKey).split("-");
  const [currentYear, currentMonth] = getCurrentMonthKey().split("-");

  return {
    month: month || currentMonth,
    year: year || currentYear
  };
}

export function getMonthKeyFromPeriod(period) {
  return period?.year && period?.month ? `${period.year}-${period.month}` : getCurrentMonthKey();
}

export function getTransactionsForMonth(transactions, monthKey = getCurrentMonthKey()) {
  return transactions.filter((item) => getMonthKey(item.date) === monthKey);
}

export function getExpenseTotalForMonth(transactions, monthKey = getCurrentMonthKey()) {
  return transactions
    .filter((item) => item.type === "expense" && getMonthKey(item.date) === monthKey)
    .reduce((sum, item) => sum + toAmount(item.amount), 0);
}

export const getCurrentMonthExpenseTotal = getExpenseTotalForMonth;

export function getBudgetUsage(transactions, monthlyBudget, monthKey = getCurrentMonthKey()) {
  const budget = toAmount(monthlyBudget);
  const spent = getExpenseTotalForMonth(transactions, monthKey);

  return {
    spent,
    currentMonthSpent: spent,
    percentage: budget ? Math.round((spent / budget) * 100) : 0,
    remaining: budget - spent
  };
}

export function getYearOptions(transactions, selectedYear = getCurrentMonthKey().slice(0, 4)) {
  const years = new Set([selectedYear, getCurrentMonthKey().slice(0, 4)]);

  transactions.forEach((item) => {
    const year = getMonthKey(item.date).slice(0, 4);

    if (year) {
      years.add(year);
    }
  });

  return [...years].sort((left, right) => Number(right) - Number(left));
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
