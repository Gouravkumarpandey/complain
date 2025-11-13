@echo off
echo Starting QuickFix AI Service...
echo.
cd /d "%~dp0"
call venv\Scripts\activate.bat
echo Service starting on http://localhost:8001
echo Press Ctrl+C to stop
echo.
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
