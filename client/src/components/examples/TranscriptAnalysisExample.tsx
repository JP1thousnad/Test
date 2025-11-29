import { TranscriptAnalysis } from "../TranscriptAnalysis";

export default function TranscriptAnalysisExample() {
  return (
    <div className="p-4">
      <TranscriptAnalysis
        transcript="We delivered exceptional results this quarter with revenue of $48.5 billion, up 22% year-over-year..."
        keyPhrases={[
          { phrase: "revenue growth", count: 8 },
          { phrase: "operating margin", count: 5 },
          { phrase: "strong demand", count: 4 },
          { phrase: "free cash flow", count: 3 },
          { phrase: "guidance", count: 6 },
        ]}
        positiveSignals={[
          "Strong revenue growth of 22% YoY",
          "Beat EPS estimates by 6.6%",
          "Gross margin expanded 180 bps",
          "Record free cash flow of $12.4B",
        ]}
        riskFactors={[
          "Currency headwinds mentioned",
          "Macro uncertainty acknowledged",
          "Competitive pressures in market",
        ]}
        onAnalyze={(text) => console.log("Analyzing:", text.substring(0, 50))}
      />
    </div>
  );
}
