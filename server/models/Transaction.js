const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: Date,
      required: true
    },
    note: {
      type: String,
      default: "",
      trim: true
    }
  },
  {
    timestamps: true
  }
);

transactionSchema.index({ userId: 1, date: -1, createdAt: -1 });

module.exports = mongoose.model("Transaction", transactionSchema);
