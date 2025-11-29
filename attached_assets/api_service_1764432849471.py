"""
Earnings Bot - API Service
REST API endpoints for the earnings analysis bot.
Uses FastAPI for high-performance async API.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import asyncio
import json

# Import our earnings bot
from earnings_bot import EarningsBot, EarningsReport, quick_analyze

app = FastAPI(
    title="Earnings Analysis Bot API",
    description="API for analyzing stock earnings, transcribing calls, and generating insights",
    version="1.0.0"
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize bot (can be configured with API keys via environment)
bot = EarningsBot()


# Request/Response Models
class AnalyzeRequest(BaseModel):
    ticker: str = Field(..., description="Stock ticker symbol", example="AAPL")
    include_transcript: bool = Field(False, description="Include earnings call analysis")
    transcript_url: Optional[str] = Field(None, description="URL to earnings call audio")
    
class PeerComparisonRequest(BaseModel):
    ticker: str = Field(..., description="Target stock ticker")
    peers: List[str] = Field(..., description="List of peer tickers to compare")

class BatchAnalyzeRequest(BaseModel):
    tickers: List[str] = Field(..., description="List of tickers to analyze")

class EarningsResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]]
    error: Optional[str]
    timestamp: str

class MetricsResponse(BaseModel):
    ticker: str
    period: str
    revenue: float
    net_income: float
    eps: float
    gross_margin: float
    operating_margin: float
    net_margin: float
    yoy_revenue_growth: Optional[float]
    yoy_eps_growth: Optional[float]
    beat_eps: Optional[bool]
    beat_revenue: Optional[bool]


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


# Main analysis endpoints
@app.post("/analyze", response_model=EarningsResponse)
async def analyze_earnings(request: AnalyzeRequest):
    """
    Analyze earnings for a single stock.
    
    Returns comprehensive earnings analysis including:
    - Financial metrics
    - Beat/miss analysis
    - YoY growth calculations
    - Optional sentiment analysis (if transcript provided)
    """
    try:
        report = bot.analyze_earnings(
            ticker=request.ticker.upper(),
            include_transcript=request.include_transcript,
            transcript_path=request.transcript_url
        )
        
        return EarningsResponse(
            success=True,
            data=json.loads(bot.generate_report_json(report)),
            error=None,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        return EarningsResponse(
            success=False,
            data=None,
            error=str(e),
            timestamp=datetime.now().isoformat()
        )


@app.get("/analyze/{ticker}")
async def analyze_ticker(
    ticker: str,
    format: str = Query("json", description="Response format: json or markdown")
):
    """
    Quick analysis endpoint for a single ticker.
    """
    try:
        report = bot.analyze_earnings(ticker.upper())
        
        if format == "markdown":
            return JSONResponse(
                content={
                    "success": True,
                    "format": "markdown",
                    "content": bot.generate_report_markdown(report)
                }
            )
        
        return {
            "success": True,
            "data": json.loads(bot.generate_report_json(report)),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/metrics/{ticker}", response_model=MetricsResponse)
async def get_metrics(ticker: str):
    """
    Get just the financial metrics for a ticker.
    Lightweight endpoint for quick data retrieval.
    """
    try:
        report = bot.analyze_earnings(ticker.upper())
        return MetricsResponse(**report.metrics.to_dict())
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/compare")
async def compare_peers(request: PeerComparisonRequest):
    """
    Compare a stock's earnings metrics to its peers.
    """
    try:
        comparison = bot.compare_to_peers(
            ticker=request.ticker.upper(),
            peers=[p.upper() for p in request.peers]
        )
        
        return {
            "success": True,
            "data": comparison,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/batch")
async def batch_analyze(request: BatchAnalyzeRequest, background_tasks: BackgroundTasks):
    """
    Analyze multiple tickers in batch.
    Returns immediately with job ID for async processing.
    """
    job_id = f"batch_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    # In production, this would queue the job
    results = {}
    for ticker in request.tickers[:10]:  # Limit to 10 tickers
        try:
            report = bot.analyze_earnings(ticker.upper())
            results[ticker] = json.loads(bot.generate_report_json(report))
        except Exception as e:
            results[ticker] = {"error": str(e)}
    
    return {
        "success": True,
        "job_id": job_id,
        "results": results,
        "timestamp": datetime.now().isoformat()
    }


# Data endpoints
@app.get("/stock/{ticker}/info")
async def get_stock_info(ticker: str):
    """Get general stock information"""
    try:
        info = bot.data_fetcher.get_stock_info(ticker.upper())
        
        # Return relevant fields
        return {
            "ticker": ticker.upper(),
            "name": info.get("longName"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "market_cap": info.get("marketCap"),
            "current_price": info.get("currentPrice"),
            "pe_ratio": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "dividend_yield": info.get("dividendYield"),
            "52_week_high": info.get("fiftyTwoWeekHigh"),
            "52_week_low": info.get("fiftyTwoWeekLow"),
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/stock/{ticker}/financials")
async def get_financials(
    ticker: str,
    period: str = Query("quarterly", description="quarterly or annual")
):
    """Get detailed financial statements"""
    try:
        income = bot.data_fetcher.get_income_statement(ticker.upper(), period)
        balance = bot.data_fetcher.get_balance_sheet(ticker.upper(), period)
        cash_flow = bot.data_fetcher.get_cash_flow(ticker.upper(), period)
        
        return {
            "ticker": ticker.upper(),
            "period": period,
            "income_statement": income,
            "balance_sheet": balance,
            "cash_flow": cash_flow
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/stock/{ticker}/earnings-history")
async def get_earnings_history(ticker: str):
    """Get historical earnings with beat/miss data"""
    try:
        history = bot.data_fetcher.get_earnings_history(ticker.upper())
        
        return {
            "ticker": ticker.upper(),
            "earnings_history": history
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/stock/{ticker}/estimates")
async def get_estimates(ticker: str):
    """Get analyst estimates"""
    try:
        estimates = bot.data_fetcher.get_analyst_estimates(ticker.upper())
        
        return {
            "ticker": ticker.upper(),
            "estimates": estimates
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Transcript analysis endpoints
@app.post("/transcript/analyze")
async def analyze_transcript(transcript: str = Query(..., description="Earnings call transcript text")):
    """
    Analyze an earnings call transcript for sentiment and key insights.
    """
    try:
        sentiment = bot.analyzer.analyze_sentiment(transcript)
        summary = bot.analyzer.summarize_transcript(transcript)
        guidance = bot.analyzer.extract_guidance(transcript)
        
        return {
            "success": True,
            "sentiment": {
                "score": sentiment.overall_score,
                "label": sentiment.overall_label,
                "confidence": sentiment.confidence,
                "positive_signals": sentiment.positive_signals,
                "risk_factors": sentiment.risk_factors,
                "key_phrases": sentiment.key_phrases
            },
            "summary": summary,
            "guidance": guidance
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Watchlist and alerts (placeholder for production implementation)
@app.post("/watchlist/add")
async def add_to_watchlist(ticker: str):
    """Add a ticker to earnings watchlist"""
    # In production, this would save to a database
    return {
        "success": True,
        "message": f"{ticker.upper()} added to watchlist",
        "note": "Watchlist persistence requires database integration"
    }


@app.get("/upcoming-earnings")
async def get_upcoming_earnings(days: int = Query(7, description="Days to look ahead")):
    """
    Get upcoming earnings releases.
    Note: Requires external calendar API in production.
    """
    return {
        "success": True,
        "note": "Requires earnings calendar API integration (e.g., Earnings Whispers, Zacks)",
        "days_ahead": days
    }


# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "timestamp": datetime.now().isoformat()
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": str(exc),
            "timestamp": datetime.now().isoformat()
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
