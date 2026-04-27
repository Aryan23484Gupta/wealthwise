import { formatCurrency } from "../utils/finance";

export default function GoalCard({ goal, onContribute }) {
  function handleSubmit(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    onContribute(goal.id, formData.get("amount"));
    event.currentTarget.reset();
  }

  return (
    <div className="goal-card">
      <div className="goal-head">
        <div>
          <h4>{goal.title}</h4>
          <p>Target date: {goal.deadline}</p>
        </div>
        <strong>{goal.percentage}%</strong>
      </div>
      <div className="progress-track">
        <div className="progress-fill goal-fill" style={{ width: `${goal.percentage}%` }} />
      </div>
      <div className="goal-meta">
        <span>{formatCurrency(goal.saved)} saved</span>
        <span>{formatCurrency(goal.target)} goal</span>
      </div>
      <form className="inline-form" onSubmit={handleSubmit}>
        <input type="number" name="amount" min="1" placeholder="Add funds" required />
        <button type="submit" className="ghost-button">
          Contribute
        </button>
      </form>
    </div>
  );
}
