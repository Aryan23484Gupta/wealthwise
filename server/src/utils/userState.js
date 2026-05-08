const crypto = require("crypto");
const {
  createDailyFinancialHighlights,
  getDailyHighlightDateKey
} = require("../services/financialHighlightsService");

function generateId(prefix) {
  return `${prefix}-${crypto.randomBytes(6).toString("hex")}`;
}

function hashSessionToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function createSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

function mapNotification(notification) {
  return {
    id: notification.id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    createdAt: new Date(notification.createdAt).toISOString(),
    read: Boolean(notification.read),
    url: notification.url || "",
    source: notification.source || "",
    publishedAt: notification.publishedAt ? new Date(notification.publishedAt).toISOString() : ""
  };
}

function mapGoal(goal) {
  return {
    id: goal.id,
    title: goal.title,
    target: goal.target,
    saved: goal.saved,
    deadline: goal.deadline
  };
}

function buildUserPayload(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    isAuthenticated: true
  };
}

function buildStatePayload(user) {
  return {
    user: buildUserPayload(user),
    preferences: {
      theme: user.preferences?.theme || "dark"
    },
    budget: {
      monthlyBudget: user.budget?.monthlyBudget ?? 0
    },
    goals: Array.isArray(user.goals) ? user.goals.map(mapGoal) : [],
    notifications: Array.isArray(user.notifications) ? user.notifications.slice(0, 5).map(mapNotification) : []
  };
}

function ensureUserDefaults(user) {
  if (!user.preferences) {
    user.preferences = { theme: "dark" };
  }

  if (!user.budget) {
    user.budget = { monthlyBudget: 0 };
  }

  if (!Array.isArray(user.goals)) {
    user.goals = [];
  }

  const dailyHighlightPrefix = `highlight-${getDailyHighlightDateKey()}-`;
  const hasCurrentDailyHighlights =
    Array.isArray(user.notifications) &&
    user.notifications.length === 5 &&
    user.notifications.every((notification) => String(notification.id || "").startsWith(dailyHighlightPrefix));

  if (!hasCurrentDailyHighlights) {
    user.notifications = createDailyFinancialHighlights({
      existingNotifications: Array.isArray(user.notifications) ? user.notifications : []
    });
  }
}

module.exports = {
  buildStatePayload,
  buildUserPayload,
  createSessionToken,
  ensureUserDefaults,
  generateId,
  hashSessionToken,
  mapGoal,
  mapNotification
};
