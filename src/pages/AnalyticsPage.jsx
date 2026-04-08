import SectionCard from "../components/SectionCard";
import { CategoryPieChart, IncomeExpenseChart, TrendLineChart } from "../components/Charts";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency } from "../utils/finance";

export default function AnalyticsPage() {
  const { categoryData, monthlyTrend, totals, budgetUsage } = useFinance();

  return (
    <div className="analytics-layout">
      <SectionCard title="Category distribution" subtitle="Expense share by category.">
        <CategoryPieChart data={categoryData} />
      </SectionCard>

      <SectionCard title="Monthly comparison" subtitle="Income and expense bars by month.">
        <IncomeExpenseChart data={monthlyTrend} />
      </SectionCard>

      <SectionCard title="Trend lines" subtitle="Visualize longer-term movement across months.">
        <TrendLineChart data={monthlyTrend} />
      </SectionCard>

      <SectionCard title="Analytics highlights" subtitle="Fast stats for decision-making.">
        <div className="highlight-grid">
          <div className="highlight-card">
            <p>Net balance</p>
            <h3>{formatCurrency(totals.balance)}</h3>
          </div>
          <div className="highlight-card">
            <p>Budget used</p>
            <h3>{budgetUsage.percentage}%</h3>
          </div>
          <div className="highlight-card">
            <p>Current month spend</p>
            <h3>{formatCurrency(budgetUsage.spent)}</h3>
          </div>
          <div className="highlight-card">
            <p>Categories tracked</p>
            <h3>{categoryData.length}</h3>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
