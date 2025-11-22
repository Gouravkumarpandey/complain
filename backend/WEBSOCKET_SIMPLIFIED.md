# WebSocket Usage - SIMPLIFIED

## Purpose
WebSocket is used for **ONE THING ONLY**: Notify agents in real-time when a complaint is assigned to them.

## How It Works

### 1. User Creates Complaint
```
User submits complaint → Backend creates complaint in database
```

### 2. Auto-Assignment to Free Agent
```javascript
// Backend checks for agents with 0 active tasks
const freeAgents = agents.filter(agent => agent.activeTickets === 0);

// Assigns to first free agent
complaint.assignedTo = freeAgent.id;
```

### 3. WebSocket Notification (INSTANT)
```javascript
// Agent receives real-time notification
io.to(`agent:${agentId}`).emit('new_complaint_assigned', {
  complaintId: complaint._id,
  title: complaint.title,
  priority: complaint.priority,
  message: 'New complaint assigned to you'
});
```

### 4. Agent Dashboard Updates
```javascript
// Frontend listens for notification
socket.on('new_complaint_assigned', (data) => {
  // Show notification popup
  showNotification(`New ${data.priority} priority complaint: ${data.title}`);
  
  // Refresh complaint list
  fetchMyComplaints();
});
```

## Files Modified

1. **`ticketAssignmentService.js`**
   - `autoAssignToFreeAgent()` - Finds agent with 0 tasks and assigns complaint
   - Sends WebSocket notification to assigned agent

2. **`complaintHandler.js`** (SIMPLIFIED)
   - Removed all complex socket events
   - Only exports `notifyAgentAssignment()` function
   - Single purpose: Send notification to agent

3. **`agentHandler.js`** (SIMPLIFIED)
   - Removed workload tracking
   - Removed status updates
   - Only tracks basic agent connection

4. **`complaints.js` (routes)**
   - Calls `autoAssignToFreeAgent()` when complaint is created
   - Passes `io` instance for real-time notification

## What Was Removed

❌ Complex socket events (join_complaint, leave_complaint, etc.)
❌ Status update broadcasts
❌ Dashboard real-time updates
❌ Agent workload broadcasting
❌ Manual assignment via WebSocket
❌ Complaint status tracking via WebSocket

## What Remains

✅ Agent assignment notification (when free agent gets new task)
✅ Simple, focused, single-purpose WebSocket usage

## Benefits

- **Simpler code** - Easy to understand and maintain
- **Less overhead** - No unnecessary real-time updates
- **Focused** - WebSocket does one thing well
- **Scalable** - Minimal WebSocket connections needed
