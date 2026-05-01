import { formatCurrency, getMonthKey } from "../utils/finance";

const currentMonth = new Date().toISOString().slice(0, 7);

export const categories = [
  "Food",
  "Travel",
  "Bills",
  "Shopping",
  "Health",
  "Entertainment",
  "Salary",
  "Freelance",
  "Savings"
];

function previousMonthDate(day) {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return `${getMonthKey(date)}-${String(day).padStart(2, "0")}`;
}

export function createSeedData() {
  return {
    user: {
      name: "Demo User",
      email: "demo@wealthwise.in",
      role: "Premium Member",
      avatar: "https://cdn-icons-png.flaticon.com/512/3607/3607444.png",
      isAuthenticated: false
    },
    preferences: {
      theme: "dark"
    },
    budget: {
      monthlyBudget: 50000
    },
    goals: [
      { id: "goal-1", title: "Buy Laptop", target: 80000, saved: 25000, deadline: "2026-08-15" },
      { id: "goal-2", title: "Summer Trip", target: 60000, saved: 18000, deadline: "2026-09-10" }
    ],
    notifications: [
      {
        id: "note-1",
        type: "success",
        title: "Salary received",
        message: "Your recurring salary entry posted successfully."
      },
      {
        id: "note-2",
        type: "warning",
        title: "Food spending is rising",
        message: "Dining costs are trending 20% above last month."
      }
    ],
    assistantMessages: [
      {
        id: "msg-1",
        role: "assistant",
        text: "Hi, I'm your finance copilot. Ask me about spending, savings, investment ideas, or where your budget is getting stretched."
      }
    ],
    transactions: [
      { id: "txn-1", title: "Monthly Salary", amount: 85000, type: "income", category: "Salary", date: `${currentMonth}-01`, note: "Primary paycheck" },
      { id: "txn-2", title: "Freelance UI Audit", amount: 18000, type: "income", category: "Freelance", date: `${currentMonth}-04`, note: "Side project" },
      { id: "txn-3", title: "Groceries", amount: 4200, type: "expense", category: "Food", date: `${currentMonth}-03`, note: "Weekly groceries" },
      { id: "txn-4", title: "Airport Taxi", amount: 1450, type: "expense", category: "Travel", date: `${currentMonth}-06`, note: "Client visit" },
      { id: "txn-5", title: "Internet Bill", amount: 999, type: "expense", category: "Bills", date: `${currentMonth}-05`, note: "Fiber connection" },
      { id: "txn-6", title: "Coffee Meetings", amount: 850, type: "expense", category: "Food", date: `${currentMonth}-08`, note: "Team sync" },
      { id: "txn-7", title: "Shopping Mall", amount: 5200, type: "expense", category: "Shopping", date: `${currentMonth}-10`, note: "Clothes and basics" },
      { id: "txn-8", title: "Movie Night", amount: 1200, type: "expense", category: "Entertainment", date: `${currentMonth}-12`, note: "Weekend outing" },
      { id: "txn-9", title: "Health Checkup", amount: 2500, type: "expense", category: "Health", date: `${currentMonth}-14`, note: "Routine visit" },
      { id: "txn-10", title: "Emergency Fund", amount: 10000, type: "expense", category: "Savings", date: `${currentMonth}-15`, note: "Monthly transfer" },
      { id: "txn-11", title: "Restaurant Dinner", amount: 3200, type: "expense", category: "Food", date: `${currentMonth}-18`, note: "Family dinner" },
      { id: "txn-12", title: "Utility Bill", amount: 3100, type: "expense", category: "Bills", date: `${currentMonth}-20`, note: "Electricity and water" },
      { id: "txn-13", title: "Taxi Reimbursement", amount: 1800, type: "income", category: "Freelance", date: `${currentMonth}-21`, note: "Client reimbursement" },
      { id: "txn-14", title: "Weekend Train", amount: 900, type: "expense", category: "Travel", date: `${currentMonth}-22`, note: "City trip" },
      { id: "txn-15", title: "Previous Month Rent", amount: 18000, type: "expense", category: "Bills", date: previousMonthDate(3), note: "Apartment rent" },
      { id: "txn-16", title: "Previous Month Groceries", amount: 3800, type: "expense", category: "Food", date: previousMonthDate(9), note: "Stock-up" },
      { id: "txn-17", title: "Previous Month Salary", amount: 85000, type: "income", category: "Salary", date: previousMonthDate(1), note: "Primary paycheck" },
      { id: "txn-18", title: "Previous Month Shopping", amount: 4500, type: "expense", category: "Shopping", date: previousMonthDate(15), note: "Home supplies" }
    ]
  };
}

