import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SentimentGaugeProps {
  score: number;
  label: "Bullish" | "Bearish" | "Neutral";
  positive: number;
  negative: number;
  neutral: number;
}

export function SentimentGauge({
  score,
  label,
  positive,
  negative,
  neutral,
}: SentimentGaugeProps) {
  const normalizedScore = ((score + 1) / 2) * 100;
  
  const getLabelColor = () => {
    if (label === "Bullish") return "bg-emerald-600 hover:bg-emerald-700";
    if (label === "Bearish") return "bg-red-600 hover:bg-red-700";
    return "bg-amber-600 hover:bg-amber-700";
  };

  return (
    <Card data-testid="sentiment-gauge">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Sentiment Analysis</CardTitle>
        <Badge className={getLabelColor()}>{label}</Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative h-4 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-500 via-amber-500 to-emerald-500 rounded-full"
              style={{ width: "100%" }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-foreground rounded-full border-2 border-background shadow-md transition-all"
              style={{ left: `calc(${normalizedScore}% - 6px)` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Bearish</span>
            <span>Neutral</span>
            <span>Bullish</span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className="text-center">
              <div className="text-lg font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                {(positive * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">Positive</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold font-mono text-muted-foreground">
                {(neutral * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">Neutral</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold font-mono text-red-600 dark:text-red-400">
                {(negative * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">Negative</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
