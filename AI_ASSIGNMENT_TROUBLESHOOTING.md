# AI Assignment Troubleshooting Guide

## Issue: AI Not Assigning Complaints to Agents

### Quick Diagnosis

Run the debug script:
```bash
cd backend
node debug_assignment.js
```

This will check:
- ✅ Are there agents in the database?
- ✅ What's their availability status?
- ✅ How many active tickets do they have?
- ✅ Is DEEPSEEK_API_KEY configured?
- ✅ Test assignment on an unassigned complaint

---

## Common Issues & Solutions

### 1. No Agents in Database

**Symptom:**
```
❌ NO AGENTS FOUND!
Found 0 agents
```

**Solution:**
Create an agent user via API or directly in database:

**Via API:**
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "John Agent",
    "email": "agent@example.com",
    "password": "password123",
    "role": "agent"
  }'
```

**Directly in MongoDB:**
```javascript
db.users.updateOne(
  { email: "existing@example.com" },
  { $set: { role: "agent", availability: "available" } }
)
```

---

### 2. All Agents Offline

**Symptom:**
```
❌ All agents are offline
Found 3 agents but all have availability: 'offline'
```

**Solution:**
Update agent availability:

**Via API (as agent):**
```bash
curl -X PUT http://localhost:5001/api/agents/availability \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer AGENT_TOKEN' \
  -d '{ "status": "available" }'
```

**Directly in MongoDB:**
```javascript
db.users.updateMany(
  { role: "agent" },
  { $set: { availability: "available" } }
)
```

---

### 3. DeepSeek API Key Not Set

**Symptom:**
```
⚠️  AI assignment will use fallback method (workload-based)
DEEPSEEK_API_KEY: ❌ NOT SET
```

**Impact:**
- System still assigns tickets but uses simple workload balancing
- No AI reasoning or confidence scores
- No expertise matching

**Solution:**
Add to your `.env` file:
```env
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_API_URL=https://api.deepseek.com/v1
```

For OpenRouter:
```env
DEEPSEEK_API_KEY=sk-or-v1-your_openrouter_key
```

Restart backend after adding:
```bash
npm restart
```

---

### 4. Assignment Works But No AI Reasoning

**Symptom:**
- Tickets get assigned
- But no AI confidence or reasoning in logs
- Uses "fallback" method

**Causes:**
1. Invalid API key
2. API rate limit reached
3. Network issues
4. DeepSeek service down

**Solution:**
Check backend logs for errors:
```
Error in aiAssignToAgent: [error message]
AI assignment failed, falling back to basic assignment
```

Test API key separately:
```bash
curl https://api.deepseek.com/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-chat",
    "messages": [{"role": "user", "content": "test"}]
  }'
```

---

## Verification Steps

### Step 1: Check Agents Exist
```bash
# MongoDB Shell
use quickfix
db.users.find({ role: "agent" }).pretty()
```

Expected output:
```json
{
  "_id": "...",
  "name": "John Agent",
  "email": "agent@example.com",
  "role": "agent",
  "availability": "available"  // or undefined (defaults to available)
}
```

### Step 2: Create Test Complaint
```bash
curl -X POST http://localhost:5001/api/complaints \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer USER_TOKEN' \
  -d '{
    "title": "Test Issue",
    "description": "This is a test complaint to check AI assignment",
    "category": "Technical",
    "priority": "Medium"
  }'
```

### Step 3: Check Backend Logs
Look for these log messages:
```
🤖 Attempting AI-powered agent assignment...
📊 Found X agents in database
✅ Y active agents available for assignment
📋 Agent profiles prepared:
   - Agent Name: 2 active tickets, available
