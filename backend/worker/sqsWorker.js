import "dotenv/config";
import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
} from "@aws-sdk/client-sqs";
import mongoose from "mongoose";

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;
console.log("🔌 Connecting to MongoDB...");
await mongoose.connect(MONGODB_URI);
console.log("✅ MongoDB connected for worker");

// Import models and services
const { Complaint } = await import("../src/models/Complaint.js");
const { AgentUser } = await import("../src/models/User.js");
const { updateAgentAvailability } = await import("../src/services/agentService.js");
const { createNotification } = await import("../src/services/notificationService.js");

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Handle ticket.created event
async function handleTicketCreated(data) {
  console.log("📝 Processing ticket.created event");
  console.log("   Ticket ID:", data.complaintId);
  console.log("   Assigned To:", data.assignedTo || "Unassigned");
  
  // If ticket is already assigned, no action needed
  if (data.assignedTo) {
    console.log("ℹ️  Ticket already assigned during creation, skipping worker assignment");
    return;
  }
  
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(data.ticketId)) {
      console.log("❌ Invalid ticket ID format:", data.ticketId);
      return;
    }
    
    // Find a free agent
    const freeAgent = await AgentUser.findOne({ availability: 'available' });
    
    if (!freeAgent) {
      console.log("⚠️  No free agents available for auto-assignment");
      return;
    }
    
    console.log(`👤 Found free agent: ${freeAgent.name} (${freeAgent.email})`);
    
    // Get the ticket
    const ticket = await Complaint.findById(data.ticketId);
    if (!ticket) {
      console.log("❌ Ticket not found:", data.ticketId);
      return;
    }
    
    // Check if ticket is still unassigned
    if (ticket.assignedTo) {
      console.log("ℹ️  Ticket was already assigned, skipping");
      return;
    }
    
    console.log(`🎯 Assigning ticket ${ticket.complaintId} to ${freeAgent.name}`);
    
    // Assign the ticket
    ticket.assignedTo = freeAgent._id;
    ticket.status = 'In Progress';
    ticket.updates.push({
      message: `🤖 Auto-assigned to ${freeAgent.name} (${freeAgent.email}) by event worker`,
      updatedBy: freeAgent._id,
      updateType: 'assignment',
      previousValue: 'Unassigned',
      newValue: `${freeAgent.name} (${freeAgent.email})`,
      metadata: {
        assignmentMethod: 'event-driven-worker-assignment',
        triggeredBy: 'ticket.created',
        agentEmail: freeAgent.email
      },
      createdAt: new Date(),
      isInternal: false
    });
    
    await ticket.save();
    
    // Mark agent as busy
    await updateAgentAvailability(freeAgent._id, 'busy');
    console.log(`📌 Agent ${freeAgent.name} marked as BUSY`);
    
    // Send notification to agent
    await createNotification({
      userId: freeAgent._id,
      title: 'New Ticket Assigned',
      message: `🎯 Ticket #${ticket.complaintId} "${ticket.title}" has been assigned to you`,
      type: 'complaint_assigned',
      priority: ticket.priority === 'High' || ticket.priority === 'Critical' ? 'high' : 'medium',
      complaintId: ticket._id,
      data: { 
        complaintId: ticket.complaintId,
        autoAssigned: true,
        assignedBy: 'worker'
      }
    });
    
    console.log(`✅ Ticket ${ticket.complaintId} assigned to ${freeAgent.name}`);
    console.log(`🔔 Notification sent to agent`);
    
  } catch (error) {
    console.error("❌ Error in handleTicketCreated:", error);
    console.error("   Error name:", error.name);
    console.error("   Error message:", error.message);
  }
}

