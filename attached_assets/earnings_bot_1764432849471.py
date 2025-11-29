"""
Earnings Analysis Bot - Main Module
A comprehensive bot for analyzing stock earnings, transcribing calls, and generating insights.

Tech Stack:
- Financial Data: yfinance, Financial Modeling Prep API
- NLP: OpenAI GPT / transformers
- Speech-to-Text: OpenAI Whisper
- Data Processing: pandas, numpy
"""

import json
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any
import os


@dataclass
class EarningsMetrics:
    """Core earnings metrics structure"""
    ticker: str
    period: str
    revenue: float
    net_income: float
    eps: float
    eps_estimate: Optional[float]
    revenue_estimate: Optional[float]
    gross_margin: float
    operating_margin: float
    net_margin: float
    yoy_revenue_growth: Optional[float]
    yoy_eps_growth: Optional[float]
    beat_eps: Optional[bool]
    beat_revenue: Optional[bool]
    
    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class SentimentResult:
    """Sentiment analysis result structure"""
    overall_score: float  # -1 to 1
    overall_label: str    # Bearish, Neutral, Bullish
    confidence: float
    key_phrases: List[str]
    risk_factors: List[str]
    positive_signals: List[str]


@dataclass
class EarningsReport:
    """Complete earnings report structure"""
    ticker: str
    company_name: str
    report_date: str
    metrics: EarningsMetrics
    sentiment: Optional[SentimentResult]
    summary: str
    key_highlights: List[str]
    guidance: Dict[str, Any]
    peer_comparison: Optional[Dict]


class DataFetcher:
    """
    Handles all data ingestion from various sources.
    Supports multiple APIs with fallback options.
    """
    
    def __init__(self, api_keys: Dict[str, str] = None):
        self.api_keys = api_keys or {}
        self._init_clients()
    
    def _init_clients(self):
        """Initialize API clients"""
        # These would be actual API clients in production
        self.fmp_key = self.api_keys.get('FMP_API_KEY', os.getenv('FMP_API_KEY'))
        self.alpha_vantage_key = self.api_keys.get('ALPHA_VANTAGE_KEY', os.getenv('ALPHA_VANTAGE_KEY'))
    
    def get_income_statement(self, ticker: str, period: str = 'quarterly', limit: int = 4) -> List[Dict]:
        """
        Fetch income statement data.
        
        Args:
            ticker: Stock symbol
            period: 'quarterly' or 'annual'
            limit: Number of periods to fetch
        
        Returns:
            List of income statement dictionaries
        """
        try:
            import yfinance as yf
            stock = yf.Ticker(ticker)
            
            if period == 'quarterly':
                financials = stock.quarterly_income_stmt
            else:
                financials = stock.income_stmt
            
            if financials is None or financials.empty:
                return []
            
            results = []
            for col in financials.columns[:limit]:
                data = financials[col].to_dict()
                data['period_ending'] = col.strftime('%Y-%m-%d') if hasattr(col, 'strftime') else str(col)
                results.append(data)
            
            return results
            
        except Exception as e:
            print(f"Error fetching income statement: {e}")
            return []
    
    def get_balance_sheet(self, ticker: str, period: str = 'quarterly') -> List[Dict]:
        """Fetch balance sheet data"""
        try:
            import yfinance as yf
            stock = yf.Ticker(ticker)
            
            if period == 'quarterly':
                balance = stock.quarterly_balance_sheet
            else:
                balance = stock.balance_sheet
            
            if balance is None or balance.empty:
                return []
            
            results = []
            for col in balance.columns[:4]:
                data = balance[col].to_dict()
                data['period_ending'] = col.strftime('%Y-%m-%d') if hasattr(col, 'strftime') else str(col)
                results.append(data)
            
            return results
            
        except Exception as e:
            print(f"Error fetching balance sheet: {e}")
            return []
    
    def get_cash_flow(self, ticker: str, period: str = 'quarterly') -> List[Dict]:
        """Fetch cash flow statement data"""
        try:
            import yfinance as yf
            stock = yf.Ticker(ticker)
            
            if period == 'quarterly':
                cash_flow = stock.quarterly_cashflow
            else:
                cash_flow = stock.cashflow
            
            if cash_flow is None or cash_flow.empty:
                return []
            
            results = []
            for col in cash_flow.columns[:4]:
                data = cash_flow[col].to_dict()
                data['period_ending'] = col.strftime('%Y-%m-%d') if hasattr(col, 'strftime') else str(col)
                results.append(data)
            
            return results
            
        except Exception as e:
            print(f"Error fetching cash flow: {e}")
            return []
    
    def get_stock_info(self, ticker: str) -> Dict:
        """Get general stock information"""
        try:
            import yfinance as yf
            stock = yf.Ticker(ticker)
            return stock.info
        except Exception as e:
            print(f"Error fetching stock info: {e}")
            return {}
    
    def get_analyst_estimates(self, ticker: str) -> Dict:
        """
        Fetch analyst estimates for earnings and revenue.
        Returns consensus estimates.
        """
        try:
            import yfinance as yf
            stock = yf.Ticker(ticker)
            
            # Get earnings estimates
            earnings_est = stock.earnings_estimate if hasattr(stock, 'earnings_estimate') else None
            revenue_est = stock.revenue_estimate if hasattr(stock, 'revenue_estimate') else None
            
            info = stock.info
            
            return {
                'eps_estimate': info.get('forwardEps'),
                'revenue_estimate': info.get('revenueEstimate'),
                'target_price': info.get('targetMeanPrice'),
                'recommendation': info.get('recommendationKey'),
                'number_of_analysts': info.get('numberOfAnalystOpinions'),
            }
            
        except Exception as e:
            print(f"Error fetching analyst estimates: {e}")
            return {}
    
    def get_earnings_history(self, ticker: str) -> List[Dict]:
        """Get historical earnings with beat/miss data"""
        try:
            import yfinance as yf
            stock = yf.Ticker(ticker)
            
            earnings = stock.earnings_history
            if earnings is None or earnings.empty:
                return []
            
            return earnings.to_dict('records')
            
        except Exception as e:
            print(f"Error fetching earnings history: {e}")
            return []


