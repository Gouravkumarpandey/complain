# Quick Start: Test AI Assignment

## Prerequisites Checklist

- [ ] Backend server running (`cd backend && npm start`)
- [ ] Frontend server running (`cd frontend && npm run dev`)
- [ ] MongoDB connected
- [ ] At least 1 agent user exists in database

---

## Step 1: Verify Agents Exist

### Quick Check (Terminal)
```bash
cd backend
node debug_assignment.js
```

**Expected:** Shows list of agents and their status

**If no agents found:**
```bash
# Create an agent via API
curl -X POST http://localhost:5001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Test Agent",
    "email": "agent@test.com",
    "password": "password123",
    "role": "agent"
  }'
```

---

## Step 2: Create Test Complaint

### Option A: Via Frontend UI
1. Open http://localhost:3000
2. Login as regular user
3. Click "New Ticket" or "File New Complaint"
4. Fill form:
   - Title: "Internet not working"
   - Description: "My internet connection is down"
   - Category: Technical
   - Priority: High
5. Submit

### Option B: Via API
```bash
# First login as user
curl -X POST http://localhost:5001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@test.com","password":"password123"}'

# Copy the token from response, then create complaint
curl -X POST http://localhost:5001/api/complaints \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_TOKEN_HERE' \
  -d '{
    "title": "Internet not working",
    "description": "My internet connection has been down since yesterday",
    "category": "Technical",
    "priority": "High"
  }'
```

---

## Step 3: Check Backend Logs

Watch for these messages in terminal where backend is running:

✅ **Success Indicators:**
```
🤖 Attempting AI-powered agent assignment...
📊 Found 3 agents in database
✅ 3 active agents available for assignment
📋 Agent profiles prepared:
   - John Tech: 2 active tickets, available
🤖 Using DeepSeek AI to assign complaint CMP-12345...
✅ Complaint CMP-12345 AI-assigned to John Tech (Confidence: 0.85)
```

❌ **Failure Indicators:**
```
❌ No agents available in the system
❌ All agents are offline
⚠️ AI assignment failed, falling back to basic assignment
```

---

## Step 4: Verify in Frontend

### Agent Dashboard:
1. Login as agent (agent@test.com)
2. Should see notification for new ticket
3. Ticket appears in "My Tickets" or "Assigned Tickets"
4. Click refresh button (🔄) to reload

### User Dashboard:
1. Login as user who created complaint
2. Go to "My Tickets" or "My Complaints"
3. Check ticket status - should be "In Progress"
4. Should show assigned agent name
5. Click refresh button (🔄) to reload

---

## Step 5: Check Database

### MongoDB Shell:
```javascript
use quickfix

// Find the complaint
db.complaints.findOne({ complaintId: "CMP-12345" })

// Should show:
{
  "assignedTo": ObjectId("..."),  // ✅ Has agent ID
  "status": "In Progress",         // ✅ Status updated
  "updates": [
    {
      "message": "🤖 AI-assigned to John Tech: ...",
      "metadata": {
        "assignmentMethod": "ai",    // ✅ AI method
        "confidence": 0.85,           // ✅ Confidence score
        "aiModel": "deepseek-chat"    // ✅ Model used
      }
    }
  ]
}
```

---

## Troubleshooting Quick Fixes

### Issue: No agents in database
```bash
# Register an agent
curl -X POST http://localhost:5001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Agent","email":"agent@test.com","password":"pass123","role":"agent"}'
```

### Issue: Agents offline
```javascript
// MongoDB: Set all agents to available
db.users.updateMany(
  { role: "agent" },
  { $set: { availability: "available" } }
)
```

### Issue: Assignment not working
1. Check backend logs for errors
2. Run `node debug_assignment.js`
3. Verify DEEPSEEK_API_KEY in .env
4. Restart backend server

### Issue: Frontend not updating
- Click refresh button (🔄) in dashboard
- Or reload page (F5)
- Check browser console for errors

---

## Success Metrics

✅ Complaint created with valid data
✅ Backend logs show AI assignment attempt
✅ Agent receives notification
✅ Ticket status changes to "In Progress"
✅ Agent can see ticket in their dashboard
✅ User can see assigned agent name

---

## Common Test Scenarios

### Scenario 1: High Priority Technical Issue
```json
{
  "title": "Server down - URGENT",
  "description": "Production server crashed, need immediate help",
  "category": "Technical",
  "priority": "High"
}
```
**Expected:** Assigned to technical agent with lowest workload

### Scenario 2: Billing Question
```json
{
  "title": "Question about invoice",
  "description": "I have a question about my last invoice",
  "category": "Billing",
  "priority": "Low"
}
```
**Expected:** Assigned to billing expert or available agent

### Scenario 3: General Inquiry
```json
{
  "title": "General question",
  "description": "I would like to know more about your services",
  "category": "General",
  "priority": "Low"
}
```
**Expected:** Assigned to agent with lowest workload

---

## Need Help?

1. Run debug script: `node debug_assignment.js`
2. Check full troubleshooting guide: `AI_ASSIGNMENT_TROUBLESHOOTING.md`
3. Review backend logs for detailed error messages
4. Verify environment variables in `.env`

---

Last Updated: November 28, 2025
