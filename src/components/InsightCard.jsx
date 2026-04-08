export default function InsightCard({ insight }) {
  return (
    <div className={`insight-card ${insight.tone}`}>
      <p>{insight.title}</p>
      <h4>{insight.description}</h4>
    </div>
  );
}
