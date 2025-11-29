import { useState } from "react";
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

// todo: remove mock functionality - mock data for prototype
const mockCompanyData = {
  AAPL: {
    ticker: "AAPL",
    companyName: "Apple Inc.",
    sector: "Technology",
    industry: "Consumer Electronics",
    currentPrice: 185.42,
    priceChange: 2.35,
    priceChangePercent: 1.28,
    marketCap: 2.89e12,
    metrics: {
      revenue: { value: "94.93B", change: 8.1 },
      eps: { value: "1.53", change: 4.2, beat: true },
      netMargin: { value: "25.3", change: 1.8 },
      grossMargin: { value: "46.3", change: 1.5 },
    },
    margins: { gross: 46.3, operating: 30.2, net: 25.3 },
    sentiment: { score: 0.45, label: "Bullish" as const, positive: 0.58, negative: 0.12, neutral: 0.30 },
    highlights: [
      { type: "beat" as const, text: "EPS beat analyst estimates by 4.2%" },
      { type: "beat" as const, text: "Revenue exceeded Wall Street expectations" },
      { type: "growth" as const, text: "Strong 8.1% YoY revenue growth driven by Services" },
      { type: "margin" as const, text: "Net margin improved to 25.3%, up 180 bps" },
      { type: "info" as const, text: "Management expressed bullish outlook for AI initiatives" },
    ],
    revenueHistory: [
      { period: "Q1 2024", revenue: 85.5e9, netIncome: 21.5e9 },
      { period: "Q2 2024", revenue: 89.2e9, netIncome: 23.1e9 },
      { period: "Q3 2024", revenue: 91.8e9, netIncome: 24.0e9 },
      { period: "Q4 2024", revenue: 94.9e9, netIncome: 24.2e9 },
    ],
    earningsHistory: [
      { period: "Q4 2024", reportDate: "Jan 30, 2025", revenue: 94.9e9, eps: 1.53, epsEstimate: 1.47, beat: true, surprise: 4.1 },
      { period: "Q3 2024", reportDate: "Oct 31, 2024", revenue: 91.8e9, eps: 1.42, epsEstimate: 1.40, beat: true, surprise: 1.4 },
      { period: "Q2 2024", reportDate: "Aug 1, 2024", revenue: 89.2e9, eps: 1.38, epsEstimate: 1.41, beat: false, surprise: -2.1 },
      { period: "Q1 2024", reportDate: "May 2, 2024", revenue: 85.5e9, eps: 1.29, epsEstimate: 1.25, beat: true, surprise: 3.2 },
    ],
    guidance: [
      { label: "Revenue", low: 96, high: 100, unit: "B", previous: 94.9 },
      { label: "EPS", low: 1.55, high: 1.62, unit: "$", previous: 1.53 },
      { label: "Gross Margin", low: 45.5, high: 47.0, unit: "%" },
    ],
    transcriptAnalysis: {
      transcript: "We delivered exceptional results this quarter with record Services revenue of $23.1 billion. iPhone revenue grew 8% YoY driven by strong demand for iPhone 15 Pro models. Our installed base continues to grow, now exceeding 2 billion active devices worldwide.",
      keyPhrases: [
        { phrase: "revenue growth", count: 12 },
        { phrase: "services revenue", count: 8 },
        { phrase: "iPhone demand", count: 6 },
        { phrase: "installed base", count: 5 },
        { phrase: "margin expansion", count: 4 },
      ],
      positiveSignals: [
        "Record Services revenue of $23.1B",
        "iPhone revenue grew 8% YoY",
        "Installed base exceeded 2 billion devices",
        "Strong gross margin of 46.3%",
      ],
      riskFactors: [
        "China market uncertainty mentioned",
        "FX headwinds expected next quarter",
        "Regulatory concerns in EU discussed",
      ],
    },
  },
  MSFT: {
    ticker: "MSFT",
    companyName: "Microsoft Corporation",
    sector: "Technology",
    industry: "Software - Infrastructure",
    currentPrice: 378.91,
    priceChange: 5.12,
    priceChangePercent: 1.37,
    marketCap: 2.81e12,
    metrics: {
      revenue: { value: "56.52B", change: 12.4 },
      eps: { value: "2.93", change: 6.8, beat: true },
      netMargin: { value: "36.5", change: 2.1 },
      grossMargin: { value: "69.8", change: 0.8 },
    },
    margins: { gross: 69.8, operating: 44.1, net: 36.5 },
    sentiment: { score: 0.62, label: "Bullish" as const, positive: 0.65, negative: 0.08, neutral: 0.27 },
    highlights: [
      { type: "beat" as const, text: "EPS beat consensus by 6.8%" },
      { type: "growth" as const, text: "Azure revenue grew 29% YoY" },
      { type: "growth" as const, text: "AI services driving cloud momentum" },
      { type: "margin" as const, text: "Industry-leading 36.5% net margin" },
      { type: "info" as const, text: "Copilot adoption accelerating across enterprise" },
    ],
    revenueHistory: [
      { period: "Q1 FY24", revenue: 52.9e9, netIncome: 19.2e9 },
      { period: "Q2 FY24", revenue: 54.7e9, netIncome: 20.1e9 },
      { period: "Q3 FY24", revenue: 55.8e9, netIncome: 20.5e9 },
      { period: "Q4 FY24", revenue: 56.5e9, netIncome: 20.6e9 },
    ],
    earningsHistory: [
      { period: "Q4 FY24", reportDate: "Jan 28, 2025", revenue: 56.5e9, eps: 2.93, epsEstimate: 2.75, beat: true, surprise: 6.5 },
      { period: "Q3 FY24", reportDate: "Oct 24, 2024", revenue: 55.8e9, eps: 2.81, epsEstimate: 2.70, beat: true, surprise: 4.1 },
      { period: "Q2 FY24", reportDate: "Jul 30, 2024", revenue: 54.7e9, eps: 2.69, epsEstimate: 2.62, beat: true, surprise: 2.7 },
      { period: "Q1 FY24", reportDate: "Apr 25, 2024", revenue: 52.9e9, eps: 2.55, epsEstimate: 2.48, beat: true, surprise: 2.8 },
    ],
    guidance: [
      { label: "Revenue", low: 58, high: 60, unit: "B", previous: 56.5 },
      { label: "EPS", low: 2.98, high: 3.08, unit: "$", previous: 2.93 },
      { label: "Azure Growth", low: 26, high: 28, unit: "%" },
    ],
    transcriptAnalysis: {
      transcript: "Azure and other cloud services revenue grew 29% driven by AI workloads. Microsoft 365 Commercial cloud revenue increased 15%. Our Copilot products are seeing strong enterprise adoption with over 400 million monthly active users.",
      keyPhrases: [
        { phrase: "Azure growth", count: 15 },
        { phrase: "AI workloads", count: 10 },
        { phrase: "cloud revenue", count: 9 },
        { phrase: "Copilot adoption", count: 7 },
        { phrase: "enterprise customers", count: 5 },
      ],
      positiveSignals: [
        "Azure revenue grew 29% YoY",
        "Copilot has 400M monthly active users",
        "Commercial cloud surpassed $143B ARR",
        "Gaming revenue up 61% including Activision",
      ],
      riskFactors: [
        "OpenAI partnership costs mentioned",
        "Increased competition in cloud market",
        "EU regulatory scrutiny ongoing",
      ],
    },
  },
  NVDA: {
    ticker: "NVDA",
    companyName: "NVIDIA Corporation",
    sector: "Technology",
    industry: "Semiconductors",
    currentPrice: 875.28,
    priceChange: 18.42,
    priceChangePercent: 2.15,
    marketCap: 2.16e12,
    metrics: {
      revenue: { value: "22.10B", change: 122.0 },
      eps: { value: "5.16", change: 168.0, beat: true },
      netMargin: { value: "55.6", change: 18.2 },
      grossMargin: { value: "72.7", change: 8.4 },
    },
    margins: { gross: 72.7, operating: 58.8, net: 55.6 },
    sentiment: { score: 0.78, label: "Bullish" as const, positive: 0.72, negative: 0.05, neutral: 0.23 },
    highlights: [
      { type: "beat" as const, text: "Massive EPS beat of 168% YoY" },
      { type: "growth" as const, text: "Data Center revenue up 409% YoY" },
      { type: "growth" as const, text: "AI demand driving unprecedented growth" },
      { type: "margin" as const, text: "Record 72.7% gross margin" },
      { type: "info" as const, text: "Blackwell architecture ramp beginning Q1" },
    ],
    revenueHistory: [
      { period: "Q1 FY24", revenue: 7.2e9, netIncome: 2.0e9 },
      { period: "Q2 FY24", revenue: 13.5e9, netIncome: 6.1e9 },
      { period: "Q3 FY24", revenue: 18.1e9, netIncome: 9.2e9 },
      { period: "Q4 FY24", revenue: 22.1e9, netIncome: 12.3e9 },
    ],
    earningsHistory: [
      { period: "Q4 FY24", reportDate: "Feb 21, 2025", revenue: 22.1e9, eps: 5.16, epsEstimate: 4.60, beat: true, surprise: 12.2 },
      { period: "Q3 FY24", reportDate: "Nov 21, 2024", revenue: 18.1e9, eps: 4.02, epsEstimate: 3.36, beat: true, surprise: 19.6 },
      { period: "Q2 FY24", reportDate: "Aug 23, 2024", revenue: 13.5e9, eps: 2.70, epsEstimate: 2.07, beat: true, surprise: 30.4 },
      { period: "Q1 FY24", reportDate: "May 24, 2024", revenue: 7.2e9, eps: 1.09, epsEstimate: 0.92, beat: true, surprise: 18.5 },
    ],
    guidance: [
      { label: "Revenue", low: 24, high: 25, unit: "B", previous: 22.1 },
      { label: "Gross Margin", low: 71, high: 74, unit: "%", previous: 72.7 },
    ],
    transcriptAnalysis: {
      transcript: "Data Center revenue was a record $18.4 billion, up 409% from a year ago. We are seeing incredible demand for our Hopper architecture. Blackwell production is ramping and we expect strong demand throughout the year.",
      keyPhrases: [
        { phrase: "data center", count: 22 },
        { phrase: "AI demand", count: 18 },
        { phrase: "Hopper architecture", count: 12 },
        { phrase: "Blackwell", count: 10 },
        { phrase: "supply constraints", count: 6 },
      ],
      positiveSignals: [
        "Data Center revenue up 409% YoY",
        "Record gross margin of 72.7%",
        "Blackwell architecture ramping",
        "Strong demand visibility into 2025",
      ],
      riskFactors: [
        "Supply constraints mentioned",
        "China export restrictions impact",
        "Concentration in few large customers",
      ],
    },
  },
};

