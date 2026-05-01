import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { buildInsights, createSeedData } from "../data/mockData";
import {
  computeCategoryBreakdown,
  computeMonthlyTrend,
  computeTotals,
  filterTransactions,
  generateId,
  getBudgetUsage,
  getGoalProgress,
  getRecentTransactions
} from "../utils/finance";

const FinanceContext = createContext(null);
const STORAGE_KEY = "wealthwise-finance-state";
const CHAT_STORAGE_KEY = "wealthwise-assistant-messages";
const TOKEN_STORAGE_KEY = "wealthwise-auth-token";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const seedState = createSeedData();

function createInitialAssistantMessages() {
  return createSeedData().assistantMessages;
}

function createGuestState(theme = seedState.preferences.theme) {
  return {
    ...createSeedData(),
    preferences: {
      theme
    }
  };
}

function readSessionAssistantMessages() {
  const fallbackMessages = createInitialAssistantMessages();
  const stored = window.sessionStorage.getItem(CHAT_STORAGE_KEY);

  if (!stored) {
    return fallbackMessages;
  }

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length ? parsed : fallbackMessages;
  } catch {
    window.sessionStorage.removeItem(CHAT_STORAGE_KEY);
    return fallbackMessages;
  }
}

function removeAssistantMessages(state) {
  const { assistantMessages, ...persistableState } = state;
  return persistableState;
}

function parseStoredState() {
  const assistantMessages = readSessionAssistantMessages();
  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    return {
      ...createGuestState(),
      assistantMessages
    };
  }

  try {
    return {
      ...createGuestState(),
      ...JSON.parse(stored),
      assistantMessages
    };
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return {
      ...createGuestState(),
      assistantMessages
    };
  }
}

function buildAuthHeaders(token, extraHeaders = {}) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders
  };
}

function mergeSessionState(sessionState, currentState) {
  return {
    ...createGuestState(currentState.preferences.theme),
    ...currentState,
    ...sessionState,
    transactions: sessionState.transactions ?? currentState.transactions,
    goals: sessionState.goals ?? currentState.goals,
    notifications: sessionState.notifications ?? currentState.notifications,
    assistantMessages: currentState.assistantMessages
  };
}

