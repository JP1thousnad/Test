"""
Earnings Bot - NLP Module
Advanced natural language processing for earnings call analysis.
Supports multiple NLP backends: OpenAI, Hugging Face, and local models.
"""

import re
import json
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
from collections import Counter
import os


class NLPBackend(Enum):
    OPENAI = "openai"
    HUGGINGFACE = "huggingface"
    LOCAL = "local"


@dataclass
class Entity:
    """Named entity extracted from text"""
    text: str
    label: str  # PERSON, ORG, MONEY, PERCENT, DATE, PRODUCT
    start: int
    end: int
    confidence: float = 1.0


@dataclass
class SentimentScore:
    """Detailed sentiment analysis result"""
    positive: float
    negative: float
    neutral: float
    compound: float  # Overall score -1 to 1
    label: str  # Bullish, Bearish, Neutral


@dataclass
class TopicCluster:
    """Topic cluster from transcript"""
    topic: str
    keywords: List[str]
    sentences: List[str]
    relevance_score: float


class TextPreprocessor:
    """
    Text preprocessing utilities for earnings transcripts.
    """
    
    @staticmethod
    def clean_transcript(text: str) -> str:
        """Clean and normalize transcript text"""
        # Remove excessive whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove speaker labels (common in transcripts)
        text = re.sub(r'^[A-Z][a-z]+ [A-Z][a-z]+:', '', text, flags=re.MULTILINE)
        
        # Remove timestamps
        text = re.sub(r'\d{1,2}:\d{2}(:\d{2})?', '', text)
        
        # Remove special characters but keep punctuation
        text = re.sub(r'[^\w\s.,;:!?\'\"$%()-]', '', text)
        
        return text.strip()
    
    @staticmethod
    def segment_transcript(text: str) -> Dict[str, str]:
        """
        Segment transcript into logical sections.
        Returns dict with: opening, financials, guidance, qa
        """
        sections = {
            'opening': '',
            'financials': '',
            'guidance': '',
            'qa': ''
        }
        
        text_lower = text.lower()
        
        # Find Q&A section
        qa_markers = ['question-and-answer', 'q&a', 'questions and answers', 'operator:']
        qa_start = len(text)
        for marker in qa_markers:
            pos = text_lower.find(marker)
            if pos != -1 and pos < qa_start:
                qa_start = pos
        
        if qa_start < len(text):
            sections['qa'] = text[qa_start:]
            text = text[:qa_start]
        
        # Find guidance section
        guidance_markers = ['outlook', 'guidance', 'looking ahead', 'expectations']
        guidance_start = len(text)
        for marker in guidance_markers:
            pos = text_lower.find(marker)
            if pos != -1 and pos > len(text) * 0.5 and pos < guidance_start:
                guidance_start = pos
        
        if guidance_start < len(text):
            sections['guidance'] = text[guidance_start:]
            text = text[:guidance_start]
        
        # Split remaining into opening and financials
        mid_point = len(text) // 3
        sections['opening'] = text[:mid_point]
        sections['financials'] = text[mid_point:]
        
        return sections
    
    @staticmethod
    def extract_sentences(text: str) -> List[str]:
        """Extract sentences from text"""
        # Simple sentence tokenization
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if len(s.strip()) > 10]
    
    @staticmethod
    def extract_numbers(text: str) -> List[Dict]:
        """Extract financial numbers and their context"""
        patterns = [
            (r'\$[\d,]+(?:\.\d+)?\s*(?:million|billion|M|B)?', 'currency'),
            (r'[\d,]+(?:\.\d+)?%', 'percentage'),
            (r'[\d,]+(?:\.\d+)?\s*(?:million|billion|M|B)', 'amount'),
        ]
        
        results = []
        for pattern, num_type in patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                # Get surrounding context
                start = max(0, match.start() - 50)
                end = min(len(text), match.end() + 50)
                context = text[start:end]
                
                results.append({
                    'value': match.group(),
                    'type': num_type,
                    'context': context.strip(),
                    'position': match.start()
                })
        
        return results


