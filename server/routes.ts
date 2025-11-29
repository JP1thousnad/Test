import type { Express } from "express";
import { createServer, type Server } from "http";
import { stockDataService } from "./services/stockDataService";
import { sentimentService } from "./services/sentimentService";
import { analyzeRequestSchema, transcriptAnalysisSchema } from "@shared/schema";
import type { EarningsReport } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  app.get("/api/analyze/:ticker", async (req, res) => {
    try {
      const parsed = analyzeRequestSchema.safeParse({ ticker: req.params.ticker });
      if (!parsed.success) {
        return res.status(400).json({ 
          success: false, 
          error: "Invalid ticker symbol" 
        });
      }

      const ticker = parsed.data.ticker;

      const [stockInfo, incomeStatements, earningsHistory] = await Promise.all([
        stockDataService.getStockInfo(ticker),
        stockDataService.getIncomeStatements(ticker),
        stockDataService.getEarningsHistory(ticker),
      ]);

      const metrics = stockDataService.calculateMetrics(ticker, incomeStatements, earningsHistory);
      const highlights = stockDataService.generateHighlights(metrics, earningsHistory);
      const guidance = stockDataService.generateGuidance(metrics);

      const revenueHistory = incomeStatements.map((stmt, idx) => ({
        period: `Q${incomeStatements.length - idx}`,
        revenue: stmt.totalRevenue,
        netIncome: stmt.netIncome,
      })).reverse();

      const report: EarningsReport = {
        stockInfo,
        metrics,
        sentiment: null,
        highlights,
        revenueHistory,
        earningsHistory,
        guidance,
        margins: {
          gross: metrics.grossMargin,
          operating: metrics.operatingMargin,
          net: metrics.netMargin,
        },
      };

      res.json({ success: true, data: report });
    } catch (error: any) {
      console.error(`Error analyzing ${req.params.ticker}:`, error);
      res.status(400).json({ 
        success: false, 
        error: error.message || "Failed to analyze stock" 
      });
    }
  });

  app.get("/api/stock/:ticker/info", async (req, res) => {
    try {
      const parsed = analyzeRequestSchema.safeParse({ ticker: req.params.ticker });
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: "Invalid ticker symbol" });
      }

      const stockInfo = await stockDataService.getStockInfo(parsed.data.ticker);
      res.json({ success: true, data: stockInfo });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.get("/api/stock/:ticker/peers", async (req, res) => {
    try {
      const parsed = analyzeRequestSchema.safeParse({ ticker: req.params.ticker });
      if (!parsed.success) {
        return res.status(400).json({ success: false, error: "Invalid ticker symbol" });
      }

      const peerData = await stockDataService.getPeerData(parsed.data.ticker);
      res.json({ success: true, data: peerData });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.post("/api/peers", async (req, res) => {
    try {
      const { tickers } = req.body;
      if (!Array.isArray(tickers) || tickers.length === 0) {
        return res.status(400).json({ success: false, error: "Provide an array of tickers" });
      }

      const validTickers = tickers
        .slice(0, 10)
        .map(t => String(t).toUpperCase().trim())
        .filter(t => t.length > 0 && t.length <= 10);

      const peerData = await stockDataService.getMultiplePeerData(validTickers);
      res.json({ success: true, data: peerData });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  app.post("/api/transcript/analyze", async (req, res) => {
    try {
      const parsed = transcriptAnalysisSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ 
          success: false, 
          error: parsed.error.errors[0]?.message || "Invalid transcript" 
        });
      }

      const sentiment = sentimentService.analyzeSentiment(parsed.data.text);
      const keywordAnalysis = sentimentService.getKeywordAnalysis(parsed.data.text);

      res.json({ 
        success: true, 
        data: { 
          sentiment,
          keywordAnalysis,
        } 
      });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  });

  return httpServer;
}
