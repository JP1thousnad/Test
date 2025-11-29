import { RevenueChart } from "../RevenueChart";

export default function RevenueChartExample() {
  const data = [
    { period: "Q1 2024", revenue: 85.5e9, netIncome: 21.5e9 },
    { period: "Q2 2024", revenue: 89.2e9, netIncome: 23.1e9 },
    { period: "Q3 2024", revenue: 91.8e9, netIncome: 24.0e9 },
    { period: "Q4 2024", revenue: 94.9e9, netIncome: 24.2e9 },
  ];

  return (
    <div className="p-4">
      <RevenueChart data={data} />
    </div>
  );
}