class MetricsCalculator:
    """
    Calculates financial metrics and ratios from raw data.
    """
    
    @staticmethod
    def calculate_margins(income_data: Dict) -> Dict[str, float]:
        """Calculate profit margins"""
        revenue = income_data.get('Total Revenue') or income_data.get('TotalRevenue', 0)
        gross_profit = income_data.get('Gross Profit') or income_data.get('GrossProfit', 0)
        operating_income = income_data.get('Operating Income') or income_data.get('OperatingIncome', 0)
        net_income = income_data.get('Net Income') or income_data.get('NetIncome', 0)
        
        if not revenue or revenue == 0:
            return {'gross_margin': 0, 'operating_margin': 0, 'net_margin': 0}
        
        return {
            'gross_margin': round((gross_profit / revenue) * 100, 2) if gross_profit else 0,
            'operating_margin': round((operating_income / revenue) * 100, 2) if operating_income else 0,
            'net_margin': round((net_income / revenue) * 100, 2) if net_income else 0,
        }
    
    @staticmethod
    def calculate_growth(current: float, previous: float) -> Optional[float]:
        """Calculate percentage growth"""
        if not previous or previous == 0:
            return None
        return round(((current - previous) / abs(previous)) * 100, 2)
    
    @staticmethod
    def calculate_eps(net_income: float, shares_outstanding: float) -> float:
        """Calculate earnings per share"""
        if not shares_outstanding or shares_outstanding == 0:
            return 0
        return round(net_income / shares_outstanding, 2)
    
    @staticmethod
    def calculate_pe_ratio(price: float, eps: float) -> Optional[float]:
        """Calculate Price-to-Earnings ratio"""
        if not eps or eps == 0:
            return None
        return round(price / eps, 2)
    
    @staticmethod
    def calculate_beat_miss(actual: float, estimate: float) -> Dict:
        """Determine if earnings beat or missed estimates"""
        if estimate is None or estimate == 0:
            return {'beat': None, 'difference': None, 'percent_diff': None}
        
        difference = actual - estimate
        percent_diff = round((difference / abs(estimate)) * 100, 2)
        
        return {
            'beat': difference > 0,
            'difference': round(difference, 4),
            'percent_diff': percent_diff
        }
    
    @staticmethod
    def calculate_valuation_metrics(stock_info: Dict) -> Dict:
        """Calculate valuation metrics"""
        return {
            'pe_ratio': stock_info.get('trailingPE'),
            'forward_pe': stock_info.get('forwardPE'),
            'peg_ratio': stock_info.get('pegRatio'),
            'price_to_book': stock_info.get('priceToBook'),
            'price_to_sales': stock_info.get('priceToSalesTrailing12Months'),
            'ev_to_ebitda': stock_info.get('enterpriseToEbitda'),
            'market_cap': stock_info.get('marketCap'),
            'enterprise_value': stock_info.get('enterpriseValue'),
        }