🤖 Using DeepSeek AI to assign complaint CMP-12345...
✅ Complaint CMP-12345 AI-assigned to Agent Name (Confidence: 0.85)
```

### Step 4: Verify Assignment in Database
```bash
# MongoDB Shell
db.complaints.findOne({ complaintId: "CMP-12345" })
```

Check for:
- `assignedTo` field has agent ID
- `status` is "In Progress"
- `updates` array contains assignment message with AI metadata

---

## Manual Fix: Assign Existing Unassigned Complaints

If you have old unassigned complaints, trigger AI assignment manually:

### As Admin:
```bash
curl -X POST http://localhost:5001/api/complaints/auto-assign \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer ADMIN_TOKEN' \
  -d '{ "complaintId": "COMPLAINT_ID_HERE" }'
```

### Bulk Assign All Unassigned:
Create a script `bulk_assign.js`:
```javascript
import mongoose from 'mongoose';
import { Complaint } from './src/models/Complaint.js';
import { aiAssignToAgent } from './src/services/ticketAssignmentService.js';

async function bulkAssign() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const unassigned = await Complaint.find({ 
    assignedTo: { $exists: false },
    status: 'Open'
  });
  
  console.log(`Found ${unassigned.length} unassigned complaints`);
  
  for (const complaint of unassigned) {
    console.log(`Assigning ${complaint.complaintId}...`);
    await aiAssignToAgent(complaint._id, null);
  }
  
  await mongoose.disconnect();
  console.log('Done!');
}

bulkAssign();
```

Run it:
```bash
node bulk_assign.js
```

---

## Testing the Refresh Button

### Agent Dashboard:
1. Login as agent
2. Click the refresh icon (🔄) in the top right
3. Dashboard should reload with latest data

### User Dashboard:
1. Login as user
2. Click the refresh icon (🔄) in the top right
3. Dashboard should reload with latest complaints

---

## Expected Behavior

### When User Creates Complaint:

1. **Frontend** sends POST request to `/api/complaints`
2. **Backend** validates and saves complaint
3. **AI Service** queries all agents
4. **AI Service** sends data to DeepSeek
5. **DeepSeek** analyzes and recommends agent
6. **Backend** assigns complaint to agent
7. **Backend** sends WebSocket notification to agent
8. **Agent Dashboard** shows new ticket in real-time

### Console Log Flow:
```
🆕 NEW COMPLAINT CREATION REQUEST
✅ Validation passed
✅ AI APPROVED: Complaint is genuine
💾 Attempting to save complaint to MongoDB...
✅ COMPLAINT SAVED SUCCESSFULLY!
🤖 Attempting AI-powered agent assignment...
📊 Found 3 agents in database
✅ 3 active agents available for assignment
📋 Agent profiles prepared:
   - John Tech: 2 active tickets, available
   - Sarah Support: 1 active tickets, available
   - Mike Service: 0 active tickets, available
🤖 Using DeepSeek AI to assign complaint CMP-12345...
✅ Complaint CMP-12345 AI-assigned to Mike Service (Confidence: 0.92)
   Active tickets: 0
   AI Confidence: 0.92
   Reasoning: Completely free agent with technical expertise
   Method: ai
```

---

## Still Having Issues?

1. **Check logs carefully** - errors are usually clearly logged
2. **Run debug script** - `node debug_assignment.js`
3. **Verify MongoDB connection** - check `MONGODB_URI` in `.env`
4. **Check agent role** - must be exactly `"agent"` (lowercase)
5. **Restart backend** - changes to `.env` require restart

### Get Help:
Include in your issue report:
- Output from `debug_assignment.js`
- Backend console logs (last 50 lines)
- MongoDB query: `db.users.find({ role: "agent" }).count()`
- Environment: Node version, MongoDB version
- API Key status: Set or not set

---

## Recent Changes (Fixed)

✅ **Fixed:** AI assignment now works without strict `availability` field requirement
✅ **Fixed:** Better error logging for debugging
✅ **Added:** Refresh button in Agent Dashboard
✅ **Added:** Refresh button in User Dashboard
✅ **Added:** Debug script for troubleshooting
✅ **Added:** Comprehensive logging at each step

---

Last Updated: November 28, 2025
