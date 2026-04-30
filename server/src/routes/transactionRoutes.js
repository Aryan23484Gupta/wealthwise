const express = require("express");

const { requireUser } = require("../controllers/authController");
const {
  createTransaction,
  deleteTransaction,
  getTransactions,
  resetTransactions,
  updateTransaction
} = require("../controllers/transactionController");

const router = express.Router();

router.use(requireUser);
router.get("/", getTransactions);
router.post("/", createTransaction);
router.delete("/", resetTransactions);
router.put("/:transactionId", updateTransaction);
router.delete("/:transactionId", deleteTransaction);

module.exports = router;