class TranscriptAnalyzer:
    """
    Handles earnings call transcription and NLP analysis.
    Uses OpenAI Whisper for transcription and GPT for analysis.
    """
    
    def __init__(self, openai_api_key: str = None):
        self.api_key = openai_api_key or os.getenv('OPENAI_API_KEY')
        self._sentiment_keywords = {
            'positive': [
                'strong', 'growth', 'exceeded', 'beat', 'momentum', 'confident',
                'optimistic', 'record', 'accelerating', 'outperformed', 'tailwind',
                'robust', 'healthy', 'improved', 'expanding', 'innovation'
            ],
            'negative': [
                'challenging', 'headwind', 'decline', 'miss', 'weakness', 'pressure',
                'uncertain', 'slowdown', 'difficult', 'disappointing', 'concern',
                'risk', 'competitive', 'macro', 'inflationary', 'cautious'
            ]
        }
    
    def transcribe_audio(self, audio_path: str) -> str:
        """
        Transcribe earnings call audio using Whisper.
        
        Args:
            audio_path: Path to audio file or URL
            
        Returns:
            Transcribed text
        """
        try:
            import openai
            
            client = openai.OpenAI(api_key=self.api_key)
            
            with open(audio_path, 'rb') as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    response_format="text"
                )
            
            return transcript
            
        except Exception as e:
            print(f"Error transcribing audio: {e}")
            return ""
    
    def analyze_sentiment(self, text: str) -> SentimentResult:
        """
        Analyze sentiment of earnings call transcript.
        Uses keyword-based analysis with optional LLM enhancement.
        """
        text_lower = text.lower()
        
        # Count sentiment keywords
        positive_count = sum(1 for word in self._sentiment_keywords['positive'] 
                           if word in text_lower)
        negative_count = sum(1 for word in self._sentiment_keywords['negative'] 
                           if word in text_lower)
        
        total = positive_count + negative_count
        if total == 0:
            score = 0
        else:
            score = (positive_count - negative_count) / total
        
        # Determine label
        if score > 0.2:
            label = "Bullish"
        elif score < -0.2:
            label = "Bearish"
        else:
            label = "Neutral"
        
        # Extract key phrases
        key_phrases = self._extract_key_phrases(text)
        
        # Identify risk factors and positive signals
        risk_factors = [word for word in self._sentiment_keywords['negative'] 
                       if word in text_lower]
        positive_signals = [word for word in self._sentiment_keywords['positive'] 
                          if word in text_lower]
        
        return SentimentResult(
            overall_score=round(score, 2),
            overall_label=label,
            confidence=min(total / 20, 1.0),  # Confidence based on keyword density
            key_phrases=key_phrases[:10],
            risk_factors=list(set(risk_factors))[:5],
            positive_signals=list(set(positive_signals))[:5]
        )
    
    def _extract_key_phrases(self, text: str) -> List[str]:
        """Extract important phrases from transcript"""
        # Simple extraction - in production, use NER or keyphrase extraction models
        important_patterns = [
            'guidance', 'outlook', 'expect', 'forecast', 'target',
            'margin', 'growth', 'revenue', 'earnings', 'profit'
        ]
        
        sentences = text.split('.')
        key_phrases = []
        
        for sentence in sentences:
            sentence_lower = sentence.lower()
            if any(pattern in sentence_lower for pattern in important_patterns):
                cleaned = sentence.strip()
                if len(cleaned) > 20 and len(cleaned) < 200:
                    key_phrases.append(cleaned)
        
        return key_phrases
    
    def summarize_transcript(self, transcript: str, max_length: int = 500) -> str:
        """
        Generate a summary of the earnings call transcript.
        Uses OpenAI GPT for summarization.
        """
        try:
            import openai
            
            client = openai.OpenAI(api_key=self.api_key)
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": """You are a financial analyst summarizing earnings calls.
                        Extract and summarize:
                        1. Key financial highlights
                        2. Management's guidance and outlook
                        3. Major risks or challenges mentioned
                        4. Growth drivers and opportunities
                        5. Notable Q&A highlights
                        Be concise and focus on actionable insights."""
                    },
                    {
                        "role": "user",
                        "content": f"Summarize this earnings call transcript:\n\n{transcript[:8000]}"
                    }
                ],
                max_tokens=max_length
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            print(f"Error summarizing transcript: {e}")
            return self._fallback_summary(transcript)
    
    def _fallback_summary(self, transcript: str) -> str:
        """Simple extractive summary when API is unavailable"""
        sentences = transcript.split('.')
        important_sentences = []
        
        keywords = ['revenue', 'earnings', 'growth', 'guidance', 'outlook', 'expect']
        
        for sentence in sentences:
            if any(keyword in sentence.lower() for keyword in keywords):
                important_sentences.append(sentence.strip())
        
        return '. '.join(important_sentences[:5]) + '.'
    
    def extract_guidance(self, transcript: str) -> Dict[str, Any]:
        """Extract forward guidance from transcript"""
        try:
            import openai
            
            client = openai.OpenAI(api_key=self.api_key)
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": """Extract forward guidance from this earnings call.
                        Return a JSON object with:
                        - revenue_guidance: expected revenue range or growth
                        - eps_guidance: expected EPS range
                        - margin_guidance: expected margin changes
                        - key_initiatives: major planned initiatives
                        - risks_mentioned: key risks highlighted
                        Use null for any unavailable data."""
                    },
                    {
                        "role": "user",
                        "content": transcript[:6000]
                    }
                ],
                response_format={"type": "json_object"}
            )
            
            return json.loads(response.choices[0].message.content)
            
        except Exception as e:
            print(f"Error extracting guidance: {e}")
            return {}


class EarningsBot:
    """
    Main bot class that orchestrates all components.
    """
    
    def __init__(self, api_keys: Dict[str, str] = None):
        """
        Initialize the Earnings Bot.
        
        Args:
            api_keys: Dictionary of API keys
                - FMP_API_KEY: Financial Modeling Prep
                - ALPHA_VANTAGE_KEY: Alpha Vantage
                - OPENAI_API_KEY: OpenAI for NLP
        """
        self.api_keys = api_keys or {}
        self.data_fetcher = DataFetcher(api_keys)
        self.calculator = MetricsCalculator()
        self.analyzer = TranscriptAnalyzer(api_keys.get('OPENAI_API_KEY'))
    
    def analyze_earnings(self, ticker: str, include_transcript: bool = False,
                        transcript_path: str = None) -> EarningsReport:
        """
        Run complete earnings analysis for a ticker.
        
        Args:
            ticker: Stock symbol
            include_transcript: Whether to analyze earnings call
            transcript_path: Path to earnings call audio/transcript
            
        Returns:
            Complete EarningsReport object
        """
        print(f"Analyzing earnings for {ticker}...")
        
        # Fetch all data
        stock_info = self.data_fetcher.get_stock_info(ticker)
        income_statements = self.data_fetcher.get_income_statement(ticker)
        estimates = self.data_fetcher.get_analyst_estimates(ticker)
        
        if not income_statements:
            raise ValueError(f"No financial data available for {ticker}")
        
        # Calculate metrics from most recent quarter
        latest = income_statements[0]
        previous = income_statements[1] if len(income_statements) > 1 else None
        
        margins = self.calculator.calculate_margins(latest)
        
        # Get key values
        revenue = latest.get('Total Revenue') or latest.get('TotalRevenue', 0)
        net_income = latest.get('Net Income') or latest.get('NetIncome', 0)
        shares = stock_info.get('sharesOutstanding', 1)
        eps = self.calculator.calculate_eps(net_income, shares)
        
        # Calculate growth if previous period available
        yoy_revenue_growth = None
        yoy_eps_growth = None
        
        if len(income_statements) >= 5:  # Compare to same quarter last year
            yoy_data = income_statements[4]
            prev_revenue = yoy_data.get('Total Revenue') or yoy_data.get('TotalRevenue', 0)
            prev_net_income = yoy_data.get('Net Income') or yoy_data.get('NetIncome', 0)
            
            yoy_revenue_growth = self.calculator.calculate_growth(revenue, prev_revenue)
            prev_eps = self.calculator.calculate_eps(prev_net_income, shares)
            yoy_eps_growth = self.calculator.calculate_growth(eps, prev_eps)
        
        # Calculate beat/miss
        eps_estimate = estimates.get('eps_estimate')
        revenue_estimate = estimates.get('revenue_estimate')
        
        eps_result = self.calculator.calculate_beat_miss(eps, eps_estimate)
        revenue_result = self.calculator.calculate_beat_miss(revenue, revenue_estimate)
        
        # Build metrics object
        metrics = EarningsMetrics(
            ticker=ticker,
            period=latest.get('period_ending', 'Unknown'),
            revenue=revenue,
            net_income=net_income,
            eps=eps,
            eps_estimate=eps_estimate,
            revenue_estimate=revenue_estimate,
            gross_margin=margins['gross_margin'],
            operating_margin=margins['operating_margin'],
            net_margin=margins['net_margin'],
            yoy_revenue_growth=yoy_revenue_growth,
            yoy_eps_growth=yoy_eps_growth,
            beat_eps=eps_result['beat'],
            beat_revenue=revenue_result['beat']
        )
        
        # Analyze transcript if provided
        sentiment = None
        summary = ""
        guidance = {}
        
        if include_transcript and transcript_path:
            # Check if it's audio or text
            if transcript_path.endswith(('.mp3', '.wav', '.m4a')):
                transcript = self.analyzer.transcribe_audio(transcript_path)
            else:
                with open(transcript_path, 'r') as f:
                    transcript = f.read()
            
            sentiment = self.analyzer.analyze_sentiment(transcript)
            summary = self.analyzer.summarize_transcript(transcript)
            guidance = self.analyzer.extract_guidance(transcript)
        else:
            # Generate basic summary without transcript
            summary = self._generate_basic_summary(metrics, stock_info)
        
        # Generate key highlights
        highlights = self._generate_highlights(metrics, sentiment)
        
        return EarningsReport(
            ticker=ticker,
            company_name=stock_info.get('longName', ticker),
            report_date=datetime.now().strftime('%Y-%m-%d'),
            metrics=metrics,
            sentiment=sentiment,
            summary=summary,
            key_highlights=highlights,
            guidance=guidance,
            peer_comparison=None
        )
    
    def _generate_basic_summary(self, metrics: EarningsMetrics, stock_info: Dict) -> str:
        """Generate summary without transcript"""
        company = stock_info.get('longName', metrics.ticker)
        
        parts = [f"{company} reported quarterly earnings."]
        
        # Revenue
        if metrics.revenue:
            rev_str = f"${metrics.revenue/1e9:.2f}B" if metrics.revenue > 1e9 else f"${metrics.revenue/1e6:.2f}M"
            parts.append(f"Revenue: {rev_str}")
            if metrics.yoy_revenue_growth:
                direction = "up" if metrics.yoy_revenue_growth > 0 else "down"
                parts.append(f"({direction} {abs(metrics.yoy_revenue_growth):.1f}% YoY)")
        
        # EPS
        if metrics.eps:
            parts.append(f"EPS: ${metrics.eps:.2f}")
            if metrics.beat_eps is not None:
                result = "beat" if metrics.beat_eps else "missed"
                parts.append(f"({result} estimates)")
        
        # Margins
        if metrics.net_margin:
            parts.append(f"Net margin: {metrics.net_margin:.1f}%")
        
        return " ".join(parts)
    
    def _generate_highlights(self, metrics: EarningsMetrics, 
                            sentiment: Optional[SentimentResult]) -> List[str]:
        """Generate key highlights from analysis"""
        highlights = []
        
        # Beat/miss highlights
        if metrics.beat_eps:
            highlights.append("✓ EPS beat analyst estimates")
        elif metrics.beat_eps is False:
            highlights.append("✗ EPS missed analyst estimates")
        
        if metrics.beat_revenue:
            highlights.append("✓ Revenue beat analyst estimates")
        elif metrics.beat_revenue is False:
            highlights.append("✗ Revenue missed analyst estimates")
        
        # Growth highlights
        if metrics.yoy_revenue_growth:
            if metrics.yoy_revenue_growth > 10:
                highlights.append(f"📈 Strong revenue growth: {metrics.yoy_revenue_growth:.1f}% YoY")
            elif metrics.yoy_revenue_growth < -5:
                highlights.append(f"📉 Revenue decline: {metrics.yoy_revenue_growth:.1f}% YoY")
        
        # Margin highlights
        if metrics.net_margin > 20:
            highlights.append(f"💰 High profitability: {metrics.net_margin:.1f}% net margin")
        elif metrics.net_margin < 5 and metrics.net_margin > 0:
            highlights.append(f"⚠️ Thin margins: {metrics.net_margin:.1f}% net margin")
        
        # Sentiment highlights
        if sentiment:
            highlights.append(f"📊 Management tone: {sentiment.overall_label}")
            if sentiment.positive_signals:
                highlights.append(f"🟢 Positive signals: {', '.join(sentiment.positive_signals[:3])}")
            if sentiment.risk_factors:
                highlights.append(f"🔴 Risk factors: {', '.join(sentiment.risk_factors[:3])}")
        
        return highlights
    
    def compare_to_peers(self, ticker: str, peers: List[str]) -> Dict:
        """Compare earnings metrics to peer companies"""
        results = {'target': ticker, 'peers': {}, 'comparison': {}}
        
        # Get target metrics
        target_info = self.data_fetcher.get_stock_info(ticker)
        target_income = self.data_fetcher.get_income_statement(ticker)
        
        if target_income:
            target_margins = self.calculator.calculate_margins(target_income[0])
            results['target_metrics'] = {
                'pe_ratio': target_info.get('trailingPE'),
                'net_margin': target_margins['net_margin'],
                'revenue_growth': target_info.get('revenueGrowth'),
            }
        
        # Get peer metrics
        for peer in peers:
            try:
                peer_info = self.data_fetcher.get_stock_info(peer)
                peer_income = self.data_fetcher.get_income_statement(peer)
                
                if peer_income:
                    peer_margins = self.calculator.calculate_margins(peer_income[0])
                    results['peers'][peer] = {
                        'pe_ratio': peer_info.get('trailingPE'),
                        'net_margin': peer_margins['net_margin'],
                        'revenue_growth': peer_info.get('revenueGrowth'),
                    }
            except Exception as e:
                print(f"Error fetching peer {peer}: {e}")
        
        return results
    
    def generate_report_json(self, report: EarningsReport) -> str:
        """Export report as JSON"""
        report_dict = {
            'ticker': report.ticker,
            'company_name': report.company_name,
            'report_date': report.report_date,
            'metrics': report.metrics.to_dict(),
            'sentiment': asdict(report.sentiment) if report.sentiment else None,
            'summary': report.summary,
            'key_highlights': report.key_highlights,
            'guidance': report.guidance,
            'peer_comparison': report.peer_comparison
        }
        return json.dumps(report_dict, indent=2, default=str)
    
    def generate_report_markdown(self, report: EarningsReport) -> str:
        """Export report as Markdown"""
        md = f"""# Earnings Report: {report.company_name} ({report.ticker})
