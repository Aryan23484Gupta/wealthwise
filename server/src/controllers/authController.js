const mongoose = require("mongoose");

const PendingSignup = require("../../models/PendingSignup");
const PasswordResetToken = require("../../models/PasswordResetToken");
const Transaction = require("../../models/Transaction");
const User = require("../../models/User");
const { hashPassword, verifyPassword } = require("../../utils/password");
const asyncHandler = require("../utils/asyncHandler");
const { AppError } = require("../utils/errors");
const {
  buildStatePayload,
  createSessionToken,
  ensureUserDefaults,
  hashSessionToken
} = require("../utils/userState");

const OTP_EXPIRY_MINUTES = 10;
const PASSWORD_RESET_EXPIRY_MINUTES = 10;

function mapTransaction(transaction) {
  return {
    id: String(transaction._id),
    title: transaction.title,
    amount: transaction.amount,
    type: transaction.type,
    category: transaction.category,
    date: new Date(transaction.date).toISOString().slice(0, 10),
    note: transaction.note
  };
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function getOtpPreview(code) {
  return process.env.NODE_ENV === "production" ? undefined : code;
}

async function sendSignupOtpEmail(req, { email, name, otpCode, otpExpiresAt }) {
  const emailService = req.app.locals.emailService;

  if (!emailService?.isConfigured()) {
    return false;
  }

  const expiryTime = new Date(otpExpiresAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  await emailService.sendMail({
    to: email,
    subject: "Your WealthWise verification code",
    text: [
      `Hi ${name},`,
      "",
      `Your WealthWise OTP is ${otpCode}.`,
      `This code expires on ${expiryTime}.`,
      "",
      "If you did not request this, you can ignore this email."
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="margin-bottom: 8px;">Verify your WealthWise account</h2>
        <p>Hi ${name},</p>
        <p>Your one-time password is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 16px 0;">${otpCode}</p>
        <p>This code expires on <strong>${expiryTime}</strong>.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `
  });

  return true;
}

async function sendWelcomeEmail(req, { email, name }) {
  const emailService = req.app.locals.emailService;

  if (!emailService?.isConfigured()) {
    return false;
  }

  await emailService.sendMail({
    to: email,
    subject: "Welcome to WealthWise",
    text: [
      `Hi ${name},`,
      "",
      "Your WealthWise account has been created successfully.",
      "You can now log in and start managing your finances."
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="margin-bottom: 8px;">Welcome to WealthWise</h2>
        <p>Hi ${name},</p>
        <p>Your account has been created successfully.</p>
        <p>You can now log in and start managing your finances.</p>
      </div>
    `
  });

  return true;
}

async function sendPasswordResetEmail(req, { email, name, otpCode, otpExpiresAt }) {
  const emailService = req.app.locals.emailService;

  if (!emailService?.isConfigured()) {
    return false;
  }

  const expiryTime = new Date(otpExpiresAt).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  await emailService.sendMail({
    to: email,
    subject: "Reset your WealthWise password",
    text: [
      `Hi ${name},`,
      "",
      `Your WealthWise password reset OTP is ${otpCode}.`,
      `This code expires on ${expiryTime}.`,
      "",
      "If you did not request this, you can ignore this email."
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <h2 style="margin-bottom: 8px;">Reset your WealthWise password</h2>
        <p>Hi ${name},</p>
        <p>Your password reset OTP is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 16px 0;">${otpCode}</p>
        <p>This code expires on <strong>${expiryTime}</strong>.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `
  });

  return true;
}

const requestPasswordReset = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();

  if (!email) {
    throw new AppError("Email is required.", 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.json({
      message: "If an account exists for this email, a password reset OTP has been sent."
    });
    return;
  }

  const otpCode = generateOtpCode();
  const otpExpiresAt = new Date(Date.now() + PASSWORD_RESET_EXPIRY_MINUTES * 60 * 1000);

  await PasswordResetToken.findOneAndUpdate(
    { email },
    {
      userId: user._id,
      email,
      otpHash: hashSessionToken(otpCode),
      otpExpiresAt,
      attemptsRemaining: 5,
      verified: false,
      verifiedAt: null
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true
    }
  );

  console.log(`Password reset OTP for ${email}: ${otpCode}`);

  try {
    await sendPasswordResetEmail(req, {
      email,
      name: user.name,
      otpCode,
      otpExpiresAt
    });
  } catch (error) {
    throw new AppError(`Failed to send password reset OTP email: ${error.message}`, 502);
  }

  res.json({
    message: "Password reset OTP sent. Enter the code and your new password.",
    email,
    otpExpiresAt,
    developmentOtp: getOtpPreview(otpCode)
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const otp = req.body.otp?.trim();
  const password = req.body.password;

  if (!email || !otp || !password) {
    throw new AppError("Email, OTP, and new password are required.", 400);
  }

  if (password.length < 6) {
    throw new AppError("Password must be at least 6 characters long.", 400);
  }

  const resetToken = await PasswordResetToken.findOne({ email });
  if (!resetToken) {
    throw new AppError("Password reset session not found. Request a new OTP.", 404);
  }

  if (resetToken.otpExpiresAt.getTime() < Date.now()) {
    await PasswordResetToken.deleteOne({ _id: resetToken._id });
    throw new AppError("OTP has expired. Request a new code.", 410);
  }

  if (resetToken.attemptsRemaining <= 0) {
    await PasswordResetToken.deleteOne({ _id: resetToken._id });
    throw new AppError("Too many invalid attempts. Request a new OTP.", 429);
  }

  if (resetToken.otpHash !== hashSessionToken(otp)) {
    resetToken.attemptsRemaining -= 1;
    await resetToken.save();
    throw new AppError("Invalid OTP. Please try again.", 400);
  }

  const user = await User.findById(resetToken.userId);
  if (!user) {
    await PasswordResetToken.deleteOne({ _id: resetToken._id });
    throw new AppError("User not found.", 404);
  }

  user.passwordHash = await hashPassword(password);
  user.sessionTokenHash = null;
  await user.save();
  await PasswordResetToken.deleteOne({ _id: resetToken._id });

  res.json({
    message: "Password reset successfully. Please log in with your new password."
  });
});

const requestSignupOtp = asyncHandler(async (req, res) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!name || !email || !password) {
    throw new AppError("Name, email, and password are required.", 400);
  }

  if (password.length < 6) {
    throw new AppError("Password must be at least 6 characters long.", 400);
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError("An account with this email already exists.", 409);
  }

  const passwordHash = await hashPassword(password);
  const otpCode = generateOtpCode();
  const otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await PendingSignup.findOneAndUpdate(
    { email },
    {
      name,
      email,
      passwordHash,
      otpCode,
      otpExpiresAt
    },
    {
      upsert: true,
      returnDocument: "after",
      setDefaultsOnInsert: true
    }
  );

  console.log(`Signup OTP for ${email}: ${otpCode}`);

  try {
    await sendSignupOtpEmail(req, {
      email,
      name,
      otpCode,
      otpExpiresAt
    });
  } catch (error) {
    throw new AppError(`Failed to send signup OTP email: ${error.message}`, 502);
  }

  res.status(200).json({
    message: "OTP sent successfully. Enter the code to finish creating your account.",
    email,
    otpExpiresAt,
    developmentOtp: getOtpPreview(otpCode)
  });
});

const verifySignupOtp = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const otp = req.body.otp?.trim();

  if (!email || !otp) {
    throw new AppError("Email and OTP are required.", 400);
  }

  const pendingSignup = await PendingSignup.findOne({ email });
  if (!pendingSignup) {
    throw new AppError("Signup session not found. Request a new OTP.", 404);
  }

  if (pendingSignup.otpExpiresAt.getTime() < Date.now()) {
    await PendingSignup.deleteOne({ _id: pendingSignup._id });
    throw new AppError("OTP has expired. Request a new code.", 410);
  }

  if (pendingSignup.otpCode !== otp) {
    throw new AppError("Invalid OTP. Please try again.", 400);
  }

  const user = await User.create({
    name: pendingSignup.name,
    email: pendingSignup.email,
    passwordHash: pendingSignup.passwordHash
  });
  ensureUserDefaults(user);
  const sessionToken = createSessionToken();
  user.sessionTokenHash = hashSessionToken(sessionToken);
  await user.save();

  await PendingSignup.deleteOne({ _id: pendingSignup._id });

  try {
    await sendWelcomeEmail(req, {
      email: user.email,
      name: user.name
    });
  } catch (error) {
    console.error("Welcome email failed", error);
  }

  res.status(201).json({
    message: "Account created successfully.",
    token: sessionToken,
    state: {
      ...buildStatePayload(user),
      transactions: []
    }
  });
});

const resendSignupOtp = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();

  if (!email) {
    throw new AppError("Email is required.", 400);
  }

  const pendingSignup = await PendingSignup.findOne({ email });
  if (!pendingSignup) {
    throw new AppError("Signup session not found. Start again.", 404);
  }

  const otpCode = generateOtpCode();
  pendingSignup.otpCode = otpCode;
  pendingSignup.otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
  await pendingSignup.save();

  console.log(`Signup OTP resend for ${email}: ${otpCode}`);

  try {
    await sendSignupOtpEmail(req, {
      email,
      name: pendingSignup.name,
      otpCode,
      otpExpiresAt: pendingSignup.otpExpiresAt
    });
  } catch (error) {
    throw new AppError(`Failed to resend signup OTP email: ${error.message}`, 502);
  }

  res.json({
    message: "A new OTP has been generated.",
    email,
    otpExpiresAt: pendingSignup.otpExpiresAt,
    developmentOtp: getOtpPreview(otpCode)
  });
});

const login = asyncHandler(async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }
  ensureUserDefaults(user);

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    throw new AppError("Invalid email or password.", 401);
  }

  const transactions = await Transaction.find({ userId: user._id }).sort({ date: -1, createdAt: -1 });
  const sessionToken = createSessionToken();
  user.sessionTokenHash = hashSessionToken(sessionToken);
  await user.save();

  res.json({
    message: "Login successful.",
    token: sessionToken,
    state: {
      ...buildStatePayload(user),
      transactions: transactions.map(mapTransaction)
    }
  });
});

const getSession = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ userId: req.user._id }).sort({ date: -1, createdAt: -1 });

  res.json({
    state: {
      ...buildStatePayload(req.user),
      transactions: transactions.map(mapTransaction)
    }
  });
});

const logout = asyncHandler(async (req, res) => {
  req.user.sessionTokenHash = null;
  await req.user.save();

  res.json({
    message: "Logged out successfully."
  });
});

async function requireUser(req, res, next) {
  try {
    const authorization = req.header("authorization");
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";

    if (!token) {
      throw new AppError("Missing user session.", 401);
    }

    const user = await User.findOne({
      sessionTokenHash: hashSessionToken(token)
    });
    if (!user) {
      throw new AppError("User not found.", 401);
    }

    ensureUserDefaults(user);
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSession,
  login,
  logout,
  requestPasswordReset,
  mapTransaction,
  requestSignupOtp,
  requireUser,
  resetPassword,
  resendSignupOtp,
  verifySignupOtp
};
