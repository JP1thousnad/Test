import { GuidanceCard } from "../GuidanceCard";

export default function GuidanceCardExample() {
  return (
    <div className="p-4 max-w-md">
      <GuidanceCard
        quarter="Q1 2025"
        guidance={[
          { label: "Revenue", low: 96, high: 100, unit: "B", previous: 94.9 },
          { label: "EPS", low: 1.55, high: 1.62, unit: "$", previous: 1.53 },
          { label: "Gross Margin", low: 45.5, high: 47.0, unit: "%" },
        ]}
      />
    </div>
  );
}
