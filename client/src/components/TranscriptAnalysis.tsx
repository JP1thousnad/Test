import { useState } from "react";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface KeyPhrase {
  phrase: string;
  count: number;
}

interface TranscriptAnalysisProps {
  transcript?: string;
  keyPhrases: KeyPhrase[];
  riskFactors: string[];
  positiveSignals: string[];
  onAnalyze?: (text: string) => void;
}

export function TranscriptAnalysis({
  transcript = "",
  keyPhrases,
  riskFactors,
  positiveSignals,
  onAnalyze,
}: TranscriptAnalysisProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputText, setInputText] = useState(transcript);
  const [showInput, setShowInput] = useState(!transcript);

  const handleAnalyze = () => {
    if (inputText.trim() && onAnalyze) {
      onAnalyze(inputText.trim());
      setShowInput(false);
    }
  };

  return (
    <Card data-testid="transcript-analysis">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-base">Transcript Analysis</CardTitle>
        </div>
        {!showInput && transcript && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            data-testid="button-toggle-transcript"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" /> Hide
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" /> Show
              </>
            )}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {showInput ? (
          <div className="space-y-3">
            <Textarea
              placeholder="Paste earnings call transcript here for analysis..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-32 font-mono text-sm"
              data-testid="textarea-transcript"
            />
            <Button
              onClick={handleAnalyze}
              disabled={!inputText.trim()}
              data-testid="button-analyze-transcript"
            >
              Analyze Transcript
            </Button>
          </div>
        ) : (
          <>
            {isExpanded && transcript && (
              <div className="p-3 bg-muted rounded-md max-h-48 overflow-y-auto">
                <p className="text-sm whitespace-pre-wrap">{transcript}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Key Phrases</h4>
                <div className="flex flex-wrap gap-2">
                  {keyPhrases.slice(0, 8).map((phrase, idx) => (
                    <Badge key={idx} variant="secondary" className="font-mono text-xs">
                      {phrase.phrase} ({phrase.count})
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2 text-emerald-600 dark:text-emerald-400">
                    Positive Signals
                  </h4>
                  <ul className="space-y-1">
                    {positiveSignals.slice(0, 5).map((signal, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-emerald-600 dark:text-emerald-400">+</span>
                        {signal}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2 text-red-600 dark:text-red-400">
                    Risk Factors
                  </h4>
                  <ul className="space-y-1">
                    {riskFactors.slice(0, 5).map((risk, idx) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-red-600 dark:text-red-400">!</span>
                        {risk}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInput(true)}
                data-testid="button-new-transcript"
              >
                Analyze New Transcript
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