// todo: remove mock functionality - mock peer data
const mockPeerData = {
  AAPL: [
    { ticker: "AAPL", name: "Apple Inc.", marketCap: 2.89e12, pe: 29.5, revenue: 383e9, netMargin: 25.3, growth: 8.1 },
    { ticker: "MSFT", name: "Microsoft Corp.", marketCap: 2.81e12, pe: 35.2, revenue: 211e9, netMargin: 36.5, growth: 12.4 },
    { ticker: "GOOGL", name: "Alphabet Inc.", marketCap: 1.82e12, pe: 24.8, revenue: 307e9, netMargin: 23.8, growth: 9.2 },
  ],
  MSFT: [
    { ticker: "MSFT", name: "Microsoft Corp.", marketCap: 2.81e12, pe: 35.2, revenue: 211e9, netMargin: 36.5, growth: 12.4 },
    { ticker: "AAPL", name: "Apple Inc.", marketCap: 2.89e12, pe: 29.5, revenue: 383e9, netMargin: 25.3, growth: 8.1 },
    { ticker: "AMZN", name: "Amazon.com Inc.", marketCap: 1.85e12, pe: 42.1, revenue: 514e9, netMargin: 6.2, growth: 11.8 },
  ],
  NVDA: [
    { ticker: "NVDA", name: "NVIDIA Corp.", marketCap: 2.16e12, pe: 65.8, revenue: 60.9e9, netMargin: 55.6, growth: 122.0 },
    { ticker: "AMD", name: "AMD Inc.", marketCap: 245e9, pe: 45.2, revenue: 22.7e9, netMargin: 4.2, growth: 6.8 },
    { ticker: "INTC", name: "Intel Corp.", marketCap: 108e9, pe: -15.2, revenue: 54.2e9, netMargin: -2.1, growth: -14.5 },
  ],
};