class KeywordAnalyzer:
    """
    Keyword-based analysis for earnings calls.
    Fast, no external dependencies.
    """
    
    def __init__(self):
        self.financial_keywords = {
            'revenue': ['revenue', 'sales', 'top line', 'top-line'],
            'profit': ['profit', 'earnings', 'income', 'bottom line', 'bottom-line'],
            'margin': ['margin', 'gross margin', 'operating margin', 'net margin'],
            'growth': ['growth', 'increase', 'grew', 'expanded', 'accelerate'],
            'decline': ['decline', 'decrease', 'fell', 'dropped', 'contracted'],
            'guidance': ['guidance', 'outlook', 'forecast', 'expect', 'anticipate'],
            'cost': ['cost', 'expense', 'spending', 'investment'],
            'debt': ['debt', 'leverage', 'borrowing', 'credit'],
            'cash': ['cash', 'liquidity', 'cash flow', 'free cash flow'],
            'dividend': ['dividend', 'buyback', 'repurchase', 'capital return'],
        }
        
        self.sentiment_lexicon = {
            'positive': [
                'strong', 'solid', 'robust', 'excellent', 'outstanding',
                'record', 'growth', 'exceeded', 'beat', 'outperformed',
                'confident', 'optimistic', 'momentum', 'accelerating',
                'improved', 'healthy', 'resilient', 'innovation', 'opportunity'
            ],
            'negative': [
                'weak', 'challenging', 'difficult', 'disappointing', 'miss',
                'decline', 'pressure', 'headwind', 'concern', 'uncertainty',
                'risk', 'slowdown', 'cautious', 'conservative', 'volatile',
                'macro', 'inflationary', 'competitive', 'disruption'
            ]
        }
    
    def analyze_keywords(self, text: str) -> Dict[str, int]:
        """Count occurrences of financial keywords"""
        text_lower = text.lower()
        results = {}
        
        for category, keywords in self.financial_keywords.items():
            count = sum(text_lower.count(kw) for kw in keywords)
            results[category] = count
        
        return results
    
    def calculate_sentiment(self, text: str) -> SentimentScore:
        """Calculate sentiment using keyword lexicon"""
        text_lower = text.lower()
        words = text_lower.split()
        
        pos_count = sum(1 for word in words if word in self.sentiment_lexicon['positive'])
        neg_count = sum(1 for word in words if word in self.sentiment_lexicon['negative'])
        total = pos_count + neg_count
        
        if total == 0:
            return SentimentScore(
                positive=0.33,
                negative=0.33,
                neutral=0.34,
                compound=0,
                label="Neutral"
            )
        
        positive = pos_count / total
        negative = neg_count / total
        neutral = max(0, 1 - positive - negative)
        compound = (pos_count - neg_count) / total
        
        if compound > 0.2:
            label = "Bullish"
        elif compound < -0.2:
            label = "Bearish"
        else:
            label = "Neutral"
        
        return SentimentScore(
            positive=round(positive, 3),
            negative=round(negative, 3),
            neutral=round(neutral, 3),
            compound=round(compound, 3),
            label=label
        )
    
    def extract_key_phrases(self, text: str, top_n: int = 10) -> List[Tuple[str, int]]:
        """Extract most important phrases"""
        # Simple n-gram extraction with financial focus
        words = text.lower().split()
        
        # Generate bigrams and trigrams
        bigrams = [' '.join(words[i:i+2]) for i in range(len(words)-1)]
        trigrams = [' '.join(words[i:i+3]) for i in range(len(words)-2)]
        
        # Count and filter
        phrase_counts = Counter(bigrams + trigrams)
        
        # Filter for financial relevance
        financial_terms = set()
        for keywords in self.financial_keywords.values():
            financial_terms.update(keywords)
        
        relevant_phrases = [
            (phrase, count) for phrase, count in phrase_counts.most_common(100)
            if any(term in phrase for term in financial_terms)
        ]
        
        return relevant_phrases[:top_n]


