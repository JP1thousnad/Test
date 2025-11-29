import { Target, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GuidanceRange {
  label: string;
  low: number;
  high: number;
  unit: string;
  previous?: number;
}

interface GuidanceCardProps {
  guidance: GuidanceRange[];
  quarter?: string;
}

export function GuidanceCard({ guidance, quarter = "Next Quarter" }: GuidanceCardProps) {
  const formatValue = (value: number, unit: string) => {
    if (unit === "B") return `$${value.toFixed(1)}B`;
    if (unit === "M") return `$${value.toFixed(0)}M`;
    if (unit === "$") return `$${value.toFixed(2)}`;
    if (unit === "%") return `${value.toFixed(1)}%`;
    return value.toFixed(2);
  };

  return (
    <Card data-testid="guidance-card">
      <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-3">
        <Target className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-base">Guidance - {quarter}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {guidance.map((item, idx) => (
            <div key={idx} className="space-y-1" data-testid={`guidance-${idx}`}>
              <div className="text-sm text-muted-foreground">{item.label}</div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold font-mono">
                  {formatValue(item.low, item.unit)} - {formatValue(item.high, item.unit)}
                </span>
                {item.previous !== undefined && (
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <ArrowRight className="h-3 w-3" />
                    vs {formatValue(item.previous, item.unit)} prior
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
