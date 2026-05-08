const fs = require("fs/promises");
const path = require("path");

const asyncHandler = require("../utils/asyncHandler");
const { AppError } = require("../utils/errors");
const PasswordResetToken = require("../../models/PasswordResetToken");
const Transaction = require("../../models/Transaction");
const User = require("../../models/User");
const { hashPassword, verifyPassword } = require("../../utils/password");
const { getNetBalance } = require("../services/transactionSummaryService");
const { formatCurrency } = require("../utils/currency");
const { generateId, mapGoal, buildStatePayload } = require("../utils/userState");
const { mapTransaction } = require("./authController");

function parsePositiveNumber(value, fieldName, { allowZero = false } = {}) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0 || (!allowZero && parsed === 0)) {
    throw new AppError(`${fieldName} must be a valid ${allowZero ? "non-negative" : "positive"} number.`, 400);
  }

  return parsed;
}

function parseContributionDate(value) {
  if (!value) {
    return new Date();
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T00:00:00.000Z`);
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new AppError("Contribution date must be a valid date.", 400);
  }

  return parsedDate;
}

function buildGoalContributionTransaction({ userId, goal, amount, date }) {
  return {
    userId,
    title: `${formatCurrency(amount)} contributed to goal: ${goal.title}`,
    amount,
    type: "expense",
    category: "Savings",
    date,
    note: `Contribution to ${goal.title} savings goal`
  };
}

function buildGoalRefundTransaction({ userId, goal, amount }) {
  return {
    userId,
    title: `${formatCurrency(amount)} refunded from deleted goal: ${goal.title}`,
    amount,
    type: "income",
    category: "Savings",
    date: new Date(),
    note: `Refunded because the savings goal "${goal.title}" was deleted.`
  };
}

async function assertGoalContributionWithinBalance(userId, amount) {
  const availableBalance = await getNetBalance(userId);

  if (Number(amount || 0) > availableBalance) {
    throw new AppError(
      `You only have ${formatCurrency(
        availableBalance
      )} available. Please enter a goal contribution amount less than or equal to your net balance.`,
      400
    );
  }
}

async function saveAvatarUpload(userId, avatarData) {
  if (!avatarData) {
    return "";
  }

  if (typeof avatarData !== "string") {
    throw new AppError("Profile picture must be a valid image upload.", 400);
  }

  const match = avatarData.match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw new AppError("Profile picture must be a PNG, JPG, WEBP, or GIF image.", 400);
  }

  const [, mimeType, base64Data] = match;
  const imageBuffer = Buffer.from(base64Data, "base64");

  if (!imageBuffer.length || imageBuffer.length > 750 * 1024) {
    throw new AppError("Profile picture must be 750 KB or smaller.", 400);
  }

  const extensionByMime = {
    "image/gif": "gif",
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
  };
  const extension = extensionByMime[mimeType];
  const uploadDir = path.resolve(__dirname, "../../uploads/avatars");
  const filename = `${userId}-${Date.now()}.${extension}`;

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, filename), imageBuffer);

  return `/uploads/avatars/${filename}`;
}

const updateProfile = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim();
  const role = req.body.role?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const avatar = req.body.avatar?.trim();
  const avatarData = req.body.avatarData;

  if (!name || !role || !email) {
    throw new AppError("Name, role, and email are required.", 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError("Email must be valid.", 400);
  }

  const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
  if (existingUser) {
    throw new AppError("An account with this email already exists.", 409);
  }

  req.user.name = name;
  req.user.role = role;
  req.user.email = email;

  if (avatarData) {
    req.user.avatar = await saveAvatarUpload(req.user._id, avatarData);
  } else if (avatar) {
    req.user.avatar = avatar;
  }
  await req.user.save();

  res.json({
    message: "Profile updated successfully.",
    state: buildStatePayload(req.user)
  });
});

const updatePreferences = asyncHandler(async (req, res) => {
  const theme = req.body.theme;

  if (!["light", "dark"].includes(theme)) {
    throw new AppError("Theme must be either `light` or `dark`.", 400);
  }

  req.user.preferences = {
    ...req.user.preferences,
    theme
  };
  await req.user.save();

  res.json({
    message: "Preferences updated successfully.",
    state: buildStatePayload(req.user)
  });
});

const updateBudget = asyncHandler(async (req, res) => {
  const monthlyBudget = parsePositiveNumber(req.body.monthlyBudget, "Monthly budget", { allowZero: true });

  req.user.budget = {
    ...req.user.budget,
    monthlyBudget
  };
  await req.user.save();

  res.json({
    message: "Budget updated successfully.",
    state: buildStatePayload(req.user)
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const currentPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;

  if (!currentPassword || !newPassword) {
    throw new AppError("Current password and new password are required.", 400);
  }

  if (newPassword.length < 6) {
    throw new AppError("New password must be at least 6 characters long.", 400);
  }

  const passwordMatches = await verifyPassword(currentPassword, req.user.passwordHash);
  if (!passwordMatches) {
    throw new AppError("Current password is incorrect.", 401);
  }

  req.user.passwordHash = await hashPassword(newPassword);
  await req.user.save();

  res.json({
    message: "Password changed successfully."
  });
});

const deleteAccount = asyncHandler(async (req, res) => {
  const password = req.body.password;

  if (!password) {
    throw new AppError("Password is required to delete your account.", 400);
  }

  const passwordMatches = await verifyPassword(password, req.user.passwordHash);
  if (!passwordMatches) {
    throw new AppError("Password is incorrect.", 401);
  }

  await Transaction.deleteMany({ userId: req.user._id });
  await PasswordResetToken.deleteMany({ userId: req.user._id });
  await User.deleteOne({ _id: req.user._id });

  res.json({
    message: "Account deleted permanently."
  });
});

const addGoal = asyncHandler(async (req, res) => {
  const title = req.body.title?.trim();
  const target = parsePositiveNumber(req.body.target, "Goal target");
  const saved = parsePositiveNumber(req.body.saved, "Saved amount", { allowZero: true });
  const deadline = req.body.deadline;

  if (!title || !deadline) {
    throw new AppError("Goal title and deadline are required.", 400);
  }

  if (saved > target) {
    throw new AppError("Saved amount cannot be greater than the goal target.", 400);
  }

  if (saved > 0) {
    await assertGoalContributionWithinBalance(req.user._id, saved);
  }

  const goal = {
    id: generateId("goal"),
    title,
    target,
    saved,
    deadline
  };

  req.user.goals = [...(req.user.goals || []), goal];
  await req.user.save();
  const transaction =
    saved > 0
      ? await Transaction.create(
          buildGoalContributionTransaction({
            userId: req.user._id,
            goal,
            amount: saved,
            date: new Date()
          })
        )
      : null;

  res.status(201).json({
    message: "Goal added successfully.",
    goal: mapGoal(goal),
    transaction: transaction ? mapTransaction(transaction) : null,
    state: buildStatePayload(req.user)
  });
});

const contributeToGoal = asyncHandler(async (req, res) => {
  const amount = parsePositiveNumber(req.body.amount, "Contribution amount");
  const date = parseContributionDate(req.body.date);
  const goal = req.user.goals?.find((item) => item.id === req.params.goalId);

  if (!goal) {
    throw new AppError("Goal not found.", 404);
  }

  const remainingAmount = Math.max(goal.target - goal.saved, 0);
  const appliedAmount = Math.min(amount, remainingAmount);

  if (!appliedAmount) {
    throw new AppError("This goal is already fully funded.", 400);
  }

  await assertGoalContributionWithinBalance(req.user._id, appliedAmount);

  goal.saved += appliedAmount;
  await req.user.save();
  const transaction = await Transaction.create(
    buildGoalContributionTransaction({
      userId: req.user._id,
      goal,
      amount: appliedAmount,
      date
    })
  );

  res.json({
    message: "Goal contribution saved successfully.",
    goal: mapGoal(goal),
    transaction: mapTransaction(transaction),
    state: buildStatePayload(req.user)
  });
});

const deleteGoal = asyncHandler(async (req, res) => {
  const existingGoals = req.user.goals || [];
  const deletedGoal = existingGoals.find((goal) => goal.id === req.params.goalId);
  const nextGoals = existingGoals.filter((goal) => goal.id !== req.params.goalId);

  if (!deletedGoal) {
    throw new AppError("Goal not found.", 404);
  }

  req.user.goals = nextGoals;
  await req.user.save();
  const refundAmount = Number(deletedGoal.saved || 0);
  const refundTransaction =
    refundAmount > 0
      ? await Transaction.create(
          buildGoalRefundTransaction({
            userId: req.user._id,
            goal: deletedGoal,
            amount: refundAmount
          })
        )
      : null;

  res.json({
    message: "Goal deleted successfully.",
    transaction: refundTransaction ? mapTransaction(refundTransaction) : null,
    state: buildStatePayload(req.user)
  });
});

module.exports = {
  addGoal,
  changePassword,
  contributeToGoal,
  deleteGoal,
  deleteAccount,
  updateBudget,
  updatePreferences,
  updateProfile
};