export default function Dashboard() {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [peers, setPeers] = useState<typeof mockPeerData.AAPL>([]);
  const { toast } = useToast();

  // todo: remove mock functionality - simulate data loading
  const handleSearch = (ticker: string) => {
    setIsLoading(true);
    setActiveTab("overview");
    
    setTimeout(() => {
      const data = mockCompanyData[ticker as keyof typeof mockCompanyData];
      if (data) {
        setSelectedTicker(ticker);
        setPeers(mockPeerData[ticker as keyof typeof mockPeerData] || []);
        toast({
          title: "Analysis Complete",
          description: `Loaded earnings data for ${data.companyName}`,
        });
      } else {
        toast({
          title: "Ticker Not Found",
          description: `No data available for ${ticker}. Try AAPL, MSFT, or NVDA.`,
          variant: "destructive",
        });
      }
      setIsLoading(false);
    }, 1200);
  };

  const handleRefresh = () => {
    if (selectedTicker) {
      handleSearch(selectedTicker);
    }
  };

  const handleExport = () => {
    if (selectedTicker && data) {
      const exportData = JSON.stringify(data, null, 2);
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
      // todo: remove mock functionality
      const newPeer = {
        ticker,
        name: `${ticker} Corp.`,
        marketCap: Math.random() * 500e9 + 50e9,
        pe: Math.random() * 40 + 10,
        revenue: Math.random() * 100e9 + 10e9,
        netMargin: Math.random() * 30 + 5,
        growth: Math.random() * 30 - 10,
      };
      setPeers([...peers, newPeer]);
    }
  };

  const handleRemovePeer = (ticker: string) => {
    setPeers(peers.filter(p => p.ticker !== ticker));
  };

  const handleAnalyzeTranscript = (text: string) => {
    console.log("Analyzing transcript:", text.substring(0, 100));
    toast({
      title: "Analysis Started",
      description: "Processing transcript for sentiment analysis...",
    });
  };

  const data = selectedTicker 
    ? mockCompanyData[selectedTicker as keyof typeof mockCompanyData] 
    : null;

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
        ) : data ? (
          <div className="space-y-6">
            <CompanyHeader
              ticker={data.ticker}
              companyName={data.companyName}
              sector={data.sector}
              industry={data.industry}
              currentPrice={data.currentPrice}
              priceChange={data.priceChange}
              priceChangePercent={data.priceChangePercent}
              marketCap={data.marketCap}
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
                    value={data.metrics.revenue.value}
                    prefix="$"
                    change={data.metrics.revenue.change}
                    changeLabel="YoY"
                    trend={data.metrics.revenue.change >= 0 ? "up" : "down"}
                  />
                  <MetricCard
                    title="EPS"
                    value={data.metrics.eps.value}
                    prefix="$"
                    change={data.metrics.eps.change}
                    changeLabel="vs Est"
                    trend={data.metrics.eps.change >= 0 ? "up" : "down"}
                    beat={data.metrics.eps.beat}
                  />
                  <MetricCard
                    title="Gross Margin"
                    value={data.metrics.grossMargin.value}
                    suffix="%"
                    change={data.metrics.grossMargin.change}
                    changeLabel="YoY"
                    trend={data.metrics.grossMargin.change >= 0 ? "up" : "down"}
                  />
                  <MetricCard
                    title="Net Margin"
                    value={data.metrics.netMargin.value}
                    suffix="%"
                    change={data.metrics.netMargin.change}
                    changeLabel="YoY"
                    trend={data.metrics.netMargin.change >= 0 ? "up" : "down"}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <RevenueChart data={data.revenueHistory} />
                  </div>
                  <div>
                    <KeyHighlights highlights={data.highlights} />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SentimentGauge
                    score={data.sentiment.score}
                    label={data.sentiment.label}
                    positive={data.sentiment.positive}
                    negative={data.sentiment.negative}
                    neutral={data.sentiment.neutral}
                  />
                  <GuidanceCard guidance={data.guidance} quarter="Next Quarter" />
                </div>
              </TabsContent>

              <TabsContent value="financials" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <RevenueChart data={data.revenueHistory} title="Revenue & Net Income Trend" />
                  <MarginChart
                    grossMargin={data.margins.gross}
                    operatingMargin={data.margins.operating}
                    netMargin={data.margins.net}
                  />
                </div>
                <EarningsTable data={data.earningsHistory} />
              </TabsContent>

              <TabsContent value="sentiment" className="mt-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <SentimentGauge
                    score={data.sentiment.score}
                    label={data.sentiment.label}
                    positive={data.sentiment.positive}
                    negative={data.sentiment.negative}
                    neutral={data.sentiment.neutral}
                  />
                  <KeyHighlights highlights={data.highlights} />
                </div>
                <TranscriptAnalysis
                  transcript={data.transcriptAnalysis.transcript}
                  keyPhrases={data.transcriptAnalysis.keyPhrases}
                  positiveSignals={data.transcriptAnalysis.positiveSignals}
                  riskFactors={data.transcriptAnalysis.riskFactors}
                  onAnalyze={handleAnalyzeTranscript}
                />
              </TabsContent>

              <TabsContent value="peers" className="mt-6 space-y-6">
                <PeerComparison
                  targetTicker={data.ticker}
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
          Earnings Bot - Stock Analysis Dashboard. Data is for demonstration purposes only.
        </div>
      </footer>
    </div>
  );
}
