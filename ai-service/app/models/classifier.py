from transformers import pipeline
from typing import List, Dict, Optional

# Initialize zero-shot classifier
# Note: To use HF Inference API instead, change to:
# classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli", api_key=os.getenv("HF_API_KEY"))
classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")

DEFAULT_LABELS = ["billing", "login", "bug", "feature request", "account"]

def classify_text(text: str, labels: Optional[List[str]] = None) -> Dict:
    """
    Classify text using zero-shot classification.
    
    Args:
        text: Input text to classify
        labels: Optional list of classification labels. Uses defaults if None.
    
    Returns:
        Dict containing top label, score and full classification output
    """
    if not labels:
        labels = DEFAULT_LABELS
        
    result = classifier(text, labels, multi_label=False)
    
    return {
        "top_label": result["labels"][0],
        "top_score": float(result["scores"][0]),
        "full_output": {
            "labels": result["labels"],
            "scores": [float(s) for s in result["scores"]]
        }
    }
