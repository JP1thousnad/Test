import { MetricCard } from "../MetricCard";

export default function MetricCardExample() {
  return (
    <div className="grid grid-cols-2 gap-4 p-4">
      <MetricCard
        title="Revenue"
        value="94.93B"
        prefix="$"
        change={8.1}
        changeLabel="YoY"
        trend="up"
      />
      <MetricCard
        title="EPS"
        value="1.53"
        prefix="$"
        change={4.2}
        changeLabel="vs Est"
        trend="up"
        beat={true}
      />
    </div>
  );
}
