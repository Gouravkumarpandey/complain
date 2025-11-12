import os
import requests
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)

# Configuration from environment
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
REPLY_MODE = os.getenv("REPLY_MODE", "openai" if OPENAI_API_KEY else "local")

# OpenAI API configuration
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"
OPENAI_MODEL = "gpt-4o-mini"  # Cost-effective model, can upgrade to gpt-4


def generate_reply(
    ticket_text: str,
    kb_context: Optional[List[str]] = None,
    tone: str = "polite"
) -> Dict:
    """
    Generate a draft reply for a support ticket using RAG-style approach.
    
    This function supports two modes:
    1. OpenAI API (recommended for production) - requires OPENAI_API_KEY env var
    2. Local HF model (requires significant RAM/GPU) - for on-premise deployments
    
    Args:
        ticket_text: The customer complaint or support ticket
        kb_context: Optional list of relevant KB articles/snippets for context
        tone: Response tone - "polite", "friendly", "professional", "empathetic"
    
    Returns:
        Dict containing:
            - draft_reply: Generated response text
            - confidence: Score 0-1 indicating reply quality
            - model: Model/API used for generation
            - needs_human_review: Boolean flag for manual review requirement
            - tone_used: The tone applied
    """
    
    # Validate inputs
    if not ticket_text or len(ticket_text.strip()) < 10:
        raise ValueError("Ticket text too short (minimum 10 characters)")
    
    # Prepare context
    kb_context = kb_context or []
    context_text = ""
    if kb_context:
        context_text = "\n\nRelevant Knowledge Base Information:\n" + "\n".join(
            f"- {snippet}" for snippet in kb_context[:3]  # Limit to top 3 snippets
        )
    
    # Choose generation method based on configuration
    if REPLY_MODE == "openai" and OPENAI_API_KEY:
        return _generate_reply_openai(ticket_text, context_text, tone)
    else:
        return _generate_reply_local(ticket_text, context_text, tone)


def _generate_reply_openai(ticket_text: str, context_text: str, tone: str) -> Dict:
    """
    Generate reply using OpenAI ChatCompletion API.
    
    This is the recommended approach for production as it:
    - Requires no local GPU/large RAM
    - Provides high-quality, consistent responses
    - Supports streaming and function calling
    
    Note: Requires OPENAI_API_KEY environment variable
    """
    
    # Tone-specific system prompts
    tone_prompts = {
        "polite": "You are a polite and professional customer support agent.",
        "friendly": "You are a friendly and warm customer support agent.",
        "professional": "You are a professional and concise customer support agent.",
        "empathetic": "You are an empathetic and understanding customer support agent."
    }
    
    system_prompt = tone_prompts.get(tone, tone_prompts["polite"])
    system_prompt += " Respond to customer complaints with helpful, accurate information. Be concise and actionable."
    
    # Construct user prompt
    user_prompt = f"""Please draft a response to this customer ticket:

{ticket_text}
{context_text}

Requirements:
- Address the customer's concern directly
- Provide clear next steps or solutions
- Maintain a {tone} tone
- Keep response under 150 words
- Do not make promises you cannot keep"""
    
    try:
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": OPENAI_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": 0.7,  # Balanced creativity/consistency
            "max_tokens": 300
        }
        
        response = requests.post(
            OPENAI_API_URL,
            headers=headers,
            json=payload,
            timeout=30
        )
        
        if response.status_code != 200:
            logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
            raise Exception(f"OpenAI API returned status {response.status_code}")
        
        result = response.json()
        draft_reply = result['choices'][0]['message']['content'].strip()
        
        # Calculate confidence score (heuristic-based)
        confidence = _calculate_confidence(
            draft_reply=draft_reply,
            has_kb_context=bool(context_text),
            ticket_length=len(ticket_text),
            reply_length=len(draft_reply)
        )
        
        return {
            "draft_reply": draft_reply,
            "confidence": confidence,
            "model": f"openai/{OPENAI_MODEL}",
            "needs_human_review": confidence < 0.8,
            "tone_used": tone,
            "source": "OpenAI API"
        }
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Network error calling OpenAI API: {str(e)}")
        raise Exception(f"Failed to generate reply via OpenAI: {str(e)}")
    except Exception as e:
        logger.error(f"Error in OpenAI reply generation: {str(e)}")
        raise


