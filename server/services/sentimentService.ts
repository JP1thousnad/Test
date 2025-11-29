import type { SentimentResult } from "@shared/schema";

export class SentimentService {
  private positiveKeywords = [
    "strong", "solid", "robust", "excellent", "outstanding",
    "record", "growth", "exceeded", "beat", "outperformed",
    "confident", "optimistic", "momentum", "accelerating",
    "improved", "healthy", "resilient", "innovation", "opportunity",
    "tailwind", "success", "profitable", "expansion", "demand",
    "breakthrough", "milestone", "leadership", "advantage", "efficient"
  ];

  private negativeKeywords = [
    "weak", "challenging", "difficult", "disappointing", "miss",
    "decline", "pressure", "headwind", "concern", "uncertainty",
    "risk", "slowdown", "cautious", "conservative", "volatile",
    "macro", "inflationary", "competitive", "disruption", "struggle",
    "loss", "decrease", "contraction", "warning", "delay",
    "constraint", "shortage", "recession", "downturn", "layoff"
  ];

  private financialKeywords = {
    revenue: ["revenue", "sales", "top line", "top-line"],
    profit: ["profit", "earnings", "income", "bottom line", "bottom-line", "ebitda"],
    margin: ["margin", "gross margin", "operating margin", "net margin"],
    growth: ["growth", "increase", "grew", "expanded", "accelerate", "yoy", "year-over-year"],
    decline: ["decline", "decrease", "fell", "dropped", "contracted"],
    guidance: ["guidance", "outlook", "forecast", "expect", "anticipate", "projection"],
    cost: ["cost", "expense", "spending", "investment", "capex"],
    debt: ["debt", "leverage", "borrowing", "credit", "interest"],
    cash: ["cash", "liquidity", "cash flow", "free cash flow", "fcf"],
    dividend: ["dividend", "buyback", "repurchase", "capital return", "shareholder"],
  };

  analyzeSentiment(text: string): SentimentResult {
    const textLower = text.toLowerCase();
    const words = textLower.split(/\s+/);

    let posCount = 0;
    let negCount = 0;

    for (const word of words) {
      if (this.positiveKeywords.some(kw => word.includes(kw))) {
        posCount++;
      }
      if (this.negativeKeywords.some(kw => word.includes(kw))) {
        negCount++;
      }
    }

    for (const keyword of this.positiveKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        posCount += matches.length;
      }
    }

    for (const keyword of this.negativeKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        negCount += matches.length;
      }
    }

    const total = posCount + negCount || 1;
    const positive = posCount / total;
    const negative = negCount / total;
    const neutral = Math.max(0, 1 - positive - negative);
    const compound = (posCount - negCount) / total;

    let overallLabel: "Bullish" | "Bearish" | "Neutral";
    if (compound > 0.15) {
      overallLabel = "Bullish";
    } else if (compound < -0.15) {
      overallLabel = "Bearish";
    } else {
      overallLabel = "Neutral";
    }

    const keyPhrases = this.extractKeyPhrases(text);
    const positiveSignals = this.extractPositiveSignals(text);
    const riskFactors = this.extractRiskFactors(text);

    return {
      overallScore: Math.round(compound * 100) / 100,
      overallLabel,
      confidence: Math.min(0.9, total / 20),
      positive: Math.round(positive * 100) / 100,
      negative: Math.round(negative * 100) / 100,
      neutral: Math.round(neutral * 100) / 100,
      keyPhrases,
      positiveSignals,
      riskFactors,
    };
  }

  private extractKeyPhrases(text: string): Array<{ phrase: string; count: number }> {
    const textLower = text.toLowerCase();
    const phraseCounts: Map<string, number> = new Map();

    for (const [category, keywords] of Object.entries(this.financialKeywords)) {
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches && matches.length > 0) {
          phraseCounts.set(keyword, matches.length);
        }
      }
    }

    const bigramPatterns = [
      "revenue growth", "earnings growth", "market share", "operating income",
      "free cash flow", "gross margin", "net income", "year over year",
      "quarter over quarter", "capital allocation", "cost reduction",
      "product launch", "customer demand", "supply chain"
    ];

    for (const pattern of bigramPatterns) {
      const regex = new RegExp(pattern, 'gi');
      const matches = text.match(regex);
      if (matches && matches.length > 0) {
        phraseCounts.set(pattern, matches.length);
      }
    }

    return Array.from(phraseCounts.entries())
      .map(([phrase, count]) => ({ phrase, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private extractPositiveSignals(text: string): string[] {
    const signals: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

    const positivePatterns = [
      /record\s+(?:high|revenue|profit|quarter)/i,
      /(?:strong|robust|solid)\s+(?:demand|growth|performance)/i,
      /beat\s+(?:estimates|expectations|consensus)/i,
      /exceeded\s+(?:guidance|expectations)/i,
      /grew\s+\d+%/i,
      /increased\s+\d+%/i,
      /margin\s+(?:expanded|improved|increased)/i,
      /raised\s+(?:guidance|outlook)/i,
    ];

    for (const sentence of sentences) {
      for (const pattern of positivePatterns) {
        if (pattern.test(sentence)) {
          const cleaned = sentence.trim().slice(0, 120);
          if (!signals.includes(cleaned)) {
            signals.push(cleaned);
          }
          break;
        }
      }
    }

    if (signals.length === 0) {
      for (const sentence of sentences) {
        const hasPositive = this.positiveKeywords.some(kw => 
          sentence.toLowerCase().includes(kw)
        );
        const hasNegative = this.negativeKeywords.some(kw => 
          sentence.toLowerCase().includes(kw)
        );

        if (hasPositive && !hasNegative) {
          signals.push(sentence.trim().slice(0, 120));
          if (signals.length >= 4) break;
        }
      }
    }

    return signals.slice(0, 5);
  }

  private extractRiskFactors(text: string): string[] {
    const risks: string[] = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

    const riskPatterns = [
      /(?:headwind|challenge|pressure|uncertainty)/i,
      /(?:macro|economic)\s+(?:environment|conditions)/i,
      /supply\s+(?:chain|constraint)/i,
      /(?:regulatory|compliance)\s+(?:risk|concern)/i,
      /competitive\s+(?:pressure|landscape)/i,
      /foreign\s+(?:exchange|currency)/i,
      /inflation(?:ary)?/i,
      /recession/i,
      /missed?\s+(?:estimates|expectations)/i,
    ];

    for (const sentence of sentences) {
      for (const pattern of riskPatterns) {
        if (pattern.test(sentence)) {
          const cleaned = sentence.trim().slice(0, 120);
          if (!risks.includes(cleaned)) {
            risks.push(cleaned);
          }
          break;
        }
      }
    }

    if (risks.length === 0) {
      for (const sentence of sentences) {
        const hasNegative = this.negativeKeywords.some(kw => 
          sentence.toLowerCase().includes(kw)
        );
        const hasPositive = this.positiveKeywords.some(kw => 
          sentence.toLowerCase().includes(kw)
        );

        if (hasNegative && !hasPositive) {
          risks.push(sentence.trim().slice(0, 120));
          if (risks.length >= 4) break;
        }
      }
    }

    return risks.slice(0, 5);
  }

  getKeywordAnalysis(text: string): Record<string, number> {
    const textLower = text.toLowerCase();
    const results: Record<string, number> = {};

    for (const [category, keywords] of Object.entries(this.financialKeywords)) {
      let count = 0;
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          count += matches.length;
        }
      }
      results[category] = count;
    }

    return results;
  }
}

export const sentimentService = new SentimentService();
