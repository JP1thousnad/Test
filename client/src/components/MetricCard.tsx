import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  trend?: "up" | "down" | "neutral";
  beat?: boolean | null;
  prefix?: string;
  suffix?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  trend,
  beat,
  prefix = "",
  suffix = "",
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (trend === "up") return <TrendingUp className="h-4 w-4" />;
    if (trend === "down") return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getTrendColor = () => {
    if (trend === "up") return "text-emerald-600 dark:text-emerald-400";
    if (trend === "down") return "text-red-600 dark:text-red-400";
    return "text-muted-foreground";
  };

  return (
    <Card data-testid={`metric-card-${title.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {beat !== null && beat !== undefined && (
          <Badge
            variant={beat ? "default" : "destructive"}
            className={beat ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          >
            {beat ? "Beat" : "Miss"}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold font-mono">
          {prefix}{value}{suffix}
        </div>
        {(change !== undefined || changeLabel) && (
          <div className={`flex items-center gap-1 mt-1 text-sm ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="font-mono">
              {change !== undefined && `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`}
            </span>
            {changeLabel && (
              <span className="text-muted-foreground ml-1">{changeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
