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
      name: "Sonam Kumari",
      email: "sonamkumariq2345@gmail.com",
      role: "Premium Member",
      avatar:
        "https://cdn-icons-png.flaticon.com/512/3607/3607444.png",
      isAuthenticated: false
    },
    preferences: {
      theme: "dark"
    },
    budget: {
      monthlyBudget: 3500
    },
    goals: [
      { id: "goal-1", title: "Buy Laptop", target: 2200, saved: 1180, deadline: "2026-08-15" },
      { id: "goal-2", title: "Summer Trip", target: 1800, saved: 760, deadline: "2026-09-10" }
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
        text: "Hi, I’m your finance copilot. Ask me about spending, savings, or where your budget is getting stretched."
      }
    ],
    transactions: [
      { id: "txn-1", title: "Monthly Salary", amount: 5200, type: "income", category: "Salary", date: `${currentMonth}-01`, note: "Primary paycheck" },
      { id: "txn-2", title: "Freelance UI Audit", amount: 860, type: "income", category: "Freelance", date: `${currentMonth}-04`, note: "Side project" },
      { id: "txn-3", title: "Groceries", amount: 186, type: "expense", category: "Food", date: `${currentMonth}-03`, note: "Weekly groceries" },
      { id: "txn-4", title: "Airport Taxi", amount: 62, type: "expense", category: "Travel", date: `${currentMonth}-06`, note: "Client visit" },
      { id: "txn-5", title: "Internet Bill", amount: 78, type: "expense", category: "Bills", date: `${currentMonth}-05`, note: "Fiber connection" },
      { id: "txn-6", title: "Coffee Meetings", amount: 54, type: "expense", category: "Food", date: `${currentMonth}-08`, note: "Team sync" },
      { id: "txn-7", title: "Shopping Mall", amount: 140, type: "expense", category: "Shopping", date: `${currentMonth}-10`, note: "Clothes and basics" },
      { id: "txn-8", title: "Movie Night", amount: 48, type: "expense", category: "Entertainment", date: `${currentMonth}-12`, note: "Weekend outing" },
      { id: "txn-9", title: "Health Checkup", amount: 110, type: "expense", category: "Health", date: `${currentMonth}-14`, note: "Routine visit" },
      { id: "txn-10", title: "Emergency Fund", amount: 300, type: "expense", category: "Savings", date: `${currentMonth}-15`, note: "Monthly transfer" },
      { id: "txn-11", title: "Restaurant Dinner", amount: 95, type: "expense", category: "Food", date: `${currentMonth}-18`, note: "Family dinner" },
      { id: "txn-12", title: "Utility Bill", amount: 120, type: "expense", category: "Bills", date: `${currentMonth}-20`, note: "Electricity and water" },
      { id: "txn-13", title: "Taxi Reimbursement", amount: 90, type: "income", category: "Freelance", date: `${currentMonth}-21`, note: "Client reimbursement" },
      { id: "txn-14", title: "Weekend Train", amount: 40, type: "expense", category: "Travel", date: `${currentMonth}-22`, note: "City trip" },
      { id: "txn-15", title: "Previous Month Rent", amount: 950, type: "expense", category: "Bills", date: previousMonthDate(3), note: "Apartment rent" },
      { id: "txn-16", title: "Previous Month Groceries", amount: 152, type: "expense", category: "Food", date: previousMonthDate(9), note: "Stock-up" },
      { id: "txn-17", title: "Previous Month Salary", amount: 5200, type: "income", category: "Salary", date: previousMonthDate(1), note: "Primary paycheck" },
      { id: "txn-18", title: "Previous Month Shopping", amount: 90, type: "expense", category: "Shopping", date: previousMonthDate(15), note: "Home supplies" }
    ]
  };
}

export function buildInsights({ transactions, totals, monthlyTrend, budgetUsage }) {
  const [previous = { expenses: 0, income: 0 }, current = { expenses: totals.expenses, income: totals.income }] =
    monthlyTrend.slice(-2);

  const foodSpend = transactions
    .filter((item) => item.type === "expense" && item.category === "Food" && item.date.startsWith(currentMonth))
    .reduce((sum, item) => sum + item.amount, 0);
  const priorFoodSpend = transactions
    .filter((item) => item.type === "expense" && item.category === "Food" && !item.date.startsWith(currentMonth))
    .reduce((sum, item) => sum + item.amount, 0);
  const foodDelta = priorFoodSpend ? Math.round(((foodSpend - priorFoodSpend) / priorFoodSpend) * 100) : 0;
  const savingsDelta = current.income - current.expenses - (previous.income - previous.expenses);

  return [
    {
      id: "insight-1",
      tone: foodDelta > 0 ? "warning" : "positive",
      title: "Food trend",
      description:
        foodDelta > 0
          ? `You spent ${foodDelta}% more on food this month. Meal planning could flatten that curve.`
          : "Food spending is steady or lower than last month."
    },
    {
      id: "insight-2",
      tone: savingsDelta < 0 ? "warning" : "positive",
      title: "Savings momentum",
      description:
        savingsDelta < 0
          ? "Your savings decreased compared to last month. Bills and shopping are the biggest drivers."
          : "Savings improved compared to last month. Keep leaning on consistent income and lower impulse spends."
    },
    {
      id: "insight-3",
      tone: budgetUsage.percentage > 90 ? "warning" : "info",
      title: "Budget pulse",
      description:
        budgetUsage.percentage > 100
          ? "You have crossed the monthly budget. Pause non-essential purchases for the rest of the month."
          : `You have used ${budgetUsage.percentage}% of your budget, leaving ${formatCurrency(
              budgetUsage.remaining
            )} available.`
    }
  ];
}

export function buildAssistantReply(question, state) {
  const normalized = question.toLowerCase();
  const expenseTotal = state.transactions
    .filter((item) => item.type === "expense" && item.date.startsWith(currentMonth))
    .reduce((sum, item) => sum + item.amount, 0);
  const topCategory = state.transactions
    .filter((item) => item.type === "expense" && item.date.startsWith(currentMonth))
    .reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + item.amount;
      return acc;
    }, {});
  const highestCategory = Object.entries(topCategory).sort((a, b) => b[1] - a[1])[0];

  if (normalized.includes("how much") && normalized.includes("spend")) {
    return `You spent ${formatCurrency(expenseTotal)} this month so far. The largest share went to ${
      highestCategory?.[0] || "expenses"
    }.`;
  }

  if (normalized.includes("save")) {
    return `You can save money by trimming ${highestCategory?.[0] || "your top spending category"}. Reducing it by 10% would keep more cash free for your goals.`;
  }

  if (normalized.includes("budget")) {
    return `Your monthly budget is ${formatCurrency(
      state.budget.monthlyBudget
    )}. Focus on bills first, then cap flexible categories like food and shopping.`;
  }

  return "I can summarize monthly spending, highlight categories to reduce, and compare this month with last month. Try asking about savings, budget, or total spending.";
}
