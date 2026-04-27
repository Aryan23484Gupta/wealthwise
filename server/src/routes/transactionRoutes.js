const express = require("express");

const { requireUser } = require("../controllers/authController");
const {
  createTransaction,
  deleteTransaction,
  getTransactions,
  updateTransaction
} = require("../controllers/transactionController");

const router = express.Router();

router.use(requireUser);
router.get("/", getTransactions);
router.post("/", createTransaction);
router.put("/:transactionId", updateTransaction);
router.delete("/:transactionId", deleteTransaction);

module.exports = router;
