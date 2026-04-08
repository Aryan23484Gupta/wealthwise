import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { buildAssistantReply, buildInsights, createSeedData } from "../data/mockData";
import {
  computeCategoryBreakdown,
  computeMonthlyTrend,
  computeTotals,
  filterTransactions,
  generateId,
  getBudgetUsage,
  getGoalProgress,
  getRecentTransactions,
  getSavingsDelta
} from "../utils/finance";

const FinanceContext = createContext(null);
const STORAGE_KEY = "pulseiq-finance-state";

export function FinanceProvider({ children }) {
  const [state, setState] = useState(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : createSeedData();
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const value = useMemo(() => {
    const totals = computeTotals(state.transactions);
    const recentTransactions = getRecentTransactions(state.transactions, 8);
    const categoryData = computeCategoryBreakdown(state.transactions);
    const monthlyTrend = computeMonthlyTrend(state.transactions);
    const budgetUsage = getBudgetUsage(state.transactions, state.budget.monthlyBudget);
    const savingsProgress = getGoalProgress(state.goals);
    const insights = buildInsights({
      transactions: state.transactions,
      totals,
      monthlyTrend,
      budgetUsage
    });
    const notifications = [
      ...state.notifications,
      ...(budgetUsage.percentage > 100
        ? [
            {
              id: "budget-warning",
              type: "warning",
              title: "Budget exceeded",
              message: "You are over your monthly budget. Review your top categories."
            }
          ]
        : []),
      ...(getSavingsDelta(monthlyTrend) < 0
        ? [
            {
              id: "savings-warning",
              type: "info",
              title: "Savings slipped",
              message: "Savings are down versus last month. AI insights can help spot why."
            }
          ]
        : [])
    ];

    return {
      ...state,
      totals,
      recentTransactions,
      categoryData,
      monthlyTrend,
      budgetUsage,
      savingsProgress,
      insights,
      notifications,
      filteredTransactions: (filters) => filterTransactions(state.transactions, filters),
      login: (payload) =>
        setState((current) => ({
          ...current,
          user: {
            ...current.user,
            name: payload.name || current.user.name,
            email: payload.email,
            isAuthenticated: true
          }
        })),
      logout: () =>
        setState((current) => ({
          ...current,
          user: {
            ...current.user,
            isAuthenticated: false
          }
        })),
      toggleTheme: () =>
        setState((current) => ({
          ...current,
          preferences: {
            ...current.preferences,
            theme: current.preferences.theme === "dark" ? "light" : "dark"
          }
        })),
      addTransaction: (transaction) =>
        setState((current) => ({
          ...current,
          transactions: [{ ...transaction, id: generateId("txn") }, ...current.transactions]
        })),
      updateTransaction: (transactionId, updates) =>
        setState((current) => ({
          ...current,
          transactions: current.transactions.map((item) =>
            item.id === transactionId ? { ...item, ...updates } : item
          )
        })),
      deleteTransaction: (transactionId) =>
        setState((current) => ({
          ...current,
          transactions: current.transactions.filter((item) => item.id !== transactionId)
        })),
      setBudget: (amount) =>
        setState((current) => ({
          ...current,
          budget: {
            ...current.budget,
            monthlyBudget: Number(amount)
          }
        })),
      updateProfile: (profile) =>
        setState((current) => ({
          ...current,
          user: {
            ...current.user,
            ...profile
          }
        })),
      addGoal: (goal) =>
        setState((current) => ({
          ...current,
          goals: [...current.goals, { ...goal, id: generateId("goal") }]
        })),
      contributeToGoal: (goalId, amount) =>
        setState((current) => ({
          ...current,
          goals: current.goals.map((goal) =>
            goal.id === goalId
              ? { ...goal, saved: Math.min(goal.target, goal.saved + Number(amount)) }
              : goal
          )
        })),
      askAssistant: (question) => buildAssistantReply(question, state)
    };
  }, [state]);

  useEffect(() => {
    document.body.dataset.theme = state.preferences.theme;
  }, [state.preferences.theme]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance must be used within FinanceProvider");
  }

  return context;
}
