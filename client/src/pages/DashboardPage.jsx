import { FiArrowDownRight, FiArrowUpRight, FiCreditCard, FiDollarSign } from "react-icons/fi";
import BudgetCard from "../components/BudgetCard";
import GoalCard from "../components/GoalCard";
import InsightCard from "../components/InsightCard";
import SectionCard from "../components/SectionCard";
import SummaryCard from "../components/SummaryCard";
import TransactionTable from "../components/TransactionTable";
import { CategoryPieChart, IncomeExpenseChart } from "../components/Charts";
import { useFinance } from "../context/FinanceContext";

export default function DashboardPage() {
  const {
    totals,
    recentTransactions,
    categoryData,
    monthlyTrend,
    insights,
    budget,
    budgetUsage,
    setBudget,
    savingsProgress,
    contributeToGoal
  } = useFinance();

  return (
    <div className="page-grid">
      <div className="summary-grid">
        <SummaryCard
          title="Total Balance"
          value={totals.balance}
          icon={FiDollarSign}
          accent="linear-gradient(135deg, #0f766e, #34d399)"
          trend={{ label: "Healthy cash position", positive: true }}
        />
        <SummaryCard
          title="Total Income"
          value={totals.income}
          icon={FiArrowUpRight}
          accent="linear-gradient(135deg, #1d4ed8, #60a5fa)"
          trend={{ label: "Stable income inflow", positive: true }}
        />
        <SummaryCard
          title="Total Expenses"
          value={totals.expenses}
          icon={FiArrowDownRight}
          accent="linear-gradient(135deg, #ea580c, #fdba74)"
          trend={{ label: "Watch discretionary spend", positive: false }}
        />
        <SummaryCard
          title="Budget Status"
          value={budget.monthlyBudget}
          icon={FiCreditCard}
          accent="linear-gradient(135deg, #7c3aed, #c084fc)"
          trend={{ label: `${budgetUsage.percentage}% used`, positive: budgetUsage.percentage < 100 }}
        />
      </div>

      <div className="dashboard-main">
        <SectionCard title="Expense breakdown" subtitle="See where the money is going this month.">
          <CategoryPieChart data={categoryData} />
        </SectionCard>
        <SectionCard title="Income vs expenses" subtitle="A quick monthly comparison to track cash flow.">
          <IncomeExpenseChart data={monthlyTrend} />
        </SectionCard>
        <SectionCard title="Recent transactions" subtitle="Your latest 8 entries across income and expenses.">
          <TransactionTable transactions={recentTransactions} compact />
        </SectionCard>
      </div>

      <div className="dashboard-side">
        <BudgetCard usage={budgetUsage} monthlyBudget={budget.monthlyBudget} onSave={setBudget} />

        <SectionCard title="AI insights" subtitle="Smart nudges generated from your spending patterns.">
          <div className="stack-list">
            {insights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Savings goals" subtitle="Keep long-term plans visible and on track.">
          <div className="stack-list">
            {savingsProgress.map((goal) => (
              <GoalCard key={goal.id} goal={goal} onContribute={contributeToGoal} />
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
