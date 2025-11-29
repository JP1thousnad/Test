#!/usr/bin/env python3
"""
Earnings Bot - Example Usage Script
Demonstrates all major features of the earnings analysis bot.
"""

import json
import os
from datetime import datetime


def print_header(title: str):
    """Print formatted section header"""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def demo_basic_analysis():
    """Demo: Basic earnings analysis"""
    print_header("DEMO 1: Basic Earnings Analysis")
    
    from earnings_bot import EarningsBot, quick_analyze
    
    # Method 1: Quick analysis
    print("\n📊 Quick Analysis (AAPL):")
    result = quick_analyze("AAPL")
    
    print(f"  Company: {result.get('company_name')}")
    print(f"  Revenue: ${result['metrics']['revenue']/1e9:.2f}B")
    print(f"  EPS: ${result['metrics']['eps']:.2f}")
    print(f"  Net Margin: {result['metrics']['net_margin']:.1f}%")
    
    # Method 2: Full bot analysis
    print("\n📊 Full Bot Analysis (MSFT):")
    bot = EarningsBot()
    report = bot.analyze_earnings("MSFT")
    
    print(f"\n  {report.company_name}")
    print(f"  {'-' * 40}")
    print(f"  {report.summary}")
    print(f"\n  Key Highlights:")
    for h in report.key_highlights[:5]:
        print(f"    • {h}")


def demo_peer_comparison():
    """Demo: Peer comparison"""
    print_header("DEMO 2: Peer Comparison")
    
    from earnings_bot import EarningsBot
    
    bot = EarningsBot()
    
    print("\n📊 Comparing NVDA to peers (AMD, INTC)...")
    comparison = bot.compare_to_peers("NVDA", ["AMD", "INTC"])
    
    print(f"\n  Target: {comparison['target']}")
    print(f"  Target Metrics: {comparison.get('target_metrics', {})}")
    print(f"\n  Peer Metrics:")
    for peer, metrics in comparison.get('peers', {}).items():
        print(f"    {peer}: {metrics}")


def demo_nlp_analysis():
    """Demo: NLP transcript analysis"""
    print_header("DEMO 3: NLP Transcript Analysis")
    
    from nlp_module import NLPProcessor, NLPBackend
    
    # Sample transcript
    sample = """
    Good morning and thank you for joining our fourth quarter earnings call.
    
    We delivered exceptional results this quarter with revenue of $48.5 billion,
    up 22% year-over-year and ahead of our guidance. This strong performance
    was driven by robust demand across all our business segments.
    
    Gross margin expanded to 46.3%, up 180 basis points from last year,
    reflecting improved operational efficiency and favorable product mix.
    
    EPS came in at $4.18, beating analyst consensus of $3.92 by 6.6%.
    Free cash flow was $12.4 billion, up 35% year-over-year.
    
    Looking ahead to Q1, we expect revenue in the range of $49 to $51 billion.
    We see some headwinds from currency fluctuations but remain confident
    in our long-term growth trajectory and strategic initiatives.
    
    We're making significant investments in AI and machine learning,
    which we believe will be a major growth driver going forward.
    
    Now let me turn it over for questions.
    """
    
    processor = NLPProcessor(backend=NLPBackend.LOCAL)
    
    print("\n📝 Analyzing sample transcript...")
    results = processor.full_analysis(sample)
    
    print(f"\n  Word Count: {results['word_count']}")
    print(f"\n  Sentiment Analysis:")
    print(f"    Overall: {results['sentiment']['label']}")
    print(f"    Compound Score: {results['sentiment']['compound']}")
    print(f"    Positive: {results['sentiment']['positive']:.1%}")
    print(f"    Negative: {results['sentiment']['negative']:.1%}")
    
    print(f"\n  Keyword Analysis:")
    for category, count in sorted(results['keyword_analysis'].items(), 
                                   key=lambda x: x[1], reverse=True)[:5]:
        print(f"    {category}: {count}")
    
    print(f"\n  Financial Numbers Found:")
    for num in results['numbers_mentioned'][:5]:
        print(f"    • {num['value']} ({num['type']})")
    
    print(f"\n  Key Phrases:")
    for phrase, count in results['key_phrases'][:5]:
        print(f"    • {phrase} ({count}x)")


def demo_data_pipeline():
    """Demo: Data pipeline execution"""
    print_header("DEMO 4: Data Pipeline")
    
    from data_pipeline import create_daily_pipeline, DataStore
    
    # Create a simple pipeline
    watchlist = ["AAPL", "GOOGL"]
    
    print(f"\n📦 Creating pipeline for: {watchlist}")
    pipeline = create_daily_pipeline(watchlist)
    
    print(f"  Pipeline ID: {pipeline.dag_id}")
    print(f"  Tasks: {list(pipeline.tasks.keys())}")
    print(f"  Execution order: {pipeline._get_execution_order()}")
    
    # Initialize data store
    store = DataStore(":memory:")  # In-memory for demo
    print(f"\n  Data store initialized")


