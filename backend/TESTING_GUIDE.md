# Testing Guide: Ticket Resolution & Agent Availability

## 🧪 How to Test the Complete Flow

### Setup (Run these in separate terminals):

**Terminal 1 - Backend API:**
```bash
cd backend
npm start
```

**Terminal 2 - Event Worker:**
```bash
cd backend
node worker/sqsWorker.js
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## ✅ Test Scenario 1: Agent Resolves Ticket

### Steps:
1. **Login as Agent** at `localhost:5173`
2. **Go to Agent Dashboard** → My Tickets
3. **Select an In Progress ticket**
4. **Click "Mark as Resolved"** button
5. **Enter resolution message** (e.g., "Issue has been fixed")
6. **Submit**

### Expected Results:

**✅ Backend Console:**
```
🔄 Refreshed agent availability after complaint marked as Resolved
📡 SNS Event published: ticket.resolved for COMP-12345
   Event will trigger worker to mark agent as free and auto-assign next ticket
🔔 Socket events emitted:
   - complaintUpdated to user:67892fd1a2b3c4e5f6789def
   - complaint_status_updated to user:67892fd1a2b3c4e5f6789def
   - complaintStatusChanged (broadcast)
   Status: Resolved
```

**✅ Worker Console:**
```
═══════════════════════════════════════
📬 Event Received: ticket.resolved
📌 Data: { ticketId: '...', agentId: '...', ... }
⏰ Timestamp: 2026-01-17T...
═══════════════════════════════════════

✅ Processing ticket.resolved event
   Ticket ID: COMP-12345
   Agent ID: 692f1f4d36d5cbf8b64c045b
👤 Processing for agent: Gourav Kumar Pandey (gouravkumarpandey292@gmail.com)
📊 Agent Gourav Kumar Pandey has 0 active tickets remaining
✅ Agent Gourav Kumar Pandey marked as AVAILABLE
🎯 Found unassigned ticket: COMP-12346
   Title: Next Issue
   Priority: Medium
   Created: 2026-01-17T...
✅ Ticket COMP-12346 assigned to Gourav Kumar Pandey
📌 Agent Gourav Kumar Pandey marked as BUSY again
🔔 Notification sent to agent Gourav Kumar Pandey

✅ AUTO-ASSIGNMENT COMPLETE
   Previous Ticket: COMP-12345 (Resolved)
   New Ticket: COMP-12346 (Assigned)
   Agent: Gourav Kumar Pandey (gouravkumarpandey292@gmail.com)
   Status: Agent marked BUSY

🗑️  Message deleted from queue
```

**✅ User Dashboard (original complaint creator):**
- Complaint status changes to **"Resolved"** ✅
- Green badge shows "Resolved"
- Browser notification: "Complaint Resolved! 🎉"
- Complaint moves to "Resolved" tab automatically

**✅ Agent Dashboard:**
- Old ticket disappears from "Active" list
- New ticket appears immediately
- Notification: "New Ticket Auto-Assigned"
- Agent status shows "BUSY"

---

## ✅ Test Scenario 2: No Unassigned Tickets Available

### Steps:
1. Make sure there are **NO open unassigned tickets** in the system
2. Agent resolves their last active ticket
3. Observe the behavior

### Expected Results:

**✅ Worker Console:**
```
✅ Processing ticket.resolved event
   Ticket ID: COMP-12345
   Agent ID: 692f1f4d36d5cbf8b64c045b
👤 Processing for agent: Gourav Kumar Pandey
📊 Agent Gourav Kumar Pandey has 0 active tickets remaining
✅ Agent Gourav Kumar Pandey marked as AVAILABLE
ℹ️  No unassigned tickets available for auto-assignment
   Agent Gourav Kumar Pandey remains AVAILABLE for manual assignment
