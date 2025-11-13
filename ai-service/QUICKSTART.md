# QuickFix AI Microservice - Quick Start Guide

## 🚀 Successfully Set Up!

Your AI microservice has been created and configured with the following features:

### ✅ Models Included
- **Classification**: `facebook/bart-large-mnli` (Zero-shot text classification)
- **Sentiment Analysis**: `distilbert/distilbert-base-uncased-finetuned-sst-2-english`
- **Text Embeddings**: `sentence-transformers/all-MiniLM-L6-v2`

All models downloaded and cached (~2GB total)

### 📡 API Endpoints

#### 1. Classification
```bash
POST http://localhost:8001/classify
Body: {"text": "I cannot login", "labels": ["login", "billing", "bug"]}
```

#### 2. Sentiment Analysis
```bash
POST http://localhost:8001/sentiment  
Body: {"text": "I am very angry"}
```

#### 3. Text Embeddings
```bash
POST http://localhost:8001/embed
Body: {"text": "My order is late"}
```

#### 4. Health Check
```bash
GET http://localhost:8001/
Response: {"service": "ai-service", "status": "ok"}
```

---

## 🏃 How to Run

### Option 1: Using PowerShell Script (Recommended)
```powershell
cd ai-service
.\start.ps1
```

### Option 2: Manual Start
```powershell
cd ai-service
.\venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

### Option 3: With Auto-Reload (Development)
```powershell
cd ai-service
.\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8001
```

---

## 🧪 Testing

### Run Test Script
```powershell
cd ai-service
.\venv\Scripts\Activate.ps1
python test_service.py
```

### Manual cURL Tests (Git Bash or WSL)
```bash
# Classification
curl -X POST http://localhost:8001/classify \
  -H "Content-Type: application/json" \
  -d '{"text":"I cannot login","labels":["login","billing","bug"]}'

# Sentiment
curl -X POST http://localhost:8001/sentiment \
  -H "Content-Type: application/json" \
  -d '{"text":"I am very angry"}'

# Embeddings
curl -X POST http://localhost:8001/embed \
  -H "Content-Type: application/json" \
  -d '{"text":"My order is late"}'
```

---

## 🔗 Integration with Node.js Backend

### Backend Configuration
Update `backend/.env`:
```
AI_SERVICE_URL=http://localhost:8001
```

### Usage in Backend Code
```javascript
const aiService = require('./services/aiService');

// Classify complaint
const result = await aiService.classify(
  "I can't access my account",
  ["login", "billing", "technical"]
);
console.log(result.top_label); // "login"

// Analyze sentiment
const sentiment = await aiService.sentiment("This is terrible!");
console.log(sentiment.label); // "NEGATIVE"

// Get embeddings for similarity matching
const embedding = await aiService.embed("Help with payment");
console.log(embedding.dimensions); // 384
```

---

## 📦 What Was Created

```
ai-service/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI application
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py              # API endpoints
│   └── models/
│       ├── __init__.py
│       ├── classifier.py          # Text classification
│       ├── sentiment.py           # Sentiment analysis
│       └── embedder.py            # Text embeddings
├── venv/                          # Python virtual environment
├── requirements.txt               # Python dependencies
├── .env                           # Environment variables
├── .env.example                   # Environment template
├── Dockerfile                     # Docker configuration
├── docker-compose.override.yml    # Docker Compose
├── start.ps1                      # Windows startup script
├── test_service.py                # Test script
└── README.md                      # Full documentation

backend/src/services/
└── aiService.js                   # Node.js client for AI service
```

---

## 🛠️ Troubleshooting

### Models not loading?
The models are cached in: `C:\Users\<username>\.cache\huggingface\hub\`
First run downloads ~2GB, subsequent runs load from cache.

### Port 8001 already in use?
```powershell
# Find process using port 8001
netstat -ano | findstr :8001
# Kill process
taskkill /PID <process_id> /F
```

### Python not found?
Ensure Python 3.10+ is installed and in PATH.

### Virtual environment issues?
```powershell
# Recreate virtual environment
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

---

## 🎯 Next Steps

1. **Start the AI service**: `.\start.ps1`
2. **Test endpoints**: `python test_service.py`
3. **Update backend .env**: Set `AI_SERVICE_URL=http://localhost:8001`
4. **Integrate**: Use `backend/src/services/aiService.js` in your controllers
5. **Production**: Use Docker with `docker-compose up --build`

---

## 📝 Notes

- **CPU-Friendly**: All models run on CPU, no GPU required
- **Fast inference**: Sentiment ~100ms, Classification ~300ms, Embeddings ~50ms
- **Memory usage**: ~2-3GB RAM when all models loaded
- **Production ready**: Use Docker or systemd for deployment

---

## 🐳 Docker Deployment (Optional)

```bash
cd ai-service
docker build -t quickfix-ai .
docker run -p 8001:8001 --env-file .env quickfix-ai
```

Or with docker-compose:
```bash
docker-compose up --build
```

---

**Service Status**: ✅ Ready to use!
**Models**: ✅ Downloaded and cached
**Endpoints**: ✅ Configured
**Integration**: ✅ Backend client ready

Happy coding! 🎉