export function buildInsights({ transactions, totals, monthlyTrend, budgetUsage }) {
  const currentTransactions = transactions.filter((item) => String(item.date || "").startsWith(currentMonth));
  const currentExpenses = currentTransactions.filter((item) => item.type === "expense");
  const currentIncome = currentTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const currentSpend = currentExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const groupedExpenses = currentExpenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + Number(item.amount || 0);
    return acc;
  }, {});
  const topCategory = Object.entries(groupedExpenses).sort((a, b) => b[1] - a[1])[0];
  const largestExpense = [...currentExpenses].sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0))[0];
  const [previous = { expenses: 0, income: 0 }, current = { expenses: currentSpend, income: currentIncome }] =
    monthlyTrend.slice(-2);
  const previousNet = Number(previous.income || 0) - Number(previous.expenses || 0);
  const currentNet = Number(current.income || currentIncome) - Number(current.expenses || currentSpend);
  const savingsDelta = currentNet - previousNet;
  const spendDelta = previous.expenses
    ? Math.round(((Number(current.expenses || currentSpend) - Number(previous.expenses || 0)) / previous.expenses) * 100)
    : 0;

  if (!transactions.length) {
    return [
      {
        id: "insight-empty",
        tone: "info",
        title: "No transactions yet",
        description: "Add income and expenses to unlock spending trends, budget alerts, and savings insights."
      }
    ];
  }

  if (!currentTransactions.length) {
    return [
      {
        id: "insight-no-current-month",
        tone: "info",
        title: "No activity this month",
        description: "This month's AI highlights will appear as soon as you add a current-month transaction."
      },
      {
        id: "insight-all-time",
        tone: totals.balance >= 0 ? "positive" : "warning",
        title: "All-time balance",
        description: `Across all transactions, your balance is ${formatCurrency(totals.balance)}.`
      }
    ];
  }

  return [
    {
      id: "insight-top-category",
      tone: topCategory ? "warning" : "positive",
      title: topCategory ? `Top spend: ${topCategory[0]}` : "No expenses yet",
      description: topCategory
        ? `${topCategory[0]} is your highest expense category this month at ${formatCurrency(topCategory[1])}.`
        : `You have recorded ${formatCurrency(currentIncome)} income and no expenses this month.`
    },
    {
      id: "insight-spend-change",
      tone: spendDelta > 10 ? "warning" : spendDelta < 0 ? "positive" : "info",
      title: "Monthly spend trend",
      description: previous.expenses
        ? spendDelta > 0
          ? `Expenses are up ${spendDelta}% compared to last month.`
          : spendDelta < 0
            ? `Expenses are down ${Math.abs(spendDelta)}% compared to last month.`
            : "Expenses are flat compared to last month."
        : `You have spent ${formatCurrency(currentSpend)} this month.`
    },
    {
      id: "insight-budget",
      tone: budgetUsage.percentage > 90 ? "warning" : "info",
      title: "Budget pulse",
      description:
        budgetUsage.percentage > 100
          ? "You have crossed the monthly budget. Pause non-essential purchases for the rest of the month."
          : `You have used ${budgetUsage.percentage}% of your budget, leaving ${formatCurrency(
              budgetUsage.remaining
            )} available.`
    },
    {
      id: "insight-savings",
      tone: currentNet < 0 || savingsDelta < 0 ? "warning" : "positive",
      title: "Savings position",
      description:
        currentNet < 0
          ? `This month is negative by ${formatCurrency(Math.abs(currentNet))}. Reduce flexible spending first.`
          : savingsDelta < 0
            ? `You are saving ${formatCurrency(Math.abs(savingsDelta))} less than last month.`
            : `Current monthly surplus is ${formatCurrency(currentNet)}.`
    },
    {
      id: "insight-largest-expense",
      tone: largestExpense ? "info" : "positive",
      title: largestExpense ? "Largest expense" : "Clean expense slate",
      description: largestExpense
        ? `${largestExpense.title} is your largest transaction this month at ${formatCurrency(largestExpense.amount)}.`
        : "No expense entries are recorded for the current month."
    }
  ];
}

export function buildAssistantReply(question, state) {
  const normalized = question.toLowerCase();
  const currentTransactions = state.transactions.filter((item) => item.date.startsWith(currentMonth));
  const expenseTotal = currentTransactions
    .filter((item) => item.type === "expense")
    .reduce((sum, item) => sum + item.amount, 0);
  const incomeTotal = currentTransactions
    .filter((item) => item.type === "income")
    .reduce((sum, item) => sum + item.amount, 0);
  const groupedExpenses = currentTransactions
    .filter((item) => item.type === "expense")
    .reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {});
  const highestCategory = Object.entries(groupedExpenses).sort((a, b) => b[1] - a[1])[0];
  const freeCash = Math.max(incomeTotal - expenseTotal, 0);

  if (normalized.includes("how much") && normalized.includes("spend")) {
    return `You spent ${formatCurrency(expenseTotal)} this month so far. The largest share went to ${
      highestCategory?.[0] || "expenses"
    }.`;
  }

  if (normalized.includes("save")) {
    return `Start with ${highestCategory?.[0] || "your highest spending category"}. Cutting it by 10% could free about ${formatCurrency(
      Math.round((highestCategory?.[1] || expenseTotal) * 0.1)
    )} for your goals.`;
  }

  if (normalized.includes("budget")) {
    return `Your monthly budget is ${formatCurrency(
      state.budget.monthlyBudget
    )}. You have spent ${formatCurrency(expenseTotal)}, so keep bills first and cap flexible categories like food and shopping.`;
  }

  if (
    normalized.includes("invest") ||
    normalized.includes("investment") ||
    normalized.includes("share") ||
    normalized.includes("stock") ||
    normalized.includes("where")
  ) {
    const emergencyFund = Math.round(freeCash * 0.5);
    const investments = Math.round(freeCash * 0.3);
    const flexibleSpend = Math.round(freeCash * 0.2);

    return `Based on this month, you have about ${formatCurrency(freeCash)} free cash. A practical split is ${formatCurrency(
      emergencyFund
    )} for emergency savings, ${formatCurrency(
      investments
    )} for SIPs, index funds, or carefully researched Indian shares, and ${formatCurrency(
      flexibleSpend
    )} for planned spending. Direct stocks should come after essentials, insurance, and emergency funds.`;
  }

  return "I can summarize monthly spending, highlight categories to reduce, and suggest a simple save-or-invest split in INR. Try asking where to invest or where to reduce spending.";
}
