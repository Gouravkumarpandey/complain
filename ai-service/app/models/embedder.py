from sentence_transformers import SentenceTransformer
from typing import List

# Initialize sentence transformer
model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')

def get_embedding(text: str) -> List[float]:
    """
    Get embedding vector for input text.
    
    Args:
        text: Input text to embed
    
    Returns:
        List of floats representing the text embedding
    """
    # Convert to regular Python list for JSON serialization
    embedding = model.encode(text, convert_to_tensor=False)
    return embedding.tolist()
