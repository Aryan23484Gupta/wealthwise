import { useMemo, useState } from "react";
import SectionCard from "../components/SectionCard";
import TransactionForm from "../components/TransactionForm";
import TransactionTable from "../components/TransactionTable";
import { categories } from "../data/mockData";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency, getYearOptions, monthOptions } from "../utils/finance";

const defaultFilters = {
  category: "All",
  type: "All",
  minAmount: ""
};

export default function TransactionsPage() {
  const {
    addTransaction,
    deleteTransaction,
    filteredTransactions,
    reportingPeriod,
    resetAllTransactions,
    setReportingPeriod,
    totals,
    transactions,
    updateTransaction
  } = useFinance();
  const [filters, setFilters] = useState(defaultFilters);
  const [editing, setEditing] = useState(null);
  const [submitError, setSubmitError] = useState("");

  const yearOptions = useMemo(
    () => getYearOptions(transactions, reportingPeriod.year),
    [reportingPeriod.year, transactions]
  );
  const results = useMemo(
    () => filteredTransactions({ ...filters, ...reportingPeriod }),
    [filteredTransactions, filters, reportingPeriod]
  );

  function handleChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  function handlePeriodChange(event) {
    const { name, value } = event.target;
    setReportingPeriod({ ...reportingPeriod, [name]: value });
  }

  function getBalanceBeforeTransaction(transactionId) {
    const transaction = transactions.find((item) => item.id === transactionId);

    if (!transaction) {
      return totals.balance;
    }

    return transaction.type === "income"
      ? totals.balance - Number(transaction.amount || 0)
      : totals.balance + Number(transaction.amount || 0);
  }

  function getInsufficientBalanceMessage(availableBalance) {
    return `You only have ${formatCurrency(
      availableBalance
    )} available. Please enter an expense amount less than or equal to your net balance.`;
  }

  function validateExpenseBalance(transaction, transactionId) {
    if (transaction.type !== "expense") {
      return true;
    }

    const availableBalance = transactionId ? getBalanceBeforeTransaction(transactionId) : totals.balance;

    if (Number(transaction.amount || 0) <= availableBalance) {
      return true;
    }

    setSubmitError(getInsufficientBalanceMessage(availableBalance));
    return false;
  }

  async function handleSubmit(transaction) {
    setSubmitError("");

    if (editing) {
      if (!validateExpenseBalance(transaction, editing.id)) {
        return false;
      }

      try {
        await updateTransaction(editing.id, transaction);
        setEditing(null);
        return true;
      } catch (error) {
        setSubmitError(error.message);
        return false;
      }
    }

    if (!validateExpenseBalance(transaction)) {
      return false;
    }

    try {
      await addTransaction(transaction);
      return true;
    } catch (error) {
      setSubmitError(error.message);
      return false;
    }
  }

  async function handleDelete(transactionId) {
    setSubmitError("");

    try {
      await deleteTransaction(transactionId);
    } catch (error) {
      setSubmitError(error.message);
    }
  }

  async function handleResetAll() {
    setSubmitError("");

    if (!window.confirm("Reset all transactions? This cannot be undone.")) {
      return;
    }

    try {
      await resetAllTransactions();
      setEditing(null);
    } catch (error) {
      setSubmitError(error.message);
    }
  }

  return (
    <div className="two-column">
      <SectionCard title={editing ? "Edit transaction" : "Add transaction"} subtitle="Create, update, and manage every cash movement.">
        <TransactionForm onSubmit={handleSubmit} editing={editing} onCancel={() => setEditing(null)} />
        {submitError ? <p className="auth-error">{submitError}</p> : null}
      </SectionCard>

      <SectionCard
        title="All transactions"
        subtitle="Filter by date, category, type, or minimum amount."
        action={
          <button type="button" className="danger-button reset-button" onClick={handleResetAll} disabled={!transactions.length}>
            Reset all
          </button>
        }
      >
        <div className="filter-row">
          <select name="category" value={filters.category} onChange={handleChange}>
            <option>All</option>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
          <select name="type" value={filters.type} onChange={handleChange}>
            <option>All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select name="month" value={reportingPeriod.month} onChange={handlePeriodChange}>
            {monthOptions.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          <select name="year" value={reportingPeriod.year} onChange={handlePeriodChange}>
            {yearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <input name="minAmount" type="number" min="0" placeholder="Min amount" value={filters.minAmount} onChange={handleChange} />
        </div>
        <TransactionTable transactions={results} onEdit={setEditing} onDelete={handleDelete} />
      </SectionCard>
    </div>
  );
}
