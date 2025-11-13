# AI Service Startup Script
Write-Host "Starting QuickFix AI Service..." -ForegroundColor Green

# Activate virtual environment
& ".\venv\Scripts\Activate.ps1"

# Start the service
Write-Host "Service will be available at http://localhost:8001" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the service" -ForegroundColor Yellow
Write-Host ""

python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