**Report Date:** {report.report_date}

## Summary
{report.summary}

## Key Highlights
"""
        for highlight in report.key_highlights:
            md += f"- {highlight}\n"
        
        md += f"""
## Financial Metrics

| Metric | Value |
|--------|-------|
| Revenue | ${report.metrics.revenue/1e9:.2f}B |
| Net Income | ${report.metrics.net_income/1e9:.2f}B |
| EPS | ${report.metrics.eps:.2f} |
| Gross Margin | {report.metrics.gross_margin:.1f}% |
| Operating Margin | {report.metrics.operating_margin:.1f}% |
| Net Margin | {report.metrics.net_margin:.1f}% |
| YoY Revenue Growth | {report.metrics.yoy_revenue_growth or 'N/A'}% |
| YoY EPS Growth | {report.metrics.yoy_eps_growth or 'N/A'}% |

## Beat/Miss Analysis
- **EPS:** {'Beat ✓' if report.metrics.beat_eps else 'Miss ✗' if report.metrics.beat_eps is False else 'N/A'}
- **Revenue:** {'Beat ✓' if report.metrics.beat_revenue else 'Miss ✗' if report.metrics.beat_revenue is False else 'N/A'}
"""
        
        if report.sentiment:
            md += f"""
## Sentiment Analysis
- **Overall Tone:** {report.sentiment.overall_label} (Score: {report.sentiment.overall_score})
- **Confidence:** {report.sentiment.confidence:.0%}
- **Positive Signals:** {', '.join(report.sentiment.positive_signals) or 'None identified'}
- **Risk Factors:** {', '.join(report.sentiment.risk_factors) or 'None identified'}
"""
        
        if report.guidance:
            md += f"""
