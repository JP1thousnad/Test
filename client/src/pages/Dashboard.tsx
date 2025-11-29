import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TickerSearch } from "@/components/TickerSearch";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CompanyHeader } from "@/components/CompanyHeader";
import { MetricCard } from "@/components/MetricCard";
import { SentimentGauge } from "@/components/SentimentGauge";
import { KeyHighlights } from "@/components/KeyHighlights";
import { RevenueChart } from "@/components/RevenueChart";
import { MarginChart } from "@/components/MarginChart";
import { EarningsTable } from "@/components/EarningsTable";
import { PeerComparison } from "@/components/PeerComparison";
import { TranscriptAnalysis } from "@/components/TranscriptAnalysis";
import { GuidanceCard } from "@/components/GuidanceCard";
import { EmptyState } from "@/components/EmptyState";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { EarningsReport, PeerData, SentimentResult } from "@shared/schema";

export default function Dashboard() {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [peers, setPeers] = useState<PeerData[]>([]);
  const [transcriptSentiment, setTranscriptSentiment] = useState<SentimentResult | null>(null);
  const { toast } = useToast();

  const { data: reportData, isLoading, error, refetch } = useQuery<{ success: boolean; data: EarningsReport }>({
    queryKey: ["/api/analyze", selectedTicker],
    enabled: !!selectedTicker,
  });

  const peerMutation = useMutation({
    mutationFn: async (ticker: string) => {
      const response = await apiRequest("POST", "/api/peers", { tickers: [ticker] });
      return response.json();
    },
    onSuccess: (result) => {
      if (result.success && result.data.length > 0) {
        const newPeer = result.data[0];
        if (!peers.find(p => p.ticker === newPeer.ticker)) {
          setPeers([...peers, newPeer]);
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch peer data",
        variant: "destructive",
      });
    },
  });

  const transcriptMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await apiRequest("POST", "/api/transcript/analyze", { text });
      return response.json();
    },
    onSuccess: (result) => {
      if (result.success) {
        setTranscriptSentiment(result.data.sentiment);
        toast({
          title: "Analysis Complete",
          description: "Transcript sentiment analysis completed.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze transcript",
        variant: "destructive",
      });
    },
  });

  const handleSearch = async (ticker: string) => {
    setSelectedTicker(ticker);
    setActiveTab("overview");
    setTranscriptSentiment(null);
    setPeers([]);
    
    try {
      const peerResponse = await apiRequest("POST", "/api/peers", { tickers: [ticker] });
      const peerResult = await peerResponse.json();
      if (peerResult.success && peerResult.data.length > 0) {
        setPeers(peerResult.data);
      }
    } catch (err) {
      console.error("Failed to fetch initial peer data:", err);
    }
  };

  const handleRefresh = () => {
    if (selectedTicker) {
      refetch();
      toast({
        title: "Refreshing",
        description: "Fetching latest data...",
      });
    }
  };

  const handleExport = () => {
    if (reportData?.data) {
      const exportData = JSON.stringify(reportData.data, null, 2);
      const blob = new Blob([exportData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${selectedTicker}_earnings_report.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: "Export Complete",
        description: "Report downloaded as JSON file.",
      });
    }
  };

  const handleAddPeer = (ticker: string) => {
    if (!peers.find(p => p.ticker === ticker)) {
      peerMutation.mutate(ticker);
    }
  };

  const handleRemovePeer = (ticker: string) => {
    setPeers(peers.filter(p => p.ticker !== ticker));
  };

  const handleAnalyzeTranscript = (text: string) => {
    transcriptMutation.mutate(text);
  };

  const report = reportData?.data;

  const formatRevenueValue = (value: number) => {
    if (value >= 1e12) return (value / 1e12).toFixed(2) + "T";
    if (value >= 1e9) return (value / 1e9).toFixed(2) + "B";
    if (value >= 1e6) return (value / 1e6).toFixed(2) + "M";
    return value.toLocaleString();
  };

  const currentSentiment = transcriptSentiment || (report?.sentiment ? report.sentiment : null);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">EB</span>
            </div>
            <h1 className="text-xl font-semibold">Earnings Bot</h1>
          </div>
          <div className="flex items-center gap-4 w-full sm:w-auto justify-center">
            <TickerSearch onSearch={handleSearch} isLoading={isLoading} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <div className="text-center py-16">
            <h2 className="text-xl font-semibold mb-2 text-destructive">Error Loading Data</h2>
            <p className="text-muted-foreground mb-4">
              {error instanceof Error ? error.message : "Failed to fetch stock data. Please try another ticker."}
            </p>
          </div>
        ) : report ? (
          <div className="space-y-6">
            <CompanyHeader
              ticker={report.stockInfo.ticker}
              companyName={report.stockInfo.companyName}
              sector={report.stockInfo.sector || undefined}
              industry={report.stockInfo.industry || undefined}
              currentPrice={report.stockInfo.currentPrice}
              priceChange={report.stockInfo.priceChange}
              priceChangePercent={report.stockInfo.priceChangePercent}
              marketCap={report.stockInfo.marketCap}
              onRefresh={handleRefresh}
              onExport={handleExport}
              isLoading={isLoading}
            />

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
                <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
                <TabsTrigger value="financials" data-testid="tab-financials">Financials</TabsTrigger>
                <TabsTrigger value="sentiment" data-testid="tab-sentiment">Sentiment</TabsTrigger>
                <TabsTrigger value="peers" data-testid="tab-peers">Peers</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricCard
                    title="Revenue"
                    value={formatRevenueValue(report.metrics.revenue)}
                    prefix="$"
                    change={report.metrics.yoyRevenueGrowth ?? undefined}
                    changeLabel="YoY"
                    trend={report.metrics.yoyRevenueGrowth !== null 
                      ? (report.metrics.yoyRevenueGrowth >= 0 ? "up" : "down") 
                      : "neutral"}
                  />
                  <MetricCard
                    title="EPS"
                    value={report.metrics.eps.toFixed(2)}
                    prefix="$"
                    change={report.earningsHistory[0]?.surprise ?? undefined}
                    changeLabel="vs Est"
                    trend={report.metrics.beatEps === true ? "up" : report.metrics.beatEps === false ? "down" : "neutral"}
                    beat={report.metrics.beatEps}
                  />
                  <MetricCard
                    title="Gross Margin"
                    value={report.margins.gross.toFixed(1)}
                    suffix="%"
                    trend="neutral"
                  />
                  <MetricCard
                    title="Net Margin"
                    value={report.margins.net.toFixed(1)}
                    suffix="%"
                    trend={report.margins.net > 15 ? "up" : report.margins.net < 0 ? "down" : "neutral"}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <RevenueChart data={report.revenueHistory} />
                  </div>
                  <div>
                    <KeyHighlights highlights={report.highlights} />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {currentSentiment ? (
                    <SentimentGauge
                      score={currentSentiment.overallScore}
                      label={currentSentiment.overallLabel}
                      positive={currentSentiment.positive}
                      negative={currentSentiment.negative}
                      neutral={currentSentiment.neutral}
                    />
                  ) : (
                    <div className="flex items-center justify-center bg-card rounded-lg border border-card-border p-8">
                      <p className="text-muted-foreground text-center">
                        Paste an earnings call transcript in the Sentiment tab to analyze management tone and key signals.
                      </p>
                    </div>
                  )}
                  <GuidanceCard guidance={report.guidance} quarter="Next Quarter (Projected)" />
                </div>
              </TabsContent>

              <TabsContent value="financials" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RevenueChart data={report.revenueHistory} title="Revenue & Net Income Trend" />
                  <MarginChart
                    grossMargin={report.margins.gross}
                    operatingMargin={report.margins.operating}
                    netMargin={report.margins.net}
                  />
                </div>
                <EarningsTable data={report.earningsHistory} />
              </TabsContent>

              <TabsContent value="sentiment" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {currentSentiment ? (
                    <SentimentGauge
                      score={currentSentiment.overallScore}
                      label={currentSentiment.overallLabel}
                      positive={currentSentiment.positive}
                      negative={currentSentiment.negative}
                      neutral={currentSentiment.neutral}
                    />
                  ) : (
                    <div className="flex items-center justify-center bg-card rounded-lg border border-card-border p-8">
                      <p className="text-muted-foreground text-center">
                        No sentiment analysis available yet. Paste a transcript below to analyze.
                      </p>
                    </div>
                  )}
                  <KeyHighlights highlights={report.highlights} />
                </div>
                <TranscriptAnalysis
                  transcript=""
                  keyPhrases={currentSentiment?.keyPhrases || []}
                  positiveSignals={currentSentiment?.positiveSignals || []}
                  riskFactors={currentSentiment?.riskFactors || []}
                  onAnalyze={handleAnalyzeTranscript}
                />
              </TabsContent>

              <TabsContent value="peers" className="mt-6 space-y-6">
                <PeerComparison
                  targetTicker={report.stockInfo.ticker}
                  peers={peers}
                  onAddPeer={handleAddPeer}
                  onRemovePeer={handleRemovePeer}
                />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <EmptyState />
        )}
      </main>

      <footer className="border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          Earnings Bot - Stock Analysis Dashboard. Data provided by Yahoo Finance.
        </div>
      </footer>
    </div>
  );
}
