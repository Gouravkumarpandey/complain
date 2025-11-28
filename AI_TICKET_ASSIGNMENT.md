# AI-Powered Ticket Assignment System

## Overview

The QuickFix complaint system now uses **DeepSeek AI** to intelligently assign tickets to the most appropriate available agents. This ensures optimal workload distribution, faster response times, and better customer service.

## How It Works

### 1. **User Submits a Complaint**

When a user creates a new complaint through the system:
- The complaint is validated and saved to the database
- AI analyzes the complaint details (title, description, category, priority)

### 2. **AI Finds Available Agents**

The system queries the database for available agents:
- Fetches all agents with role = 'agent'
- Excludes offline agents (only considers 'available' or 'busy' agents)
- Retrieves each agent's current workload (active ticket count)
- Builds agent profiles with relevant information

### 3. **DeepSeek AI Analysis**

The AI service (`deepseekService.js`) analyzes:

**Complaint Details:**
- Title and description content
- Category (Technical, Billing, Service, Product, General)
- Priority level (Low, Medium, High, Urgent)

**Agent Profiles:**
- Current availability status
- Number of active tickets
- Department/expertise area
- Agent ID, name, and email

**Assignment Criteria:**
1. **Availability**: Prefers 'available' over 'busy' agents
2. **Workload Balance**: Chooses agents with fewer active tickets
3. **Expertise Match**: Matches complaint category with agent expertise
4. **Priority Handling**: For urgent tickets, selects less busy agents

### 4. **Intelligent Assignment**

The AI returns:
- **Recommended Agent**: Best-fit agent for the ticket
- **Confidence Score**: How confident the AI is in this decision (0.0-1.0)
- **Reasoning**: Explanation for the assignment decision
- **Estimated Response Time**: Expected time for agent to respond

### 5. **Automatic Updates**

Once assigned:
- Ticket status changes to "In Progress"
- Agent receives real-time notification via WebSocket
- Update log includes AI reasoning and confidence
- Email notification sent to agent

## Code Structure

### Files Modified

1. **`backend/src/services/deepseekService.js`**
   - Added `assignTicketToAgent()` method
   - AI-powered agent selection logic
   - Fallback assignment when AI is unavailable

2. **`backend/src/services/ticketAssignmentService.js`**
   - Added `aiAssignToAgent()` function
   - Integrates with DeepSeek service
   - Handles agent notifications and updates
   - Falls back to basic assignment on error

3. **`backend/src/routes/complaints.js`**
   - Updated complaint creation route to use AI assignment
   - Updated `/auto-assign` endpoint for admin-triggered AI assignment

## API Endpoints

### Automatic Assignment (On Complaint Creation)

**POST** `/api/complaints`

When a user creates a complaint, AI automatically assigns it to an agent.

**Request Body:**
```json
{
  "title": "Internet connection issues",
  "description": "My internet has been down since yesterday morning",
  "category": "Technical",
  "priority": "High"
}
```

**Response:**
```json
{
  "_id": "complaint_id",
  "complaintId": "CMP-12345",
  "title": "Internet connection issues",
  "status": "In Progress",
  "assignedTo": {
    "id": "agent_id",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "updates": [
    {
      "message": "🤖 AI-assigned to John Doe: Technical expertise match with low workload",
      "metadata": {
        "assignmentMethod": "ai",
        "confidence": 0.85,
        "estimatedResponseTime": "2h",
        "aiModel": "deepseek-chat"
      }
    }
  ]
}
```

### Manual AI Assignment (Admin Only)

**POST** `/api/complaints/auto-assign`

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "complaintId": "complaint_id_here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Complaint AI-assigned successfully",
  "assignedTo": {
    "id": "agent_id",
    "name": "Jane Smith",
    "activeTickets": 3
  },
  "aiAssignment": {
    "confidence": 0.92,
    "reasoning": "Best match based on technical expertise and availability",
    "method": "ai",
    "estimatedResponseTime": "1h"
  }
}
```

## Configuration

### Environment Variables

Ensure your `.env` file has:

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_API_URL=https://api.deepseek.com/v1
```

Or for OpenRouter:
```env
DEEPSEEK_API_KEY=sk-or-v1-your_openrouter_key_here
```

### Agent Availability

Agents must have proper availability status in the database:

```javascript
{
  role: 'agent',
  availability: 'available' | 'busy' | 'offline'
}
```

## Fallback Behavior

If AI assignment fails (API error, no API key, etc.), the system automatically falls back to:

1. **Basic Workload Balancing**: Selects agent with fewest active tickets
2. **Availability Priority**: Prefers 'available' over 'busy' agents
3. **Round-Robin**: Distributes tickets evenly

## Benefits

✅ **Intelligent Matching**: AI considers multiple factors for optimal assignment
✅ **Load Balancing**: Prevents agent overload
✅ **Faster Response**: Matches urgent tickets with available agents
✅ **Expertise Alignment**: Routes technical issues to technical experts
✅ **Transparent**: Provides reasoning for each assignment
✅ **Reliable**: Automatic fallback if AI is unavailable

## Monitoring & Logs

### Success Log
```
✅ Complaint CMP-12345 AI-assigned to John Doe (Confidence: 0.85)
   Active tickets: 2
   Reasoning: Technical expertise match with low workload
   Method: ai
```

### Fallback Log
```
⚠️ AI assignment failed, falling back to basic assignment
✅ Complaint CMP-12345 assigned to Jane Smith using fallback method
```

## Testing

### Test Scenario 1: New Complaint Submission

1. Create a new complaint via API or frontend
2. Check console logs for AI assignment messages
3. Verify agent receives notification
4. Check complaint `updates` array for AI reasoning

### Test Scenario 2: Admin Manual Assignment

1. Login as admin
2. Call `/api/complaints/auto-assign` endpoint
3. Verify AI assigns to appropriate agent
4. Check response includes confidence and reasoning

### Test Scenario 3: Fallback Behavior

1. Temporarily set invalid `DEEPSEEK_API_KEY`
2. Create a complaint
3. Verify system falls back to basic assignment
4. Check logs for fallback messages

## Troubleshooting

### Issue: Tickets not being assigned

**Check:**
- Are there agents with `role: 'agent'` in the database?
- Are agents set to 'available' or 'busy' (not 'offline')?
- Is `DEEPSEEK_API_KEY` set in environment variables?

### Issue: AI assignment always fails

**Check:**
- Verify API key is valid
- Check DeepSeek API status
- Review console logs for error messages
- Ensure network connectivity

### Issue: All tickets go to same agent

**Check:**
- Verify other agents are not marked 'offline'
- Check if other agents have high workload
- Review AI confidence scores in logs

## Future Enhancements

🔮 **Planned Features:**
- Agent skills and specialization tracking
- Historical performance-based assignment
- Customer satisfaction scoring
- Time-based availability scheduling
- Multi-language support for international teams
- Agent preference learning

## Support

For issues or questions:
1. Check logs in backend console
2. Review complaint `updates` array for assignment details
3. Contact development team with specific complaint IDs

---

**Last Updated**: November 28, 2025
**AI Model**: DeepSeek R1 / DeepSeek Chat
**System Version**: 1.0.0
