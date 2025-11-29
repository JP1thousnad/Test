import { EarningsTable } from "../EarningsTable";

export default function EarningsTableExample() {
  const data = [
    { period: "Q4 2024", reportDate: "Jan 30, 2025", revenue: 94.9e9, eps: 1.53, epsEstimate: 1.47, beat: true, surprise: 4.1 },
    { period: "Q3 2024", reportDate: "Oct 31, 2024", revenue: 91.8e9, eps: 1.42, epsEstimate: 1.40, beat: true, surprise: 1.4 },
    { period: "Q2 2024", reportDate: "Aug 1, 2024", revenue: 89.2e9, eps: 1.38, epsEstimate: 1.41, beat: false, surprise: -2.1 },
    { period: "Q1 2024", reportDate: "May 2, 2024", revenue: 85.5e9, eps: 1.29, epsEstimate: 1.25, beat: true, surprise: 3.2 },
  ];

  return (
    <div className="p-4">
      <EarningsTable data={data} />
    </div>
  );
}
