import YahooFinance from "yahoo-finance2";
import type { StockInfo, IncomeStatementData, EarningsHistoryEntry, EarningsMetrics, GuidanceRange, KeyHighlight, PeerData } from "@shared/schema";

// Initialize YahooFinance instance
const yahooFinance = new YahooFinance();

export class StockDataService {
  async getStockInfo(ticker: string): Promise<StockInfo> {
    try {
      const quote = await yahooFinance.quote(ticker) as any;
      
      return {
        ticker: quote.symbol || ticker,
        companyName: quote.shortName || quote.longName || ticker,
        sector: null,
        industry: null,
        currentPrice: quote.regularMarketPrice || 0,
        priceChange: quote.regularMarketChange || 0,
        priceChangePercent: quote.regularMarketChangePercent || 0,
        marketCap: quote.marketCap || 0,
        peRatio: quote.trailingPE || null,
        forwardPe: quote.forwardPE || null,
        dividendYield: quote.dividendYield || null,
        fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || 0,
        fiftyTwoWeekLow: quote.fiftyTwoWeekLow || 0,
      };
    } catch (error) {
      console.error(`Error fetching stock info for ${ticker}:`, error);
      throw new Error(`Failed to fetch stock info for ${ticker}`);
    }
  }

  async getQuoteSummary(ticker: string): Promise<any> {
    try {
      const summary = await yahooFinance.quoteSummary(ticker, {
        modules: ["summaryProfile", "financialData", "defaultKeyStatistics", "earningsHistory", "earningsTrend"],
      });
      return summary;
    } catch (error) {
      console.error(`Error fetching quote summary for ${ticker}:`, error);
      return null;
    }
  }

  async getIncomeStatements(ticker: string): Promise<IncomeStatementData[]> {
    try {
      const summary = await yahooFinance.quoteSummary(ticker, {
        modules: ["incomeStatementHistory", "incomeStatementHistoryQuarterly"],
      }) as any;

      const statements = summary.incomeStatementHistoryQuarterly?.incomeStatementHistory || 
                        summary.incomeStatementHistory?.incomeStatementHistory || [];

      return statements.slice(0, 4).map((stmt: any) => ({
        periodEnding: stmt.endDate ? new Date(stmt.endDate).toISOString().split('T')[0] : "Unknown",
        totalRevenue: stmt.totalRevenue || 0,
        grossProfit: stmt.grossProfit || 0,
        operatingIncome: stmt.operatingIncome || 0,
        netIncome: stmt.netIncome || 0,
        eps: null,
      }));
    } catch (error) {
      console.error(`Error fetching income statements for ${ticker}:`, error);
      return [];
    }
  }

