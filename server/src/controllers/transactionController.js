const mongoose = require("mongoose");

const Transaction = require("../../models/Transaction");
const asyncHandler = require("../utils/asyncHandler");
const { AppError } = require("../utils/errors");
const { mapTransaction } = require("./authController");

function parseTransactionPayload(payload, { partial = false } = {}) {
  const title = payload.title?.trim();
  const category = payload.category?.trim();
  const note = payload.note?.trim() || "";
  const amount = payload.amount !== undefined ? Number(payload.amount) : undefined;
  const type = payload.type;
  const date = payload.date ? new Date(payload.date) : undefined;

  if (!partial || payload.title !== undefined) {
    if (!title) {
      throw new AppError("Title is required.", 400);
    }
  }

  if (!partial || payload.amount !== undefined) {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new AppError("Amount must be a valid non-negative number.", 400);
    }
  }

  if (!partial || payload.type !== undefined) {
    if (!["income", "expense"].includes(type)) {
      throw new AppError("Type must be either `income` or `expense`.", 400);
    }
  }

  if (!partial || payload.category !== undefined) {
    if (!category) {
      throw new AppError("Category is required.", 400);
    }
  }

  if (!partial || payload.date !== undefined) {
    if (!date || Number.isNaN(date.getTime())) {
      throw new AppError("Date must be a valid date.", 400);
    }
  }

  return {
    ...(payload.title !== undefined || !partial ? { title } : {}),
    ...(payload.amount !== undefined || !partial ? { amount } : {}),
    ...(payload.type !== undefined || !partial ? { type } : {}),
    ...(payload.category !== undefined || !partial ? { category } : {}),
    ...(payload.date !== undefined || !partial ? { date } : {}),
    ...(payload.note !== undefined || !partial ? { note } : {})
  };
}

const getTransactions = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ userId: req.user._id }).sort({ date: -1, createdAt: -1 });
  res.json({ transactions: transactions.map(mapTransaction) });
});

const createTransaction = asyncHandler(async (req, res) => {
  const { title, amount, type, category, date, note } = parseTransactionPayload(req.body);

  const transaction = await Transaction.create({
    userId: req.user._id,
    title,
    amount,
    type,
    category,
    date,
    note
  });

  res.status(201).json({
    message: "Transaction added successfully.",
    transaction: mapTransaction(transaction)
  });
});

const updateTransaction = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;

  if (!transactionId || !mongoose.Types.ObjectId.isValid(transactionId)) {
    throw new AppError("Invalid transaction id.", 400);
  }

  const updates = parseTransactionPayload(req.body, { partial: true });

  const transaction = await Transaction.findOneAndUpdate(
    { _id: transactionId, userId: req.user._id },
    updates,
    { new: true, runValidators: true }
  );

  if (!transaction) {
    throw new AppError("Transaction not found.", 404);
  }

  res.json({
    message: "Transaction updated successfully.",
    transaction: mapTransaction(transaction)
  });
});

const deleteTransaction = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;

  if (!transactionId || !mongoose.Types.ObjectId.isValid(transactionId)) {
    throw new AppError("Invalid transaction id.", 400);
  }

  const transaction = await Transaction.findOneAndDelete({ _id: transactionId, userId: req.user._id });

  if (!transaction) {
    throw new AppError("Transaction not found.", 404);
  }

  res.json({ message: "Transaction deleted successfully." });
});

const resetTransactions = asyncHandler(async (req, res) => {
  const result = await Transaction.deleteMany({ userId: req.user._id });

  res.json({
    message: "All transactions reset successfully.",
    deletedCount: result.deletedCount
  });
});

module.exports = {
  createTransaction,
  deleteTransaction,
  getTransactions,
  resetTransactions,
  updateTransaction
};
