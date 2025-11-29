import { CheckCircle2, AlertTriangle, TrendingUp, DollarSign, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Highlight {
  type: "beat" | "miss" | "growth" | "margin" | "info";
  text: string;
}

interface KeyHighlightsProps {
  highlights: Highlight[];
}

export function KeyHighlights({ highlights }: KeyHighlightsProps) {
  const getIcon = (type: Highlight["type"]) => {
    switch (type) {
      case "beat":
        return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />;
      case "miss":
        return <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0" />;
      case "growth":
        return <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />;
      case "margin":
        return <DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />;
      default:
        return <BarChart3 className="h-4 w-4 text-muted-foreground flex-shrink-0" />;
    }
  };

  return (
    <Card data-testid="key-highlights">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Key Highlights</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {highlights.map((highlight, index) => (
            <li
              key={index}
              className="flex items-start gap-2 text-sm"
              data-testid={`highlight-${index}`}
            >
              {getIcon(highlight.type)}
              <span>{highlight.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
