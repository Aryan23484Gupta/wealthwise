import { formatCurrency } from "../utils/finance";

export default function BudgetCard({ usage, monthlyBudget, onSave }) {
  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextBudget = Number(formData.get("budget"));
    if (!Number.isFinite(nextBudget) || nextBudget < 0) {
      return;
    }
    onSave(nextBudget);
  }

  return (
    <div className="budget-card">
      <div className="section-head">
        <div>
          <h3>Monthly budget</h3>
          <p>Track your spending ceiling in real time.</p>
        </div>
      </div>
      <div className="budget-overview">
        <div>
          <strong>{formatCurrency(usage.spent)}</strong>
          <span> Spent this month</span>
        </div>
        <div>
          <strong>{formatCurrency(monthlyBudget)}</strong>
          <span> Budget target</span>
        </div>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${Math.min(usage.percentage, 100)}%` }} />
      </div>
      <p className={`budget-status ${usage.percentage > 100 ? "danger" : ""}`}>
        {usage.percentage}% used. {formatCurrency(usage.remaining)} remaining.
      </p>
      <form className="inline-form" onSubmit={handleSubmit}>
        <input type="number" name="budget" defaultValue={monthlyBudget} min="0" />
        <button type="submit" className="primary-button">
          Update
        </button>
      </form>
    </div>
  );
}
