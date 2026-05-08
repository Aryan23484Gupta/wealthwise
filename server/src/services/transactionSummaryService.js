const Transaction = require("../../models/Transaction");

async function getNetBalance(userId, { excludeTransactionId } = {}) {
  const match = { userId };

  if (excludeTransactionId) {
    match._id = { $ne: excludeTransactionId };
  }

  const [totals = { income: 0, expenses: 0 }] = await Transaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        income: {
          $sum: {
            $cond: [{ $eq: ["$type", "income"] }, "$amount", 0]
          }
        },
        expenses: {
          $sum: {
            $cond: [{ $eq: ["$type", "expense"] }, "$amount", 0]
          }
        }
      }
    }
  ]);

  return Number(totals.income || 0) - Number(totals.expenses || 0);
}

module.exports = {
  getNetBalance
};