// Handle ticket.resolved event
async function handleTicketResolved(data) {
  console.log("✅ Processing ticket.resolved event");
  console.log("   Ticket ID:", data.complaintId);
  console.log("   Agent ID:", data.agentId);
  
  if (!data.agentId) {
    console.log("⚠️  No agent assigned to this ticket, skipping auto-assignment");
    return;
  }
  
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(data.agentId)) {
      console.log("❌ Invalid agent ID format:", data.agentId);
      return;
    }
    
    // Step 1: Check agent's availability
    const agent = await AgentUser.findById(data.agentId);
    if (!agent) {
      console.log("❌ Agent not found:", data.agentId);
      return;
    }
    
    console.log(`👤 Processing for agent: ${agent.name} (${agent.email})`);
    
    // Step 2: Check if agent has any remaining active complaints
    const activeCount = await Complaint.countDocuments({
      assignedTo: data.agentId,
      status: { $nin: ['Resolved', 'Closed'] }
    });
    
    console.log(`📊 Agent ${agent.name} has ${activeCount} active tickets remaining`);
    
    if (activeCount === 0) {
      // Step 3: Mark agent as available
      await updateAgentAvailability(data.agentId, 'available');
      console.log(`✅ Agent ${agent.name} marked as AVAILABLE`);
      
      // Step 4: Find next unassigned ticket (status Open and no agent assigned)
      const nextTicket = await Complaint.findOne({
        $or: [
          { assignedTo: null },
          { assignedTo: { $exists: false } }
        ],
        status: 'Open'
      }).sort({ createdAt: 1 }); // Get oldest unassigned ticket
      
      if (nextTicket) {
        console.log(`🎯 Found unassigned ticket: ${nextTicket.complaintId}`);
        console.log(`   Title: ${nextTicket.title}`);
        console.log(`   Priority: ${nextTicket.priority}`);
        console.log(`   Created: ${nextTicket.createdAt}`);
        
        // Step 5: Assign next ticket to the now-available agent
        nextTicket.assignedTo = data.agentId;
        nextTicket.status = 'In Progress';
        nextTicket.updates.push({
          message: `🤖 Auto-assigned to ${agent.name} (${agent.email}) after completing previous ticket ${data.complaintId}`,
          updatedBy: data.agentId,
          updateType: 'assignment',
          previousValue: 'Unassigned',
          newValue: `${agent.name} (${agent.email})`,
          metadata: {
            assignmentMethod: 'event-driven-auto-assignment',
            triggeredBy: 'ticket.resolved',
            previousTicket: data.complaintId,
            agentEmail: agent.email
          },
          createdAt: new Date(),
          isInternal: false
        });
        
        await nextTicket.save();
        
        // Mark agent as busy again
        await updateAgentAvailability(data.agentId, 'busy');
        console.log(`✅ Ticket ${nextTicket.complaintId} assigned to ${agent.name}`);
        console.log(`📌 Agent ${agent.name} marked as BUSY again`);
        
        // Step 6: Send notification to agent
        await createNotification({
          userId: data.agentId,
          title: 'New Ticket Auto-Assigned',
          message: `🎯 Ticket #${nextTicket.complaintId} "${nextTicket.title}" has been automatically assigned to you after completing ${data.complaintId}`,
          type: 'complaint_assigned',
          priority: nextTicket.priority === 'High' || nextTicket.priority === 'Critical' ? 'high' : 'medium',
          complaintId: nextTicket._id,
          data: { 
            complaintId: nextTicket.complaintId,
            previousComplaint: data.complaintId,
            autoAssigned: true
          }
        });
        
        console.log(`🔔 Notification sent to agent ${agent.name}`);
        console.log(`\n✅ AUTO-ASSIGNMENT COMPLETE`);
        console.log(`   Previous Ticket: ${data.complaintId} (Resolved)`);
        console.log(`   New Ticket: ${nextTicket.complaintId} (Assigned)`);
        console.log(`   Agent: ${agent.name} (${agent.email})`);
        console.log(`   Status: Agent marked BUSY\n`);
      } else {
        console.log("ℹ️  No unassigned tickets available for auto-assignment");
        console.log(`   Agent ${agent.name} remains AVAILABLE for manual assignment`);
      }
    } else {
      console.log(`📌 Agent ${agent.name} still has ${activeCount} active tickets`);
      console.log(`   Agent status remains BUSY - not available for auto-assignment`);
    }
    
  } catch (error) {
    console.error("❌ Error in handleTicketResolved:", error);
    console.error("   Error name:", error.name);
    console.error("   Error message:", error.message);
    console.error("   Stack:", error.stack);
  }
}

async function pollMessages() {
  try {
    const res = await sqsClient.send(
      new ReceiveMessageCommand({
        QueueUrl: process.env.SQS_QUEUE_URL,
        MaxNumberOfMessages: 5,
        WaitTimeSeconds: 10,
      })
    );

    if (!res.Messages) return;

    for (const msg of res.Messages) {
      let event;
      
      // Try to parse the message body
      const body = JSON.parse(msg.Body);
      
      // Check if it's wrapped in SNS format
      if (body.Message) {
        // SNS message format - extract the actual message
        event = JSON.parse(body.Message);
      } else {
        // Raw message delivery enabled
        event = body;
      }

      console.log("\n═══════════════════════════════════════");
      console.log("📬 Event Received:", event.eventType);
      console.log("📌 Data:", event.data);
      console.log("⏰ Timestamp:", event.timestamp);
      console.log("═══════════════════════════════════════\n");
      
      // Route events to handlers
      try {
        switch (event.eventType) {
          case 'ticket.created':
            await handleTicketCreated(event.data);
            break;
          case 'ticket.resolved':
            await handleTicketResolved(event.data);
            break;
          default:
            console.log(`⚠️  Unknown event type: ${event.eventType}`);
        }
      } catch (handlerError) {
        console.error(`❌ Error handling ${event.eventType}:`, handlerError);
        // Continue processing other messages even if one fails
      }

      // Delete message from queue after processing
      await sqsClient.send(
        new DeleteMessageCommand({
          QueueUrl: process.env.SQS_QUEUE_URL,
          ReceiptHandle: msg.ReceiptHandle,
        })
      );
      
      console.log("🗑️  Message deleted from queue\n");
    }
  } catch (error) {
    console.error("❌ Error polling messages:", error);
  }
}

console.log("🚀 QuickFix Event Worker running...");
console.log("📡 Listening for events on SQS queue:", process.env.SQS_QUEUE_URL);
console.log("🔄 Polling interval: 1.5 seconds\n");
setInterval(pollMessages, 1500);
