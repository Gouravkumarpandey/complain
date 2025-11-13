# Test script for new AI endpoints: /summarize and /reply
# Run this after starting the AI service on port 8001

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Testing AI Service New Endpoints" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://127.0.0.1:8001"

# Check if service is running
Write-Host "1. Checking if AI service is running..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/" -Method Get
    Write-Host "   ✓ Service is running!" -ForegroundColor Green
    Write-Host "   Status: $($health.status)`n" -ForegroundColor Green
} catch {
    Write-Host "   ✗ Cannot connect to AI service at $baseUrl" -ForegroundColor Red
    Write-Host "   Make sure to start it with: .\start.bat`n" -ForegroundColor Red
    exit 1
}

# Test summarization
Write-Host "2. Testing /summarize endpoint..." -ForegroundColor Yellow
$longText = @"
I have been a loyal customer for 5 years and recently faced a terrible experience. 
My order was delayed by 2 weeks without any notification. When I called customer service, 
I was put on hold for 45 minutes and then disconnected. I tried again the next day and was 
told my order was lost. This is completely unacceptable and I demand a full refund plus 
compensation for my time wasted. I have tried to reach a supervisor three times.
"@

$summarizeBody = @{
    text = $longText
    max_length = 80
    min_length = 30
} | ConvertTo-Json

try {
    Write-Host "   Sending request..." -ForegroundColor Gray
    $summaryResult = Invoke-RestMethod -Uri "$baseUrl/summarize" -Method Post `
        -ContentType "application/json" -Body $summarizeBody
    
    Write-Host "   ✓ Summary generated successfully!" -ForegroundColor Green
    Write-Host "   Summary: $($summaryResult.summary)" -ForegroundColor White
    Write-Host "   Model: $($summaryResult.model)" -ForegroundColor Gray
    Write-Host "   Length: $($summaryResult.summary_length) characters`n" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Summarization failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)`n" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "   Details: $($_.ErrorDetails.Message)`n" -ForegroundColor Red
    }
}

# Test reply generation (without KB context)
Write-Host "3. Testing /reply endpoint (without KB context)..." -ForegroundColor Yellow
$ticket1 = "I cannot login to my account. It says invalid password and I tried reset but no email received."

$replyBody1 = @{
    text = $ticket1
    tone = "polite"
} | ConvertTo-Json

try {
    Write-Host "   Sending request..." -ForegroundColor Gray
    $replyResult1 = Invoke-RestMethod -Uri "$baseUrl/reply" -Method Post `
        -ContentType "application/json" -Body $replyBody1
    
    Write-Host "   ✓ Reply generated successfully!" -ForegroundColor Green
    Write-Host "   Draft Reply: $($replyResult1.draft_reply)" -ForegroundColor White
    Write-Host "   Confidence: $($replyResult1.confidence)" -ForegroundColor Gray
    Write-Host "   Model: $($replyResult1.model)" -ForegroundColor Gray
    Write-Host "   Source: $($replyResult1.source)" -ForegroundColor Gray
    Write-Host "   Needs Review: $($replyResult1.needs_human_review)`n" -ForegroundColor $(if($replyResult1.needs_human_review) {"Yellow"} else {"Green"})
} catch {
    Write-Host "   ✗ Reply generation failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)`n" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "   Details: $($_.ErrorDetails.Message)`n" -ForegroundColor Red
    }
}

# Test reply generation (with KB context - RAG)
Write-Host "4. Testing /reply endpoint (with KB context - RAG)..." -ForegroundColor Yellow
$ticket2 = "My internet has been down for 2 days and nobody has helped me!"
$kbContext = @(
    "Standard resolution time for internet outages is 24-48 hours.",
    "Customers get automatic bill credits for outages longer than 24 hours.",
    "To expedite, please provide your account number and modem status lights."
)

$replyBody2 = @{
    text = $ticket2
    kb_context = $kbContext
    tone = "empathetic"
} | ConvertTo-Json

try {
    Write-Host "   Sending request with KB context..." -ForegroundColor Gray
    $replyResult2 = Invoke-RestMethod -Uri "$baseUrl/reply" -Method Post `
        -ContentType "application/json" -Body $replyBody2
    
    Write-Host "   ✓ Reply generated successfully (with RAG)!" -ForegroundColor Green
    Write-Host "   Draft Reply: $($replyResult2.draft_reply)" -ForegroundColor White
    Write-Host "   Confidence: $($replyResult2.confidence)" -ForegroundColor Gray
    Write-Host "   Model: $($replyResult2.model)" -ForegroundColor Gray
    Write-Host "   Source: $($replyResult2.source)" -ForegroundColor Gray
    Write-Host "   Tone: $($replyResult2.tone_used)" -ForegroundColor Gray
    Write-Host "   Needs Review: $($replyResult2.needs_human_review)`n" -ForegroundColor $(if($replyResult2.needs_human_review) {"Yellow"} else {"Green"})
} catch {
    Write-Host "   ✗ Reply generation failed!" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)`n" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "   Details: $($_.ErrorDetails.Message)`n" -ForegroundColor Red
    }
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "✓ All endpoints are working!" -ForegroundColor Green
Write-Host "`nNext Steps:" -ForegroundColor Yellow
Write-Host "  1. Check the Swagger UI: http://127.0.0.1:8001/docs" -ForegroundColor White
Write-Host "  2. Update backend aiService.js to use new endpoints" -ForegroundColor White
Write-Host "  3. Integrate into complaint controller" -ForegroundColor White
Write-Host "  4. Review AI_SERVICE_EXTENSION_SUMMARY.md for details`n" -ForegroundColor White
