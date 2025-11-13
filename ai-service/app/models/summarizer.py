from transformers import pipeline
from typing import Dict
import logging

logger = logging.getLogger(__name__)

# Initialize summarization pipeline
# Model: facebook/bart-large-cnn - optimized for abstractive summarization
# Note: First run will download ~1.6GB model to cache
try:
    summarizer = pipeline("summarization", model="facebook/bart-large-cnn")
    logger.info("Summarization model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load summarization model: {e}")
    summarizer = None


def summarize_text(text: str, max_length: int = 120, min_length: int = 30) -> Dict:
    """
    Generate an abstractive summary of the input text.
    
    Args:
        text: Input text to summarize (complaint, conversation, etc.)
        max_length: Maximum length of summary in tokens
        min_length: Minimum length of summary in tokens
    
    Returns:
        Dict containing:
            - summary: The generated summary text
            - model: Name of the model used
            - input_length: Character count of input
            - summary_length: Character count of output
    
    Raises:
        Exception: If summarization fails or model not loaded
    """
    if summarizer is None:
        raise Exception("Summarization model not loaded. Check logs for initialization errors.")
    
    # Validate input
    if not text or len(text.strip()) < 50:
        raise ValueError("Input text too short for summarization (minimum 50 characters)")
    
    try:
        # BART works best with text between 100-1024 tokens
        # Truncate if too long to avoid memory issues on CPU
        max_input_length = 1024
        if len(text) > max_input_length * 4:  # Rough char estimate
            logger.warning(f"Input text truncated from {len(text)} to ~{max_input_length * 4} characters")
            text = text[:max_input_length * 4]
        
        # Generate summary
        result = summarizer(
            text,
            max_length=max_length,
            min_length=min_length,
            do_sample=False,  # Deterministic output
            truncation=True
        )
        
        summary_text = result[0]['summary_text']
        
        return {
            "summary": summary_text,
            "model": "facebook/bart-large-cnn",
            "input_length": len(text),
            "summary_length": len(summary_text)
        }
        
    except Exception as e:
        logger.error(f"Summarization failed: {str(e)}")
        raise Exception(f"Failed to generate summary: {str(e)}")