def _generate_reply_local(ticket_text: str, context_text: str, tone: str) -> Dict:
    """
    Generate reply using local Hugging Face model.
    
    WARNING: This approach requires significant resources:
    - Large models (7B+) need GPU and 16GB+ RAM
    - Smaller models may produce lower quality responses
    - Consider using HF Inference API instead for better results
    
    ALTERNATIVE APPROACHES:
    1. Use HF Inference API (https://huggingface.co/inference-api)
       - Set HF_API_KEY and use pipeline with api_key parameter
    2. Use smaller instruction-tuned models:
       - "google/flan-t5-base" (250MB, CPU-friendly)
       - "facebook/blenderbot-400M-distill" (chat, 1.6GB)
    3. Fine-tune a small model on your support data
    
    Current implementation uses a fallback approach with template-based responses
    when models are too large for local inference.
    """
    
    try:
        # Option 1: Try using HF Inference API if key is available
        hf_api_key = os.getenv("HF_API_KEY")
        if hf_api_key:
            return _generate_reply_hf_api(ticket_text, context_text, tone, hf_api_key)
        
        # Option 2: Use small local model (flan-t5-base)
        # This is CPU-friendly but may produce generic responses
        from transformers import pipeline
        
        try:
            # Attempt to load a smaller model suitable for CPU
            generator = pipeline(
                "text2text-generation",
                model="google/flan-t5-base",  # 250MB model, works on CPU
                device=-1  # Force CPU
            )
            
            prompt = f"""Write a {tone} customer support response to this ticket:
Ticket: {ticket_text}
{context_text}
Response:"""
            
            result = generator(
                prompt,
                max_length=200,
                temperature=0.7,
                do_sample=True
            )
            
            draft_reply = result[0]['generated_text'].strip()
            
        except Exception as model_error:
            logger.warning(f"Local model failed: {model_error}. Using template response.")
            # Fallback: Template-based response
            draft_reply = _generate_template_response(ticket_text, tone)
        
        # Calculate confidence (lower for local/template responses)
        confidence = _calculate_confidence(
            draft_reply=draft_reply,
            has_kb_context=bool(context_text),
            ticket_length=len(ticket_text),
            reply_length=len(draft_reply)
        ) * 0.7  # Penalty for non-OpenAI responses
        
        return {
            "draft_reply": draft_reply,
            "confidence": confidence,
            "model": "local/flan-t5-base",
            "needs_human_review": True,  # Always require review for local generation
            "tone_used": tone,
            "source": "Local model (limited capability)"
        }
        
    except Exception as e:
        logger.error(f"Error in local reply generation: {str(e)}")
        raise Exception(f"Failed to generate reply locally: {str(e)}")


def _generate_reply_hf_api(ticket_text: str, context_text: str, tone: str, api_key: str) -> Dict:
    """
    Generate reply using Hugging Face Inference API.
    
    This is a good middle ground between OpenAI and fully local:
    - No local GPU/RAM requirements
    - Access to open-source models
    - Lower cost than OpenAI
    - Requires HF_API_KEY environment variable
    """
    
    HF_API_URL = "https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    prompt = f"""[INST] You are a {tone} customer support agent. Write a helpful response to this ticket:

{ticket_text}
{context_text}

Keep response under 150 words and provide clear next steps. [/INST]"""
    
    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 250,
            "temperature": 0.7,
            "top_p": 0.9
        }
    }
    
    try:
        response = requests.post(HF_API_URL, headers=headers, json=payload, timeout=30)
        
        if response.status_code != 200:
            raise Exception(f"HF API returned status {response.status_code}")
        
        result = response.json()
        draft_reply = result[0]['generated_text'].split("[/INST]")[-1].strip()
        
        confidence = _calculate_confidence(
            draft_reply=draft_reply,
            has_kb_context=bool(context_text),
            ticket_length=len(ticket_text),
            reply_length=len(draft_reply)
        ) * 0.85  # Slight penalty vs OpenAI
        
        return {
            "draft_reply": draft_reply,
            "confidence": confidence,
            "model": "hf-inference/llama-2-7b-chat",
            "needs_human_review": confidence < 0.8,
            "tone_used": tone,
            "source": "Hugging Face Inference API"
        }
        
    except Exception as e:
        logger.error(f"HF Inference API error: {str(e)}")
        raise


def _generate_template_response(ticket_text: str, tone: str) -> str:
    """
    Fallback template-based response when models are unavailable.
    This ensures the service remains functional even without API keys or GPUs.
    """
    
    tone_greetings = {
        "polite": "Thank you for contacting us.",
        "friendly": "Hi there! Thanks for reaching out.",
        "professional": "Thank you for your inquiry.",
        "empathetic": "Thank you for bringing this to our attention. I understand your concern."
    }
    
    greeting = tone_greetings.get(tone, tone_greetings["polite"])
    
    # Simple template (should be replaced with real generation in production)
    template = f"""{greeting}

I've reviewed your message regarding your concern. Our team will investigate this matter and provide you with a detailed response within 24-48 hours.

In the meantime, if you have any additional information or urgent concerns, please don't hesitate to reach out.

Best regards,
Customer Support Team"""
    
    return template


def _calculate_confidence(
    draft_reply: str,
    has_kb_context: bool,
    ticket_length: int,
    reply_length: int
) -> float:
    """
    Calculate confidence score for generated reply using heuristics.
    
    This is a simple rule-based scorer. In production, consider:
    - Training a learned confidence model
    - Using perplexity from the generation model
    - Implementing BLEU/ROUGE metrics against golden responses
    - Adding human feedback loop for continuous improvement
    
    Current heuristics:
    - Base score: 0.7
    - +0.15 if KB context provided (RAG)
    - +0.1 if reply is substantive (50-500 chars)
    - +0.05 if ticket is clear (100+ chars)
    - Capped at 0.95 (never 100% confident)
    """
    
    confidence = 0.70  # Base confidence
    
    # KB context increases confidence (RAG)
    if has_kb_context:
        confidence += 0.15
    
    # Reply length indicates substantive response
    if 50 <= reply_length <= 500:
        confidence += 0.10
    
    # Longer, clearer tickets are easier to respond to
    if ticket_length >= 100:
        confidence += 0.05
    
    # Cap confidence at 0.95 (always some uncertainty)
    confidence = min(confidence, 0.95)
    
    return round(confidence, 2)
