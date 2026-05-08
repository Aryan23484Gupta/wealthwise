import SectionCard from "../components/SectionCard";
import { CategoryPieChart, IncomeExpenseChart, TrendLineChart } from "../components/Charts";
import { useFinance } from "../context/FinanceContext";
import { formatCurrency, getYearOptions, monthOptions } from "../utils/finance";

export default function AnalyticsPage() {
  const {
    reportingCategoryData,
    reportingMonthlyTrend,
    reportingTotals,
    reportingBudgetUsage,
    reportingPeriod,
    setReportingPeriod,
    transactions
  } = useFinance();
  const yearOptions = getYearOptions(transactions, reportingPeriod.year);

  function handlePeriodChange(event) {
    const { name, value } = event.target;
    setReportingPeriod({ ...reportingPeriod, [name]: value });
  }

  const periodSelector = (
    <div className="filter-row">
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
    </div>
  );

  return (
    <div className="analytics-layout">
      <SectionCard title="Category distribution" subtitle="Expense share by category.">
        <CategoryPieChart data={reportingCategoryData} />
      </SectionCard>

      <SectionCard title="Monthly comparison" subtitle="Income and expense bars by month.">
        <IncomeExpenseChart data={reportingMonthlyTrend} />
      </SectionCard>

      <SectionCard title="Trend lines" subtitle="Visualize longer-term movement across months.">
        <TrendLineChart data={reportingMonthlyTrend} />
      </SectionCard>

      <SectionCard title="Analytics highlights" subtitle="Fast stats for decision-making." action={periodSelector}>
        <div className="highlight-grid">
          <div className="highlight-card">
            <p>Net balance</p>
            <h3>{formatCurrency(reportingTotals.balance)}</h3>
          </div>
          <div className="highlight-card">
            <p>Budget used</p>
            <h3>{reportingBudgetUsage.percentage}%</h3>
          </div>
          <div className="highlight-card">
            <p>Current month spend</p>
            <h3>{formatCurrency(reportingBudgetUsage.spent)}</h3>
          </div>
          <div className="highlight-card">
            <p>Categories tracked</p>
            <h3>{reportingCategoryData.length}</h3>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
