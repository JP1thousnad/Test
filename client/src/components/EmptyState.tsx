import { Search, BarChart3, TrendingUp } from "lucide-react";

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = "Search for a Stock",
  description = "Enter a ticker symbol above to analyze earnings, financial metrics, and sentiment.",
}: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
      data-testid="empty-state"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
          <BarChart3 className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
          <TrendingUp className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
          <Search className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-md">{description}</p>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border border-card-border">
          <span className="font-mono text-primary">AAPL</span>
          <span className="text-muted-foreground">Apple Inc.</span>
        </div>
        <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border border-card-border">
          <span className="font-mono text-primary">MSFT</span>
          <span className="text-muted-foreground">Microsoft</span>
        </div>
        <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-card border border-card-border">
          <span className="font-mono text-primary">NVDA</span>
          <span className="text-muted-foreground">NVIDIA</span>
        </div>
      </div>
    </div>
  );
}