  async getEarningsHistory(ticker: string): Promise<EarningsHistoryEntry[]> {
    try {
      const summary = await yahooFinance.quoteSummary(ticker, {
        modules: ["earningsHistory"],
      }) as any;

      const history = summary.earningsHistory?.history || [];

      return history.map((entry: any) => {
        const epsActual = entry.epsActual || 0;
        const epsEstimate = entry.epsEstimate || null;
        const surprise = epsEstimate ? ((epsActual - epsEstimate) / Math.abs(epsEstimate)) * 100 : null;
        const beat = epsEstimate !== null ? epsActual > epsEstimate : null;

        return {
          period: entry.quarter ? `Q${entry.quarter}` : "Unknown",
          reportDate: entry.quarterDate ? new Date(entry.quarterDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Unknown",
          revenue: 0,
          eps: epsActual,
          epsEstimate,
          beat,
          surprise: surprise ? Math.round(surprise * 10) / 10 : null,
        };
      });
    } catch (error) {
      console.error(`Error fetching earnings history for ${ticker}:`, error);
      return [];
    }
  }

  calculateMetrics(
    ticker: string,
    incomeStatements: IncomeStatementData[],
    earningsHistory: EarningsHistoryEntry[]
  ): EarningsMetrics {
    const current = incomeStatements[0];
    const previous = incomeStatements.length > 4 ? incomeStatements[4] : incomeStatements[incomeStatements.length - 1];
    const latestEarnings = earningsHistory[0];

    const revenue = current?.totalRevenue || 0;
    const netIncome = current?.netIncome || 0;
    const grossProfit = current?.grossProfit || 0;
    const operatingIncome = current?.operatingIncome || 0;

    const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const operatingMargin = revenue > 0 ? (operatingIncome / revenue) * 100 : 0;
    const netMargin = revenue > 0 ? (netIncome / revenue) * 100 : 0;

    const previousRevenue = previous?.totalRevenue || 0;
    const yoyRevenueGrowth = previousRevenue > 0 
      ? ((revenue - previousRevenue) / previousRevenue) * 100 
      : null;

    return {
      ticker,
      period: current?.periodEnding || "Current",
      revenue,
      netIncome,
      eps: latestEarnings?.eps || 0,
      epsEstimate: latestEarnings?.epsEstimate || null,
      revenueEstimate: null,
      grossMargin: Math.round(grossMargin * 10) / 10,
      operatingMargin: Math.round(operatingMargin * 10) / 10,
      netMargin: Math.round(netMargin * 10) / 10,
      yoyRevenueGrowth: yoyRevenueGrowth !== null ? Math.round(yoyRevenueGrowth * 10) / 10 : null,
      yoyEpsGrowth: null,
      beatEps: latestEarnings?.beat ?? null,
      beatRevenue: null,
    };
  }

  generateHighlights(metrics: EarningsMetrics, earningsHistory: EarningsHistoryEntry[]): KeyHighlight[] {
    const highlights: KeyHighlight[] = [];
    const latestEarnings = earningsHistory[0];

    if (latestEarnings?.beat === true && latestEarnings.surprise) {
      highlights.push({
        type: "beat",
        text: `EPS beat analyst estimates by ${latestEarnings.surprise.toFixed(1)}%`,
      });
    } else if (latestEarnings?.beat === false && latestEarnings.surprise) {
      highlights.push({
        type: "miss",
        text: `EPS missed analyst estimates by ${Math.abs(latestEarnings.surprise).toFixed(1)}%`,
      });
    }

    if (metrics.yoyRevenueGrowth !== null) {
      if (metrics.yoyRevenueGrowth > 5) {
        highlights.push({
          type: "growth",
          text: `Strong revenue growth of ${metrics.yoyRevenueGrowth.toFixed(1)}% YoY`,
        });
      } else if (metrics.yoyRevenueGrowth < -5) {
        highlights.push({
          type: "growth",
          text: `Revenue declined ${Math.abs(metrics.yoyRevenueGrowth).toFixed(1)}% YoY`,
        });
      }
    }

    if (metrics.netMargin > 20) {
      highlights.push({
        type: "margin",
        text: `High profitability with ${metrics.netMargin.toFixed(1)}% net margin`,
      });
    } else if (metrics.netMargin > 10) {
      highlights.push({
        type: "margin",
        text: `Solid net margin of ${metrics.netMargin.toFixed(1)}%`,
      });
    } else if (metrics.netMargin < 0) {
      highlights.push({
        type: "margin",
        text: `Operating at a loss with ${metrics.netMargin.toFixed(1)}% net margin`,
      });
    }

    if (metrics.grossMargin > 50) {
      highlights.push({
        type: "info",
        text: `Strong gross margin of ${metrics.grossMargin.toFixed(1)}% indicates pricing power`,
      });
    }

    const beatCount = earningsHistory.filter(e => e.beat === true).length;
    if (beatCount >= 3) {
      highlights.push({
        type: "info",
        text: `Consistent performer: Beat estimates in ${beatCount} of last ${earningsHistory.length} quarters`,
      });
    }

    return highlights;
  }

  async getPeerData(ticker: string): Promise<PeerData> {
    try {
      const [quote, summary] = await Promise.all([
        yahooFinance.quote(ticker) as Promise<any>,
        this.getQuoteSummary(ticker),
      ]);

      const financialData = summary?.financialData;
      const revenueGrowth = financialData?.revenueGrowth || 0;

      return {
        ticker: quote.symbol || ticker,
        name: quote.shortName || quote.longName || ticker,
        marketCap: quote.marketCap || 0,
        pe: quote.trailingPE || 0,
        revenue: financialData?.totalRevenue || 0,
        netMargin: financialData?.profitMargins ? financialData.profitMargins * 100 : 0,
        growth: typeof revenueGrowth === 'number' ? revenueGrowth * 100 : 0,
      };
    } catch (error) {
      console.error(`Error fetching peer data for ${ticker}:`, error);
      throw new Error(`Failed to fetch peer data for ${ticker}`);
    }
  }

  async getMultiplePeerData(tickers: string[]): Promise<PeerData[]> {
    const results = await Promise.allSettled(
      tickers.map(ticker => this.getPeerData(ticker))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<PeerData> => result.status === "fulfilled")
      .map(result => result.value);
  }

  generateGuidance(metrics: EarningsMetrics): GuidanceRange[] {
    const revenueInBillions = metrics.revenue / 1e9;
    const growthFactor = metrics.yoyRevenueGrowth 
      ? 1 + (metrics.yoyRevenueGrowth / 100) * 0.5 
      : 1.02;

    return [
      {
        label: "Revenue (Projected)",
        low: Math.round(revenueInBillions * growthFactor * 0.98 * 10) / 10,
        high: Math.round(revenueInBillions * growthFactor * 1.02 * 10) / 10,
        unit: "B",
        previous: Math.round(revenueInBillions * 10) / 10,
      },
      {
        label: "Gross Margin (Projected)",
        low: Math.round((metrics.grossMargin - 1) * 10) / 10,
        high: Math.round((metrics.grossMargin + 1) * 10) / 10,
        unit: "%",
        previous: metrics.grossMargin,
      },
    ];
  }
}

export const stockDataService = new StockDataService();
