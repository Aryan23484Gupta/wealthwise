const crypto = require("crypto");

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
    read: Boolean(notification.read)
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
    notifications: Array.isArray(user.notifications) ? user.notifications.map(mapNotification) : []
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

  if (!Array.isArray(user.notifications) || user.notifications.length === 0) {
    user.notifications = [
      {
        id: generateId("note"),
        type: "success",
        title: "Welcome to WealthWise",
        message: "Your account is ready. Start tracking transactions and savings goals.",
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
        read: false
      },
      {
        id: generateId("note"),
        type: "info",
        title: "Budget summary ready",
        message: "Your weekly spending summary is ready to review.",
        createdAt: new Date(Date.now() - 1000 * 60 * 20),
        read: false
      }
    ];
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