def demo_report_generation():
    """Demo: Report generation in multiple formats"""
    print_header("DEMO 5: Report Generation")
    
    from earnings_bot import EarningsBot
    
    bot = EarningsBot()
    
    print("\n📄 Generating reports for AAPL...")
    report = bot.analyze_earnings("AAPL")
    
    # JSON format
    json_report = bot.generate_report_json(report)
    print(f"\n  JSON Report Preview:")
    print(f"  {json_report[:300]}...")
    
    # Markdown format
    md_report = bot.generate_report_markdown(report)
    print(f"\n  Markdown Report Preview:")
    print(f"  {md_report[:500]}...")
    
    # Save to files
    with open("sample_report.json", "w") as f:
        f.write(json_report)
    print(f"\n  ✓ Saved: sample_report.json")
    
    with open("sample_report.md", "w") as f:
        f.write(md_report)
    print(f"  ✓ Saved: sample_report.md")


def demo_api_endpoints():
    """Demo: API endpoint structure"""
    print_header("DEMO 6: API Endpoints Reference")
    
    endpoints = [
        ("GET", "/health", "Health check"),
        ("POST", "/analyze", "Full earnings analysis"),
        ("GET", "/analyze/{ticker}", "Quick analysis by ticker"),
        ("GET", "/metrics/{ticker}", "Get financial metrics only"),
        ("POST", "/compare", "Compare to peer companies"),
        ("POST", "/batch", "Batch analyze multiple tickers"),
        ("GET", "/stock/{ticker}/info", "General stock information"),
        ("GET", "/stock/{ticker}/financials", "Detailed financial statements"),
        ("GET", "/stock/{ticker}/earnings-history", "Historical earnings"),
        ("GET", "/stock/{ticker}/estimates", "Analyst estimates"),
        ("POST", "/transcript/analyze", "Analyze transcript text"),
    ]
    
    print("\n📡 Available API Endpoints:")
    print(f"  {'Method':<8} {'Endpoint':<35} {'Description'}")
    print(f"  {'-'*8} {'-'*35} {'-'*30}")
    for method, endpoint, desc in endpoints:
        print(f"  {method:<8} {endpoint:<35} {desc}")
    
    print("\n  To start the API server:")
    print("    uvicorn api_service:app --reload --port 8000")
    print("\n  API docs available at:")
    print("    http://localhost:8000/docs")


def demo_configuration():
    """Demo: Configuration options"""
    print_header("DEMO 7: Configuration")
    
    print("\n⚙️  Environment Variables:")
    env_vars = [
        ("OPENAI_API_KEY", "OpenAI API key for NLP features"),
        ("FMP_API_KEY", "Financial Modeling Prep API key"),
        ("ALPHA_VANTAGE_KEY", "Alpha Vantage API key"),
    ]
    
    for var, desc in env_vars:
        value = os.getenv(var)
        status = "✓ Set" if value else "✗ Not set"
        print(f"  {var:<25} {status:<12} {desc}")
    
    print("\n📁 Data Sources Priority:")
    sources = [
        ("1. yfinance", "Free, no API key required", "Primary"),
        ("2. Financial Modeling Prep", "Requires API key", "Enhanced data"),
        ("3. Alpha Vantage", "Requires API key", "Alternative"),
        ("4. SEC EDGAR", "Free, official filings", "10-K/10-Q"),
    ]
    
    for source, auth, use in sources:
        print(f"  {source:<25} {auth:<25} {use}")


def run_all_demos():
    """Run all demonstration functions"""
    print("\n" + "🤖 " * 20)
    print("     EARNINGS ANALYSIS BOT - DEMO")
    print("🤖 " * 20)
    print(f"\nTimestamp: {datetime.now().isoformat()}")
    
    demos = [
        ("Basic Analysis", demo_basic_analysis),
        ("Peer Comparison", demo_peer_comparison),
        ("NLP Analysis", demo_nlp_analysis),
        ("Data Pipeline", demo_data_pipeline),
        ("Report Generation", demo_report_generation),
        ("API Endpoints", demo_api_endpoints),
        ("Configuration", demo_configuration),
    ]
    
    for name, demo_func in demos:
        try:
            demo_func()
        except Exception as e:
            print(f"\n⚠️  Demo '{name}' error: {e}")
            print("   (This may be due to missing dependencies or API keys)")
    
    print_header("DEMO COMPLETE")
    print("\n✅ All demos completed!")
    print("\nNext steps:")
    print("  1. Install dependencies: pip install -r requirements.txt")
    print("  2. Set up API keys in environment variables")
    print("  3. Run the API: uvicorn api_service:app --reload")
    print("  4. Visit http://localhost:8000/docs for interactive API docs")


# Quick start functions for common use cases
def analyze_stock(ticker: str) -> dict:
    """Quick function to analyze a single stock"""
    from earnings_bot import quick_analyze
    return quick_analyze(ticker)


def compare_stocks(target: str, peers: list) -> dict:
    """Quick function to compare stocks"""
    from earnings_bot import EarningsBot
    bot = EarningsBot()
    return bot.compare_to_peers(target, peers)


def analyze_text(transcript: str) -> dict:
    """Quick function to analyze transcript text"""
    from nlp_module import NLPProcessor, NLPBackend
    processor = NLPProcessor(backend=NLPBackend.LOCAL)
    return processor.full_analysis(transcript)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        # Quick analysis mode
        ticker = sys.argv[1].upper()
        print(f"Quick analysis for {ticker}...")
        try:
            result = analyze_stock(ticker)
            print(json.dumps(result, indent=2, default=str))
        except Exception as e:
            print(f"Error: {e}")
    else:
        # Run full demo
        run_all_demos()
