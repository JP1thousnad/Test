import { Building2, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CompanyHeaderProps {
  ticker: string;
  companyName: string;
  sector?: string;
  industry?: string;
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  marketCap?: number;
  onRefresh?: () => void;
  onExport?: () => void;
  isLoading?: boolean;
}

export function CompanyHeader({
  ticker,
  companyName,
  sector,
  industry,
  currentPrice,
  priceChange,
  priceChangePercent,
  marketCap,
  onRefresh,
  onExport,
  isLoading,
}: CompanyHeaderProps) {
  const formatMarketCap = (value?: number) => {
    if (!value) return "-";
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  const priceChangePositive = (priceChange ?? 0) >= 0;

  return (
    <div
      className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 bg-card rounded-lg border border-card-border"
      data-testid="company-header"
    >
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
          <Building2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold">{companyName}</h1>
            <Badge variant="outline" className="font-mono text-base">
              {ticker}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
            {sector && <span>{sector}</span>}
            {sector && industry && <span>•</span>}
            {industry && <span>{industry}</span>}
            {marketCap && (
              <>
                <span>•</span>
                <span>Market Cap: {formatMarketCap(marketCap)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        {currentPrice !== undefined && (
          <div className="text-right">
            <div className="text-2xl font-semibold font-mono">
              ${currentPrice.toFixed(2)}
            </div>
            {priceChange !== undefined && priceChangePercent !== undefined && (
              <div
                className={`text-sm font-mono ${
                  priceChangePositive
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              >
                {priceChangePositive ? "+" : ""}
                {priceChange.toFixed(2)} ({priceChangePositive ? "+" : ""}
                {priceChangePercent.toFixed(2)}%)
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isLoading}
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onExport}
            data-testid="button-export"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