## Forward Guidance
```json
{json.dumps(report.guidance, indent=2)}
```
"""
        
        return md


# Utility functions for quick analysis
def quick_analyze(ticker: str) -> Dict:
    """Quick analysis without API keys - uses free yfinance data"""
    bot = EarningsBot()
    report = bot.analyze_earnings(ticker, include_transcript=False)
    return json.loads(bot.generate_report_json(report))


def format_currency(value: float) -> str:
    """Format large numbers as currency"""
    if value >= 1e12:
        return f"${value/1e12:.2f}T"
    elif value >= 1e9:
        return f"${value/1e9:.2f}B"
    elif value >= 1e6:
        return f"${value/1e6:.2f}M"
    else:
        return f"${value:,.2f}"


if __name__ == "__main__":
    # Example usage
    print("Earnings Bot - Example Usage")
    print("=" * 50)
    
    # Quick analysis of a stock
    ticker = "AAPL"
    
    try:
        bot = EarningsBot()
        report = bot.analyze_earnings(ticker)
        
        print(f"\n{report.company_name} ({report.ticker})")
        print("-" * 40)
        print(report.summary)
        print("\nKey Highlights:")
        for h in report.key_highlights:
            print(f"  {h}")
        
        # Export as markdown
        print("\n" + "=" * 50)
        print("Full Report (Markdown):")
        print(bot.generate_report_markdown(report))
        
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure yfinance is installed: pip install yfinance")
