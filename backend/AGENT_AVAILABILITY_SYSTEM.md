# Agent Availability Management System

## Overview
Agent availability is **automatically managed** by the system based on ticket assignment and resolution. Agents **cannot manually** change their availability status.

## Availability States

### 1. **Available** (Free)
- Agent has no active tickets assigned
- Ready to receive new ticket assignments
- Automatically set when all tickets are resolved

### 2. **Busy**
- Agent has one or more active tickets
- Cannot receive automatic assignments (admin can still manually assign)
- Automatically set when a ticket is assigned

### 3. **Offline**
- Agent is not working (set by admin only)
- Cannot receive any assignments

## Automatic State Changes

### When Ticket is Assigned to Agent:
```javascript
// In complaints.js - Manual assignment endpoint
await updateAgentAvailability(agentId, 'busy');
```
**Result:** Agent status changes from "Available" → "Busy"

### When Agent Resolves a Ticket:
```javascript
// In complaints.js - Status update endpoint
if (status === 'Resolved' || status === 'Closed') {
  const updatedAgent = await refreshAgentAvailability(complaint.assignedTo);
  // Checks if agent has any remaining active tickets
  // If no active tickets: status changes to "Available"
  // If active tickets remain: status stays "Busy"
}
```
**Result:** 
- If last ticket → Agent status changes from "Busy" → "Available"
- If more tickets remain → Agent status stays "Busy"

## Backend Implementation

### 1. Protected Routes (Admin Only)
```javascript
// routes/agents.js

// ADMIN ONLY - agents cannot manually change availability
router.patch('/:agentId/availability', authenticate, authorize('admin'), ...)

// ADMIN ONLY - manual refresh
router.post('/:agentId/refresh-availability', authenticate, authorize('admin'), ...)
```

### 2. Agent Service Functions

**updateAgentAvailability(agentId, status)**
- Directly sets agent availability
- Used by system when assigning tickets
- Only callable by admins via API

**refreshAgentAvailability(agentId)**
- Checks agent's active complaint count
- Automatically determines correct status:
  - No active complaints → "Available"
  - Has active complaints → "Busy"
- Used by system when resolving tickets

### 3. Automatic Triggers

**Ticket Assignment:**
```javascript
// routes/complaints.js - PATCH /:id/assign
complaint.assignedTo = agentId;
await updateAgentAvailability(agentId, 'busy');
```

**Ticket Resolution:**
```javascript
// routes/complaints.js - PATCH /:id/status
if (status === 'Resolved' || status === 'Closed') {
  await complaint.save(); // Save first!
  const updatedAgent = await refreshAgentAvailability(complaint.assignedTo);
  // Broadcasts agent status via socket
}
```

## Frontend Implementation

### Agent Dashboard
Agents can **view** their availability status but **cannot change** it:

```tsx
// READ-ONLY Status Display
<div className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
  {agentProfile.availability === 'available' && (
    <>
      <UserCheck className="w-4 h-4 text-green-600" />
      <span className="text-green-700 font-medium">Available</span>
    </>
  )}
  {/* ... other states ... */}
  <span className="text-xs text-gray-500 ml-2">(Auto)</span>
</div>
```

**Previous UI (Removed):**
- ❌ Available button (manual control)
- ❌ Busy button (manual control)
- ❌ Offline button (manual control)

**New UI:**
- ✅ Status badge (read-only indicator)
- ✅ "(Auto)" label to indicate automatic management

## Workflow Example

### Scenario: Agent Resolves Their Last Active Ticket

1. **Agent marks ticket as "Resolved"**
   ```
   PATCH /api/complaints/:id/status
   Body: { status: 'Resolved' }
   ```

2. **Backend saves complaint**
   ```javascript
   complaint.status = 'Resolved';
   await complaint.save();
   ```

3. **Backend sends resolution email to user**
   ```javascript
   await sendComplaintResolvedEmail(user.email, ...);
   ```

4. **Backend refreshes agent availability**
   ```javascript
   const updatedAgent = await refreshAgentAvailability(agentId);
   // Queries: "Does agent have other active tickets?"
   // Result: No → Set to "Available"
   ```

5. **Backend broadcasts agent status**
   ```javascript
   io.emit('agent_status_update', {
     agentId: updatedAgent._id,
     availability: 'available'
   });
   ```

6. **Backend publishes SNS event**
   ```javascript
   await publishEvent('ticket.resolved', { ... });
   ```

7. **SQS Worker receives event**
   ```javascript
   // Finds next unassigned ticket
   // Assigns to now-available agent
   await updateAgentAvailability(agentId, 'busy');
   ```

8. **Agent receives new ticket notification**
   - Status automatically changes back to "Busy"
   - New ticket appears in dashboard

## Benefits

### 1. **Prevents Manual Errors**
- Agents cannot accidentally set themselves as "Available" while having active tickets
- No risk of agents staying "Busy" when they have no work

### 2. **Ensures Fair Distribution**
- Only truly available agents receive new assignments
- Auto-assignment system gets accurate availability data

### 3. **Real-time Accuracy**
- Status updates immediately when tickets are assigned/resolved
- No manual intervention required

### 4. **Audit Trail**
- All status changes are system-driven and logged
- Clear correlation between ticket actions and availability changes

## Admin Override

Admins can still manually control agent availability if needed:

```bash
# Admin can manually set agent offline for vacation/sick leave
PATCH /api/agents/:agentId/availability
Authorization: Bearer <admin-token>
Body: { status: 'offline' }

# Admin can manually refresh if needed
POST /api/agents/:agentId/refresh-availability
Authorization: Bearer <admin-token>
```

This allows for exceptional cases like:
- Setting agent offline for vacation
- Emergency status corrections
- System maintenance

## Testing

### Verify Automatic Availability Management:

1. **Test Ticket Assignment:**
   ```bash
   # Assign ticket to available agent
   # Expected: Agent status changes to "busy"
   ```

2. **Test Ticket Resolution (Last Ticket):**
   ```bash
   # Agent resolves their only active ticket
   # Expected: Agent status changes to "available"
   ```

3. **Test Ticket Resolution (Multiple Tickets):**
   ```bash
   # Agent resolves one of multiple tickets
   # Expected: Agent status stays "busy"
   ```

4. **Test Agent Cannot Change Status:**
   ```bash
   # Agent tries to change their own availability
   # Expected: 403 Forbidden (not authorized)
   ```

5. **Test Admin Can Change Status:**
   ```bash
   # Admin sets agent to offline
   # Expected: 200 OK, status updated
   ```

## Summary

✅ **Agents CANNOT manually change availability**  
✅ **Automatic when ticket assigned** → Busy  
✅ **Automatic when all tickets resolved** → Available  
✅ **Admin can override** for special cases  
✅ **Real-time socket updates** to all clients  
✅ **Prevents manual errors** and ensures accuracy  
