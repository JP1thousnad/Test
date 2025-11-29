import { sql } from "drizzle-orm";
import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const analyzeRequestSchema = z.object({
  ticker: z.string().min(1).max(10).transform(val => val.toUpperCase()),
});

export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;

export interface EarningsMetrics {
  ticker: string;
  period: string;
  revenue: number;
  netIncome: number;
  eps: number;
  epsEstimate: number | null;
  revenueEstimate: number | null;
  grossMargin: number;
  operatingMargin: number;
  netMargin: number;
  yoyRevenueGrowth: number | null;
  yoyEpsGrowth: number | null;
  beatEps: boolean | null;
  beatRevenue: boolean | null;
}

export interface SentimentResult {
  overallScore: number;
  overallLabel: "Bullish" | "Bearish" | "Neutral";
  confidence: number;
  positive: number;
  negative: number;
  neutral: number;
  keyPhrases: Array<{ phrase: string; count: number }>;
  riskFactors: string[];
  positiveSignals: string[];
}

export interface StockInfo {
  ticker: string;
  companyName: string;
  sector: string | null;
  industry: string | null;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  marketCap: number;
  peRatio: number | null;
  forwardPe: number | null;
  dividendYield: number | null;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
}

export interface IncomeStatementData {
  periodEnding: string;
  totalRevenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  eps: number | null;
}

export interface EarningsHistoryEntry {
  period: string;
  reportDate: string;
  revenue: number;
  eps: number;
  epsEstimate: number | null;
  beat: boolean | null;
  surprise: number | null;
}

export interface GuidanceRange {
  label: string;
  low: number;
  high: number;
  unit: string;
  previous?: number;
}

export interface KeyHighlight {
  type: "beat" | "miss" | "growth" | "margin" | "info";
  text: string;
}

export interface EarningsReport {
  stockInfo: StockInfo;
  metrics: EarningsMetrics;
  sentiment: SentimentResult | null;
  highlights: KeyHighlight[];
  revenueHistory: Array<{ period: string; revenue: number; netIncome: number }>;
  earningsHistory: EarningsHistoryEntry[];
  guidance: GuidanceRange[];
  margins: { gross: number; operating: number; net: number };
}

export interface PeerData {
  ticker: string;
  name: string;
  marketCap: number;
  pe: number;
  revenue: number;
  netMargin: number;
  growth: number;
}

export const transcriptAnalysisSchema = z.object({
  text: z.string().min(50, "Transcript must be at least 50 characters"),
});

export type TranscriptAnalysisRequest = z.infer<typeof transcriptAnalysisSchema>;