class LLMAnalyzer:
    """
    LLM-based analysis using OpenAI or compatible APIs.
    """
    
    def __init__(self, api_key: str = None, model: str = "gpt-4o-mini"):
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        self.model = model
        self._client = None
    
    @property
    def client(self):
        """Lazy load OpenAI client"""
        if self._client is None and self.api_key:
            import openai
            self._client = openai.OpenAI(api_key=self.api_key)
        return self._client
    
    def summarize(self, text: str, style: str = "executive") -> str:
        """
        Generate summary of transcript.
        
        Args:
            text: Transcript text
            style: 'executive' (brief), 'detailed', or 'bullet'
        """
        if not self.client:
            return "OpenAI API key not configured"
        
        style_prompts = {
            "executive": "Provide a 3-4 sentence executive summary focusing on key numbers and outlook.",
            "detailed": "Provide a comprehensive summary covering financials, guidance, and strategic initiatives.",
            "bullet": "Provide key points in bullet format covering: financial highlights, guidance, risks, and opportunities."
        }
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": f"""You are a financial analyst summarizing earnings calls.
                        {style_prompts.get(style, style_prompts['executive'])}
                        Focus on: revenue, EPS, margins, guidance, and key themes."""
                    },
                    {
                        "role": "user",
                        "content": f"Summarize this earnings call:\n\n{text[:8000]}"
                    }
                ],
                max_tokens=500
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error generating summary: {e}"
    
    def extract_metrics(self, text: str) -> Dict:
        """Extract specific financial metrics mentioned"""
        if not self.client:
            return {}
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """Extract financial metrics from this earnings call.
                        Return JSON with these fields (use null if not mentioned):
                        {
                            "revenue": {"value": number, "unit": "M/B", "growth_yoy": percent},
                            "eps": {"value": number, "vs_estimate": "beat/miss/inline"},
                            "gross_margin": percent,
                            "operating_margin": percent,
                            "net_margin": percent,
                            "guidance_revenue": {"low": number, "high": number, "unit": "M/B"},
                            "guidance_eps": {"low": number, "high": number},
                            "free_cash_flow": {"value": number, "unit": "M/B"}
                        }"""
                    },
                    {
                        "role": "user",
                        "content": text[:6000]
                    }
                ],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            return {"error": str(e)}
    
    def analyze_management_tone(self, text: str) -> Dict:
        """Analyze management's tone and confidence"""
        if not self.client:
            return {}
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """Analyze management's tone in this earnings call.
                        Return JSON with:
                        {
                            "overall_tone": "confident/cautious/neutral/defensive",
                            "confidence_score": 1-10,
                            "key_concerns": ["list of concerns mentioned"],
                            "optimistic_points": ["list of positive points"],
                            "language_flags": ["any notable language patterns"],
                            "credibility_assessment": "brief assessment"
                        }"""
                    },
                    {
                        "role": "user",
                        "content": text[:6000]
                    }
                ],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            return {"error": str(e)}
    
    def extract_qa_insights(self, qa_section: str) -> List[Dict]:
        """Extract insights from Q&A section"""
        if not self.client:
            return []
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": """Analyze the Q&A section of this earnings call.
                        Return JSON array of key exchanges:
                        [
                            {
                                "topic": "topic discussed",
                                "analyst_concern": "what the analyst was asking about",
                                "management_response": "key points from response",
                                "signal": "bullish/bearish/neutral",
                                "importance": 1-10
                            }
                        ]
                        Focus on the 5 most important exchanges."""
                    },
                    {
                        "role": "user",
                        "content": qa_section[:6000]
                    }
                ],
                response_format={"type": "json_object"}
            )
            result = json.loads(response.choices[0].message.content)
            return result.get('exchanges', result) if isinstance(result, dict) else result
        except Exception as e:
            return [{"error": str(e)}]


class NLPProcessor:
    """
    Main NLP processor that combines multiple analysis methods.
    """
    
    def __init__(self, backend: NLPBackend = NLPBackend.LOCAL, api_key: str = None):
        self.backend = backend
        self.preprocessor = TextPreprocessor()
        self.keyword_analyzer = KeywordAnalyzer()
        
        if backend == NLPBackend.OPENAI:
            self.llm_analyzer = LLMAnalyzer(api_key)
        else:
            self.llm_analyzer = None
    
    def full_analysis(self, transcript: str) -> Dict:
        """
        Run complete NLP analysis on transcript.
        Returns comprehensive analysis results.
        """
        # Preprocess
        cleaned = self.preprocessor.clean_transcript(transcript)
        sections = self.preprocessor.segment_transcript(cleaned)
        
        # Basic analysis (always available)
        results = {
            'word_count': len(cleaned.split()),
            'sections': {k: len(v.split()) for k, v in sections.items()},
            'keyword_analysis': self.keyword_analyzer.analyze_keywords(cleaned),
            'sentiment': self.keyword_analyzer.calculate_sentiment(cleaned).__dict__,
            'key_phrases': self.keyword_analyzer.extract_key_phrases(cleaned),
            'numbers_mentioned': self.preprocessor.extract_numbers(cleaned)[:20],
        }
        
        # Section-specific sentiment
        results['section_sentiment'] = {}
        for section_name, section_text in sections.items():
            if section_text:
                sentiment = self.keyword_analyzer.calculate_sentiment(section_text)
                results['section_sentiment'][section_name] = sentiment.__dict__
        
        # LLM analysis if available
        if self.llm_analyzer and self.llm_analyzer.client:
            results['llm_analysis'] = {
                'summary': self.llm_analyzer.summarize(cleaned),
                'metrics': self.llm_analyzer.extract_metrics(cleaned),
                'management_tone': self.llm_analyzer.analyze_management_tone(cleaned),
            }
            
            if sections.get('qa'):
                results['llm_analysis']['qa_insights'] = self.llm_analyzer.extract_qa_insights(sections['qa'])
        
        return results
    
    def quick_sentiment(self, text: str) -> SentimentScore:
        """Quick sentiment analysis"""
        cleaned = self.preprocessor.clean_transcript(text)
        return self.keyword_analyzer.calculate_sentiment(cleaned)
    
    def extract_guidance(self, transcript: str) -> Dict:
        """Extract forward guidance"""
        if self.llm_analyzer and self.llm_analyzer.client:
            try:
                response = self.llm_analyzer.client.chat.completions.create(
                    model=self.llm_analyzer.model,
                    messages=[
                        {
                            "role": "system",
                            "content": """Extract forward guidance from this earnings call.
                            Return JSON:
                            {
                                "revenue_guidance": "range or growth expectation",
                                "eps_guidance": "range or growth expectation",
                                "margin_expectations": "any margin guidance",
                                "key_initiatives": ["major planned initiatives"],
                                "risk_factors": ["key risks mentioned"],
                                "timeline": "guidance period (Q1, FY, etc.)"
                            }"""
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
                return {"error": str(e)}
        
        # Fallback: keyword-based extraction
        guidance_keywords = ['expect', 'guidance', 'outlook', 'forecast', 'anticipate', 'target']
        sentences = self.preprocessor.extract_sentences(transcript)
        
        guidance_sentences = [
            s for s in sentences
            if any(kw in s.lower() for kw in guidance_keywords)
        ]
        
        return {
            "guidance_statements": guidance_sentences[:10],
            "note": "LLM analysis unavailable, showing keyword matches"
        }


# Example usage and testing
if __name__ == "__main__":
    print("NLP Module - Example Usage")
    print("=" * 50)
    
    # Sample transcript text
    sample_transcript = """
    Good morning everyone and welcome to our Q3 2024 earnings call.
    
    I'm pleased to report strong results this quarter. Revenue came in at $52.3 billion,
    up 15% year-over-year, exceeding our guidance and analyst expectations. 
    
    Our gross margin improved to 44.2%, driven by operational efficiencies and 
    favorable product mix. Operating income grew 22% to $15.8 billion.
    
    EPS was $3.42, beating consensus estimates of $3.15. This represents 
    18% growth compared to the same quarter last year.
    
    Looking ahead, we expect continued momentum. For Q4, we're guiding to 
    revenue of $54-56 billion, representing 12-16% year-over-year growth.
    
    We do face some headwinds from the macro environment and foreign exchange,
    but we remain confident in our strategy and execution.
    
    Now let's open it up for questions.
    
    Analyst: Can you talk about the competitive landscape?
    
    CEO: We're seeing strong demand across all segments. While competition 
    remains intense, our innovation pipeline gives us confidence. We're 
    investing heavily in AI and expect it to be a major growth driver.
    """
    
    # Run analysis
    processor = NLPProcessor(backend=NLPBackend.LOCAL)
    
    print("\nRunning NLP analysis...")
    results = processor.full_analysis(sample_transcript)
    
    print(f"\nWord count: {results['word_count']}")
    print(f"\nSentiment: {results['sentiment']}")
    print(f"\nKeyword analysis: {results['keyword_analysis']}")
    print(f"\nTop phrases: {results['key_phrases'][:5]}")
    print(f"\nNumbers found: {len(results['numbers_mentioned'])}")
    
    for num in results['numbers_mentioned'][:5]:
        print(f"  - {num['value']} ({num['type']})")
