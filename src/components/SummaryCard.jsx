import { formatCurrency } from "../utils/finance";

export default function SummaryCard({ title, value, icon: Icon, accent, trend }) {
  return (
    <div className="summary-card">
      <div className="summary-icon" style={{ background: accent }}>
        <Icon />
      </div>
      <div>
        <p>{title}</p>
        <h3>{formatCurrency(value)}</h3>
        <span className={`trend ${trend.positive ? "positive" : "negative"}`}>{trend.label}</span>
      </div>
    </div>
  );
}
