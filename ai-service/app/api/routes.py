from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from app.models import classifier, sentiment, embedder, summarizer, reply_gen

router = APIRouter()

class ClassifyRequest(BaseModel):
    text: str
    labels: Optional[List[str]] = None

class SentimentRequest(BaseModel):
    text: str

class EmbedRequest(BaseModel):
    text: str

class SummarizeRequest(BaseModel):
    text: str
    max_length: Optional[int] = Field(default=120, ge=30, le=500)
    min_length: Optional[int] = Field(default=30, ge=10, le=200)

class ReplyRequest(BaseModel):
    text: str
    kb_context: Optional[List[str]] = None
    tone: Optional[str] = Field(default="polite", pattern="^(polite|friendly|professional|empathetic)$")

@router.post("/classify")
async def classify_text(request: ClassifyRequest):
    try:
        result = classifier.classify_text(request.text, request.labels)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sentiment")
async def analyze_sentiment(request: SentimentRequest):
    try:
        result = sentiment.analyze_sentiment(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/embed")
async def get_embedding(request: EmbedRequest):
    try:
        embedding = embedder.get_embedding(request.text)
        return {
            "embedding": embedding,
            "dimensions": len(embedding)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/summarize")
async def summarize_text(request: SummarizeRequest):
    """
    Generate an abstractive summary of the input text.
    
    Use cases:
    - Summarize long complaint descriptions
    - Create executive summaries of ticket conversations
    - Generate brief overviews for dashboards
    
    Note: Requires at least 50 characters of input text.
    """
    try:
        result = summarizer.summarize_text(
            text=request.text,
            max_length=request.max_length,
            min_length=request.min_length
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

@router.post("/reply")
async def generate_reply(request: ReplyRequest):
    """
    Generate a draft reply for a support ticket using RAG approach.
    
    Features:
    - Supports multiple tones (polite, friendly, professional, empathetic)
    - Uses KB context for more accurate responses (RAG)
    - Returns confidence score and human review flag
    - Tracks which model/API was used
    
    IMPORTANT: Always review generated replies before sending to customers.
    Set up approval workflows for replies with needs_human_review=True.
    
    Configuration:
    - Set OPENAI_API_KEY env var to use OpenAI (recommended)
    - Set HF_API_KEY to use Hugging Face Inference API
    - Falls back to local model if no API keys set
    """
    try:
        result = reply_gen.generate_reply(
            ticket_text=request.text,
            kb_context=request.kb_context,
            tone=request.tone
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Reply generation failed: {str(e)}")
