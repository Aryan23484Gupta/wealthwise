import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export function CategoryPieChart({ data }) {
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={2} />
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function IncomeExpenseChart({ data }) {
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="income" fill="#1d4ed8" radius={[10, 10, 0, 0]} />
          <Bar dataKey="expenses" fill="#f97316" radius={[10, 10, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendLineChart({ data }) {
  return (
    <div className="chart-box">
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="income" stroke="#0f766e" strokeWidth={3} />
          <Line type="monotone" dataKey="expenses" stroke="#dc2626" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
