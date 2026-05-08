import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";
import { formatCurrency, formatDisplayDate } from "../utils/finance";

export default function GoalCard({ goal, onContribute, onDelete }) {
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setError("");
    setIsSaving(true);

    try {
      await onContribute(goal.id, formData.get("amount"));
      event.currentTarget.reset();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="goal-card">
      <div className="goal-head">
        <div>
          <h4>{goal.title}</h4>
          <p>Target date: {formatDisplayDate(goal.deadline)}</p>
        </div>
        <div className="table-actions">
          <strong>{goal.percentage}%</strong>
          {onDelete ? (
            <button type="button" onClick={() => onDelete(goal.id)} aria-label={`Delete ${goal.title}`}>
              <FiTrash2 />
            </button>
          ) : null}
        </div>
      </div>
      <div className="progress-track">
        <div className="progress-fill goal-fill" style={{ width: `${goal.percentage}%` }} />
      </div>
      <div className="goal-meta">
        <span>{formatCurrency(goal.saved)} saved</span>
        <span>{formatCurrency(goal.target)} goal</span>
      </div>
      <form className="inline-form" onSubmit={handleSubmit}>
        <input type="number" name="amount" min="1" placeholder="Add funds" disabled={isSaving} required />
        <button type="submit" className="ghost-button" disabled={isSaving}>
          {isSaving ? "Saving..." : "Contribute"}
        </button>
      </form>
      {error ? <p className="auth-error">{error}</p> : null}
    </div>
  );
}
