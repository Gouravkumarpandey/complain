# 🚀 Event-Driven Architecture - QuickFix

## Overview
QuickFix now uses AWS SNS + SQS for event-driven ticket assignment and agent management.

## 📋 Flow Diagram

### 1️⃣ Ticket Creation Flow
```
User creates ticket → API saves to MongoDB → Publishes "ticket.created" event to SNS
                                                    ↓
                                            SNS → SQS Queue
                                                    ↓
                                            Worker polls SQS
                                                    ↓
                        Find free agent → Assign ticket → Mark agent BUSY
                                                    ↓
                                        Send notification to agent
```

### 2️⃣ Ticket Resolution Flow
```
Agent marks resolved → API updates MongoDB → Mark agent FREE → Publish "ticket.resolved" to SNS
                                                                            ↓
                                                                    SNS → SQS Queue
                                                                            ↓
                                                                    Worker polls SQS
                                                                            ↓
                    Check if agent has other active tickets → If NO → Find next unassigned ticket
                                                                            ↓
                                                    Assign to same agent → Mark agent BUSY again
                                                                            ↓
                                                            Send notification + Update user dashboard
```

## 📁 Architecture Components

### 1. SNS Publisher (`utils/snsPublisher.js`)
- Publishes events to AWS SNS Topic
- Events: `ticket.created`, `ticket.resolved`

### 2. SQS Worker (`worker/sqsWorker.js`)
- Polls SQS queue for messages
- Handles business logic:
  - **ticket.created**: Assign to free agent
  - **ticket.resolved**: Free agent + auto-assign next ticket

### 3. API Routes (`src/routes/complaints.js`)
- **POST /complaints**: Creates ticket → publishes `ticket.created`
- **PATCH /complaints/:id/status**: Resolves ticket → publishes `ticket.resolved`

## 🔧 Setup Instructions

### Prerequisites
```bash
npm install @aws-sdk/client-sns @aws-sdk/client-sqs dotenv mongoose
```

### Environment Variables (.env)
```env
AWS_REGION=eu-north-1
SNS_TOPIC_ARN=arn:aws:sns:eu-north-1:426757726647:QuickFix
SQS_QUEUE_URL=https://sqs.eu-north-1.amazonaws.com/426757726647/QuickFix
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
MONGODB_URI=your_mongodb_connection_string
```

### AWS Setup
1. **Create SNS Topic**: `QuickFix`
2. **Create SQS Queue**: `QuickFix`
3. **Subscribe Queue to Topic**: Enable **Raw Message Delivery = true**
4. **Set IAM Permissions**: `sns:Publish`, `sqs:ReceiveMessage`, `sqs:DeleteMessage`

## 🚦 Running the System

### Terminal 1: Start Backend API
```bash
cd backend
npm run dev
```

### Terminal 2: Start Event Worker
```bash
cd backend
node worker/sqsWorker.js
```

## 🧪 Testing

### Test 1: Create a ticket via API
```bash
# Create a ticket (API will publish ticket.created event)
curl -X POST http://localhost:5001/api/complaints \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Ticket",
    "description": "Testing event-driven assignment",
    "category": "Technical"
  }'
```

**Expected Behavior:**
1. ✅ Ticket saved in MongoDB
2. 📡 `ticket.created` event published to SNS
3. 📬 Worker receives event from SQS
4. 🎯 Worker assigns ticket to free agent
5. 📌 Agent marked as BUSY
6. 🔔 Notification sent to agent

### Test 2: Resolve a ticket
```bash
# Agent resolves ticket
curl -X PATCH http://localhost:5001/api/complaints/{id}/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer AGENT_TOKEN" \
  -d '{
    "status": "Resolved",
    "message": "Issue fixed!"
  }'
```

**Expected Behavior:**
1. ✅ Ticket status updated to "Resolved" in MongoDB
2. 🆓 Agent marked as FREE (if no other active tickets)
3. 📡 `ticket.resolved` event published to SNS
4. 📬 Worker receives event from SQS
5. 🔍 Worker finds next unassigned ticket
6. 🎯 Worker assigns it to the now-free agent
7. 📌 Agent marked as BUSY again
8. 🔔 Notification sent to agent
9. 📱 User dashboard updated via Socket.IO

## 📊 Event Payloads

### ticket.created
```json
{
  "eventType": "ticket.created",
  "timestamp": "2026-01-17T12:00:00.000Z",
  "data": {
    "ticketId": "67892fd1a2b3c4e5f6789012",
    "complaintId": "COMP-12345",
    "userId": "user_id",
    "title": "Internet issue",
    "category": "Technical",
    "priority": "High",
    "assignedTo": null
  }
}
```

### ticket.resolved
```json
{
  "eventType": "ticket.resolved",
  "timestamp": "2026-01-17T12:30:00.000Z",
  "data": {
    "ticketId": "67892fd1a2b3c4e5f6789012",
    "complaintId": "COMP-12345",
    "agentId": "agent_id",
    "resolvedBy": "agent_id",
    "resolvedAt": "2026-01-17T12:30:00.000Z",
    "userId": "user_id",
    "title": "Internet issue",
    "priority": "High"
  }
}
```

## 🔄 Agent Availability States

| State | Description | Triggers |
|-------|-------------|----------|
| `available` | Agent has no active tickets | Ticket resolved + no other active tickets |
| `busy` | Agent has 1+ active tickets | Ticket assigned to agent |
| `offline` | Agent is not working | Manual toggle |

## 📈 Benefits

1. **Scalability**: Worker can be scaled independently
2. **Reliability**: SQS ensures messages are processed
3. **Decoupling**: API and business logic are separated
4. **Async Processing**: Non-blocking operations
5. **Auto-Assignment**: Agents get new tickets automatically
6. **Real-time Updates**: User dashboard updates via Socket.IO

## 🐛 Troubleshooting

### Worker not receiving messages
- Check SQS queue URL in `.env`
- Verify SNS subscription to SQS (Raw Message Delivery = true)
- Check IAM permissions

### Agent not getting assigned
- Ensure at least one agent has `availability: 'available'`
- Check MongoDB connection in worker
- Verify event payload contains valid ObjectIds

### User dashboard not updating
- Ensure Socket.IO is properly initialized
- Check that `io.to('user:${userId}')` rooms are joined
- Verify frontend is listening for `complaintUpdated` event

## 🎯 Next Steps

- [ ] Add retry logic for failed assignments
- [ ] Implement DLQ (Dead Letter Queue) for failed events
- [ ] Add metrics/analytics for event processing
- [ ] Scale workers horizontally
- [ ] Add event replay capability
