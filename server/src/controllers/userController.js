const asyncHandler = require("../utils/asyncHandler");
const { AppError } = require("../utils/errors");
const User = require("../../models/User");
const { generateId, mapGoal, buildStatePayload } = require("../utils/userState");

function parsePositiveNumber(value, fieldName, { allowZero = false } = {}) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 0 || (!allowZero && parsed === 0)) {
    throw new AppError(`${fieldName} must be a valid ${allowZero ? "non-negative" : "positive"} number.`, 400);
  }

  return parsed;
}

const updateProfile = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim();
  const role = req.body.role?.trim();
  const email = req.body.email?.trim().toLowerCase();

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

  const goal = {
    id: generateId("goal"),
    title,
    target,
    saved,
    deadline
  };

  req.user.goals = [...(req.user.goals || []), goal];
  await req.user.save();

  res.status(201).json({
    message: "Goal added successfully.",
    goal: mapGoal(goal),
    state: buildStatePayload(req.user)
  });
});

const contributeToGoal = asyncHandler(async (req, res) => {
  const amount = parsePositiveNumber(req.body.amount, "Contribution amount");
  const goal = req.user.goals?.find((item) => item.id === req.params.goalId);

  if (!goal) {
    throw new AppError("Goal not found.", 404);
  }

  goal.saved = Math.min(goal.target, goal.saved + amount);
  await req.user.save();

  res.json({
    message: "Goal contribution saved successfully.",
    goal: mapGoal(goal),
    state: buildStatePayload(req.user)
  });
});

module.exports = {
  addGoal,
  contributeToGoal,
  updateBudget,
  updatePreferences,
  updateProfile
};
