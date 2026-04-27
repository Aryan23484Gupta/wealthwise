import { useEffect, useState } from "react";
import { categories } from "../data/mockData";

const initialState = {
  title: "",
  amount: "",
  type: "expense",
  category: "Food",
  date: new Date().toISOString().slice(0, 10),
  note: ""
};

export default function TransactionForm({ onSubmit, editing, onCancel }) {
  const [form, setForm] = useState(initialState);

  useEffect(() => {
    setForm(editing || initialState);
  }, [editing]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit({
      ...form,
      amount: Number(form.amount)
    });
    setForm(initialState);
  }

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Title
          <input name="title" value={form.title} onChange={handleChange} placeholder="Groceries" required />
        </label>
        <label>
          Amount
          <input name="amount" type="number"  min="0" value={form.amount} onChange={handleChange} placeholder="1000" required />
        </label>
        <label>
          Type
          <select name="type" value={form.type} onChange={handleChange}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </label>
        <label>
          Category
          <select name="category" value={form.category} onChange={handleChange}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date
          <input name="date" type="date" value={form.date} onChange={handleChange} required />
        </label>
        <label>
          Note
          <input name="note" value={form.note} onChange={handleChange} placeholder="Optional note" />
        </label>
      </div>

      <div className="form-actions">
        {editing && (
          <button type="button" className="ghost-button" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="primary-button">
          {editing ? "Save changes" : "Add transaction"}
        </button>
      </div>
    </form>
  );
}