export function FinanceProvider({ children }) {
  const [state, setState] = useState(() => parseStoredState());
  const [authToken, setAuthToken] = useState(() => window.localStorage.getItem(TOKEN_STORAGE_KEY) || "");
  const [isBootstrapping, setIsBootstrapping] = useState(() =>
    Boolean(window.localStorage.getItem(TOKEN_STORAGE_KEY))
  );
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(removeAssistantMessages(state)));
  }, [state]);

  useEffect(() => {
    window.sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(state.assistantMessages));
  }, [state.assistantMessages]);

  useEffect(() => {
    if (authToken) {
      window.localStorage.setItem(TOKEN_STORAGE_KEY, authToken);
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }, [authToken]);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      if (!authToken) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/session`, {
          headers: buildAuthHeaders(authToken)
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Session expired.");
        }

        if (!isMounted) {
          return;
        }

        setState((current) => mergeSessionState(data.state, current));
      } catch {
        if (!isMounted) {
          return;
        }

        setAuthToken("");
        window.sessionStorage.removeItem(CHAT_STORAGE_KEY);
        setState((current) => createGuestState(current.preferences.theme));
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, [authToken]);

  useEffect(() => {
    document.body.dataset.theme = state.preferences.theme;
  }, [state.preferences.theme]);

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

    async function request(path, options = {}) {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: buildAuthHeaders(authToken, options.headers)
      });

      let data = {};
      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        throw new Error(data.message || "Request failed.");
      }

      return data;
    }

    function applyState(nextState) {
      setState((current) => mergeSessionState(nextState, current));
    }

    return {
      ...state,
      totals,
      recentTransactions,
      categoryData,
      monthlyTrend,
      budgetUsage,
      savingsProgress,
      insights,
      notificationsLoading,
      notificationsError,
      isBootstrapping,
      filteredTransactions: (filters) => filterTransactions(state.transactions, filters),
      login: async (payload) => {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: payload.email,
            password: payload.password
          })
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Login failed.");
        }

        setAuthToken(data.token);
        applyState(data.state);
        return data.state.user;
      },
      requestSignupOtp: async (payload) => {
        const response = await fetch(`${API_BASE_URL}/api/auth/signup/request-otp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: payload.name,
            email: payload.email,
            password: payload.password
          })
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Signup failed.");
        }

        return data;
      },
      verifySignupOtp: async (payload) => {
        const response = await fetch(`${API_BASE_URL}/api/auth/signup/verify-otp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: payload.email,
            otp: payload.otp
          })
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "OTP verification failed.");
        }

        setAuthToken(data.token);
        applyState(data.state);
        return data.state.user;
      },
      resendSignupOtp: async (email) => {
        const response = await fetch(`${API_BASE_URL}/api/auth/signup/resend-otp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email })
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to resend OTP.");
        }

        return data;
      },
      requestPasswordReset: async (email) => {
        const response = await fetch(`${API_BASE_URL}/api/auth/password/forgot`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ email })
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to request password reset.");
        }

        return data;
      },
      resetPassword: async (payload) => {
        const response = await fetch(`${API_BASE_URL}/api/auth/password/reset`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to reset password.");
        }

        return data;
      },
      logout: async () => {
        const theme = state.preferences.theme;

        try {
          if (authToken) {
            await request("/api/auth/logout", {
              method: "POST"
            });
          }
        } catch {
          // Ignore logout failures and clear the local session anyway.
        } finally {
          setAuthToken("");
          window.sessionStorage.removeItem(CHAT_STORAGE_KEY);
          setState(createGuestState(theme));
        }
      },
      refreshNotifications: async () => {
        if (!authToken) {
          return [];
        }

        setNotificationsLoading(true);
        setNotificationsError("");

        try {
          const data = await request("/api/notifications");
          setState((current) => ({
            ...current,
            notifications: data.notifications || []
          }));
          return data.notifications || [];
        } catch (error) {
          setNotificationsError(error.message);
          throw error;
        } finally {
          setNotificationsLoading(false);
        }
      },
      markNotificationsRead: async () => {
        if (!authToken) {
          return [];
        }

        const previousNotifications = state.notifications;
        setNotificationsError("");
        setState((current) => ({
          ...current,
          notifications: current.notifications.map((item) => ({ ...item, read: true }))
        }));

        try {
          const data = await request("/api/notifications/read", {
            method: "PUT"
          });
          setState((current) => ({
            ...current,
            notifications: data.notifications || []
          }));
          return data.notifications || [];
        } catch (error) {
          setState((current) => ({
            ...current,
            notifications: previousNotifications
          }));
          setNotificationsError(error.message);
          throw error;
        }
      },
      toggleTheme: async () => {
        const nextTheme = state.preferences.theme === "dark" ? "light" : "dark";
        const previousTheme = state.preferences.theme;

        setState((current) => ({
          ...current,
          preferences: {
            ...current.preferences,
            theme: nextTheme
          }
        }));

        if (!authToken) {
          return;
        }

        try {
          const data = await request("/api/users/preferences", {
            method: "PUT",
            body: JSON.stringify({ theme: nextTheme })
          });
          applyState(data.state);
        } catch {
          setState((current) => ({
            ...current,
            preferences: {
              ...current.preferences,
              theme: previousTheme
            }
          }));
        }
      },
      addTransaction: async (transaction) => {
        const data = await request("/api/transactions", {
          method: "POST",
          body: JSON.stringify(transaction)
        });

        setState((current) => ({
          ...current,
          transactions: [data.transaction, ...current.transactions]
        }));

        return data.transaction;
      },
      updateTransaction: async (transactionId, updates) => {
        const data = await request(`/api/transactions/${transactionId}`, {
          method: "PUT",
          body: JSON.stringify(updates)
        });

        setState((current) => ({
          ...current,
          transactions: current.transactions.map((item) =>
            item.id === transactionId ? data.transaction : item
          )
        }));

        return data.transaction;
      },
      deleteTransaction: async (transactionId) => {
        await request(`/api/transactions/${transactionId}`, {
          method: "DELETE"
        });

        setState((current) => ({
          ...current,
          transactions: current.transactions.filter((item) => item.id !== transactionId)
        }));
      },
      resetAllTransactions: async () => {
        if (authToken) {
          await request("/api/transactions", {
            method: "DELETE"
          });
        }

        setState((current) => ({
          ...current,
          transactions: []
        }));
      },
      setBudget: async (amount) => {
        const monthlyBudget = Number(amount);

        if (!authToken) {
          setState((current) => ({
            ...current,
            budget: {
              ...current.budget,
              monthlyBudget
            }
          }));
          return;
        }

        const data = await request("/api/users/budget", {
          method: "PUT",
          body: JSON.stringify({ monthlyBudget })
        });
        applyState(data.state);
      },
      updateProfile: async (profile) => {
        if (!authToken) {
          setState((current) => ({
            ...current,
            user: {
              ...current.user,
              ...profile
            }
          }));
          return;
        }

        const data = await request("/api/users/profile", {
          method: "PUT",
          body: JSON.stringify(profile)
        });
        applyState(data.state);
      },
      changePassword: async (payload) => {
        await request("/api/users/password", {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      },
      deleteAccount: async (password) => {
        await request("/api/users/account", {
          method: "DELETE",
          body: JSON.stringify({ password })
        });
        setAuthToken("");
        window.sessionStorage.removeItem(CHAT_STORAGE_KEY);
        setState(createGuestState(state.preferences.theme));
      },
      addGoal: async (goal) => {
        if (!authToken) {
          const fallbackGoal = { ...goal, id: generateId("goal") };
          setState((current) => ({
            ...current,
            goals: [...current.goals, fallbackGoal]
          }));
          return fallbackGoal;
        }

        const data = await request("/api/users/goals", {
          method: "POST",
          body: JSON.stringify(goal)
        });
        applyState(data.state);
        return data.goal;
      },
      contributeToGoal: async (goalId, amount) => {
        if (!authToken) {
          setState((current) => ({
            ...current,
            goals: current.goals.map((goal) =>
              goal.id === goalId
                ? { ...goal, saved: Math.min(goal.target, goal.saved + Number(amount)) }
                : goal
            )
          }));
          return;
        }

        const data = await request(`/api/users/goals/${goalId}/contribute`, {
          method: "POST",
          body: JSON.stringify({ amount: Number(amount) })
        });
        applyState(data.state);
        return data.goal;
      },
      askAssistant: async (question, provider = "openai") => {
        const response = await fetch(`${API_BASE_URL}/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            provider,
            message: question,
            context: {
              user: state.user,
              budget: state.budget,
              goals: state.goals,
              transactions: state.transactions
            }
          })
        });

        let data = {};

        try {
          data = await response.json();
        } catch {
          data = {};
        }

        if (!response.ok) {
          throw new Error(data.message || "Assistant request failed.");
        }

        return data.message;
      },
      appendAssistantMessage: (message) => {
        setState((current) => ({
          ...current,
          assistantMessages: [...current.assistantMessages, message]
        }));
      },
      clearAssistantChat: () => {
        const initialMessages = createInitialAssistantMessages();
        window.sessionStorage.removeItem(CHAT_STORAGE_KEY);
        setState((current) => ({
          ...current,
          assistantMessages: initialMessages
        }));
      }
    };
  }, [authToken, isBootstrapping, notificationsError, notificationsLoading, state]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance must be used within FinanceProvider");
  }

  return context;
}
