import { MarginChart } from "../MarginChart";

export default function MarginChartExample() {
  return (
    <div className="p-4">
      <MarginChart
        grossMargin={46.3}
        operatingMargin={30.2}
        netMargin={25.3}
      />
    </div>
  );
}
