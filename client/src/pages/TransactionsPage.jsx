import { useMemo, useState } from "react";
import SectionCard from "../components/SectionCard";
import TransactionForm from "../components/TransactionForm";
import TransactionTable from "../components/TransactionTable";
import { categories } from "../data/mockData";
import { useFinance } from "../context/FinanceContext";

const defaultFilters = {
  category: "All",
  type: "All",
  month: "",
  minAmount: ""
};

export default function TransactionsPage() {
  const { addTransaction, updateTransaction, deleteTransaction, filteredTransactions } = useFinance();
  const [filters, setFilters] = useState(defaultFilters);
  const [editing, setEditing] = useState(null);
  const [submitError, setSubmitError] = useState("");

  const results = useMemo(() => filteredTransactions(filters), [filteredTransactions, filters]);

  function handleChange(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(transaction) {
    setSubmitError("");

    if (editing) {
      try {
        await updateTransaction(editing.id, transaction);
        setEditing(null);
      } catch (error) {
        setSubmitError(error.message);
      }
      return;
    }

    try {
      await addTransaction(transaction);
    } catch (error) {
      setSubmitError(error.message);
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

  return (
    <div className="two-column">
      <SectionCard title={editing ? "Edit transaction" : "Add transaction"} subtitle="Create, update, and manage every cash movement.">
        <TransactionForm onSubmit={handleSubmit} editing={editing} onCancel={() => setEditing(null)} />
        {submitError ? <p className="auth-error">{submitError}</p> : null}
      </SectionCard>

      <SectionCard title="All transactions" subtitle="Filter by date, category, type, or minimum amount.">
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
          <input name="month" type="month" value={filters.month} onChange={handleChange} />
          <input name="minAmount" type="number" min="0" placeholder="Min amount" value={filters.minAmount} onChange={handleChange} />
        </div>
        <TransactionTable transactions={results} onEdit={setEditing} onDelete={handleDelete} />
      </SectionCard>
    </div>
  );
}