```

**✅ Agent Dashboard:**
- Agent status changes to **"AVAILABLE"** ✅
- No active tickets shown
- Ready to receive new assignments

---

## ✅ Test Scenario 3: Agent Has Multiple Active Tickets

### Steps:
1. Assign **2+ tickets** to the same agent
2. Agent resolves **one ticket**
3. Observe the behavior

### Expected Results:

**✅ Worker Console:**
```
✅ Processing ticket.resolved event
   Ticket ID: COMP-12345
   Agent ID: 692f1f4d36d5cbf8b64c045b
👤 Processing for agent: Gourav Kumar Pandey
📊 Agent Gourav Kumar Pandey has 1 active tickets remaining
📌 Agent Gourav Kumar Pandey still has 1 active tickets
   Agent status remains BUSY - not available for auto-assignment
```

**✅ Agent Dashboard:**
- Agent status remains **"BUSY"** ✅
- Resolved ticket disappears
- Other active tickets still visible
- No new assignment (agent still has work to do)

---

## 🐛 Debugging

### If User Dashboard Doesn't Update:

1. **Check Browser Console:**
   ```
   Look for: "✅ complaintUpdated socket event received:"
   ```

2. **Check Backend Console:**
   ```
   Look for: "🔔 Socket events emitted:"
   ```

3. **Verify Socket Connection:**
   - Open browser DevTools → Network → WS tab
   - Should see active WebSocket connection
   - Check for "connection_success" message

### If Agent Doesn't Get Freed:

1. **Check Backend Console:**
   ```
   Look for: "🔄 Refreshed agent availability after complaint marked as Resolved"
   ```

2. **Check Database:**
   ```javascript
   // MongoDB query
   db.users.findOne({_id: ObjectId("agent_id")})
   // Check: availability field should be "available" or "busy"
   ```

3. **Check Worker Console:**
   ```
   Worker should receive "ticket.resolved" event within 1-10 seconds
   ```

### If Auto-Assignment Fails:

1. **Verify Unassigned Tickets Exist:**
   ```javascript
   // MongoDB query
   db.complaints.find({
     assignedTo: null,
     status: "Open"
   })
   ```

2. **Check Worker Database Connection:**
   ```
   Worker should show: "✅ MongoDB connected for worker"
   ```

3. **Verify Agent ObjectId:**
   ```
   Event data should contain valid MongoDB ObjectId for agentId
   ```

---

## 📝 Summary of Fixes

### What Was Fixed:

1. ✅ **Socket Event Emission** - Now emits to correct room (`user:${userId}`)
2. ✅ **Multiple Event Names** - Listens for both `complaintUpdated` and `complaint_status_updated`
3. ✅ **Complete Complaint Data** - Socket events include full complaint object
4. ✅ **User Room Joining** - Backend joins `user:${userId}` room on connection
5. ✅ **Dashboard Auto-Refresh** - Immediately refreshes on status change
6. ✅ **Browser Notifications** - Shows notification when complaint is resolved
7. ✅ **Agent Availability** - Properly marks agent as free/busy
8. ✅ **Auto-Assignment** - Worker assigns next ticket to newly-free agent
9. ✅ **Event Logging** - Better console logs for debugging

### Files Modified:

- `backend/src/routes/complaints.js` - Socket emission & data population
- `backend/src/socket/handlers/connectionHandler.js` - Room joining
- `frontend/src/contexts/SocketContext.tsx` - Event listeners
- `frontend/src/components/dashboard/UserDashboard.tsx` - Event handling
- `backend/worker/sqsWorker.js` - Enhanced business logic

---

## 🎯 Success Criteria

✅ User dashboard shows "Resolved" status immediately  
✅ Agent gets marked as FREE when no active tickets remain  
✅ Agent automatically receives next ticket if available  
✅ Browser notification appears for resolved complaints  
✅ No manual refresh needed for status updates  
✅ Socket events logged in console for debugging  
✅ Worker processes events within 1-10 seconds  

**Your system is now fully event-driven with real-time updates!** 🚀
