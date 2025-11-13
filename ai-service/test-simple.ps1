# Simple test script for AI service new endpoints
Write-Host "Testing AI Service New Endpoints" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

$baseUrl = "http://127.0.0.1:8001"

# Test 1: Health check
Write-Host "`n1. Checking service health..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/" -Method Get
    Write-Host "   Service is running!" -ForegroundColor Green
} catch {
    Write-Host "   Cannot connect to service" -ForegroundColor Red
    Write-Host "   Start it with: python -m uvicorn app.main:app --port 8001" -ForegroundColor Yellow
    exit 1
}

# Test 2: Summarize
Write-Host "`n2. Testing /summarize..." -ForegroundColor Yellow
$longText = "I have been waiting for my refund for over 3 weeks now. This is the third time I have contacted customer support and still nobody has helped me resolve this issue. I am extremely frustrated with this service and demand immediate action."

$summarizeBody = @{
    text = $longText
    max_length = 80
    min_length = 30
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/summarize" -Method Post -ContentType "application/json" -Body $summarizeBody
    Write-Host "   Summary: $($result.summary)" -ForegroundColor Green
    Write-Host "   Model: $($result.model)" -ForegroundColor Gray
} catch {
    Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Reply (without KB)
Write-Host "`n3. Testing /reply (no KB context)..." -ForegroundColor Yellow
$replyBody1 = @{
    text = "I cannot login to my account"
    tone = "polite"
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/reply" -Method Post -ContentType "application/json" -Body $replyBody1
    Write-Host "   Reply: $($result.draft_reply)" -ForegroundColor Green
    Write-Host "   Confidence: $($result.confidence)" -ForegroundColor Gray
    Write-Host "   Model: $($result.model)" -ForegroundColor Gray
    Write-Host "   Needs Review: $($result.needs_human_review)" -ForegroundColor $(if($result.needs_human_review) {"Yellow"} else {"Green"})
} catch {
    Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Reply (with KB context)
Write-Host "`n4. Testing /reply (with KB context - RAG)..." -ForegroundColor Yellow
$replyBody2 = @{
    text = "My internet has been down for 2 days!"
    kb_context = @(
        "Standard resolution time is 24-48 hours",
        "Customers get credits for outages over 24 hours"
    )
    tone = "empathetic"
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/reply" -Method Post -ContentType "application/json" -Body $replyBody2
    Write-Host "   Reply: $($result.draft_reply)" -ForegroundColor Green
    Write-Host "   Confidence: $($result.confidence)" -ForegroundColor Gray
    Write-Host "   Source: $($result.source)" -ForegroundColor Gray
    Write-Host "   Tone: $($result.tone_used)" -ForegroundColor Gray
} catch {
    Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nAll tests completed!" -ForegroundColor Cyan
Write-Host "Check the Swagger UI: http://127.0.0.1:8001/docs" -ForegroundColor White
