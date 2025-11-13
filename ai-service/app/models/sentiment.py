from transformers import pipeline
from typing import Dict

# Initialize sentiment analyzer
# Note: To use HF Inference API instead, change to:
# sentiment_analyzer = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english", api_key=os.getenv("HF_API_KEY"))
sentiment_analyzer = pipeline("sentiment-analysis", model="distilbert/distilbert-base-uncased-finetuned-sst-2-english")

def analyze_sentiment(text: str) -> Dict:
    """
    Analyze sentiment of input text.
    
    Args:
        text: Input text to analyze
    
    Returns:
        Dict containing sentiment label and score
    """
    result = sentiment_analyzer(text)[0]
    return {
        "label": result["label"],
        "score": float(result["score"])
    }
