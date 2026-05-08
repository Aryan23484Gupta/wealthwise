const crypto = require("crypto");

const HIGHLIGHT_COUNT = 5;

const FINANCIAL_HIGHLIGHTS = {
  saving: [
    "Save at least 20% of your income",
    "Automate savings after every salary credit",
    "Review recurring expenses every month",
    "Keep an emergency fund ready",
    "Plan big purchases before payday"
  ],
  investment: [
    "SIP investments work best long-term",
    "Diversify before increasing investment risk",
    "Review mutual funds before switching",
    "Invest only after covering essentials",
    "Match investments with time horizon"
  ],
  fraud: [
    "Never share OTP or UPI PIN",
    "Verify payment links before clicking",
    "Do not approve unknown UPI requests",
    "Use strong passwords for banking apps",
    "Check bank alerts for suspicious activity"
  ],
  spending: [
    "Avoid unnecessary subscriptions",
    "Compare prices before major purchases",
    "Set weekly limits for flexible spending",
    "Track small spends before they add up",
    "Pause before impulse purchases"
  ],
  awareness: [
    "Check your credit report periodically",
    "Pay credit card bills on time",
    "Keep insurance details updated",
    "Separate needs from wants clearly",
    "Review your budget every weekend"
  ]
};

function getDailyHighlightDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function getStableIndex(seed, length) {
  const digest = crypto.createHash("sha256").update(seed).digest("hex");
  return parseInt(digest.slice(0, 8), 16) % length;
}

function rotateList(items, seed) {
  if (!items.length) {
    return [];
  }

  const startIndex = getStableIndex(seed, items.length);
  return [...items.slice(startIndex), ...items.slice(0, startIndex)];
}

function buildHighlightNotification({ category, title, dateKey, index, read = false }) {
  return {
    id: `highlight-${dateKey}-${category}-${index}`,
    type: category === "fraud" ? "warning" : category === "saving" ? "success" : "info",
    title,
    message: title,
    createdAt: new Date(`${dateKey}T00:00:00.000Z`),
    read,
    url: "",
    source: "",
    publishedAt: new Date(`${dateKey}T00:00:00.000Z`)
  };
}

function createDailyFinancialHighlights({ date = new Date(), existingNotifications = [] } = {}) {
  const dateKey = getDailyHighlightDateKey(date);
  const readById = new Map(
    existingNotifications
      .filter((notification) => String(notification.id || "").startsWith(`highlight-${dateKey}-`))
      .map((notification) => [notification.id, Boolean(notification.read)])
  );
  const orderedCategories = ["saving", "investment", "fraud", "spending", "awareness"];

  return orderedCategories.slice(0, HIGHLIGHT_COUNT).map((category, index) => {
    const tips = rotateList(FINANCIAL_HIGHLIGHTS[category], `${dateKey}-${category}`);
    const title = tips[0];
    const notification = buildHighlightNotification({
      category,
      title,
      dateKey,
      index,
      read: false
    });

    return {
      ...notification,
      read: readById.get(notification.id) || false
    };
  });
}

async function syncDailyFinancialHighlights(user) {
  const existingNotifications = Array.isArray(user.notifications) ? user.notifications : [];
  const dailyHighlights = createDailyFinancialHighlights({ existingNotifications });
  const currentIds = dailyHighlights.map((notification) => notification.id).join("|");
  const existingIds = existingNotifications.map((notification) => notification.id).join("|");

  if (existingNotifications.length === HIGHLIGHT_COUNT && existingIds === currentIds) {
    if (typeof user.isModified === "function" && user.isModified("notifications")) {
      await user.save();
    }

    return user.notifications;
  }

  user.notifications = dailyHighlights;
  await user.save();
  return user.notifications;
}

module.exports = {
  FINANCIAL_HIGHLIGHTS,
  HIGHLIGHT_COUNT,
  createDailyFinancialHighlights,
  getDailyHighlightDateKey,
  syncDailyFinancialHighlights
};
