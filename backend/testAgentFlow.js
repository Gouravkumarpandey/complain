import "dotenv/config";
import mongoose from "mongoose";

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;
console.log("🔌 Connecting to MongoDB...");
await mongoose.connect(MONGODB_URI);
console.log("✅ MongoDB connected\n");

// Import models
const { AgentUser } = await import("./src/models/User.js");
const { Complaint } = await import("./src/models/Complaint.js");

console.log("═══════════════════════════════════════════════════════");
console.log("🧪 TESTING AGENT AVAILABILITY & AUTO-ASSIGNMENT");
console.log("═══════════════════════════════════════════════════════\n");

// Find an agent
const agent = await AgentUser.findOne();
if (!agent) {
  console.log("❌ No agent found in database. Please create an agent first.");
  await mongoose.disconnect();
  process.exit(1);
}

console.log(`👤 Testing with agent: ${agent.name} (${agent.email})`);
console.log(`   Agent ID: ${agent._id}`);
console.log(`   Current Availability: ${agent.availability || 'not set'}\n`);

// Check active complaints for this agent
const activeComplaints = await Complaint.find({
  assignedTo: agent._id,
  status: { $nin: ['Resolved', 'Closed'] }
});

console.log(`📊 Agent's Current Active Complaints: ${activeComplaints.length}`);
if (activeComplaints.length > 0) {
  activeComplaints.forEach((c, i) => {
    console.log(`   ${i + 1}. ${c.complaintId} - "${c.title}" (${c.status})`);
  });
} else {
  console.log("   ✅ No active complaints - Agent should be AVAILABLE");
}
console.log();

// Check for unassigned tickets
const unassignedTickets = await Complaint.find({
  $or: [
    { assignedTo: null },
    { assignedTo: { $exists: false } }
  ],
  status: 'Open'
}).sort({ createdAt: 1 });

console.log(`📋 Unassigned Tickets in Database: ${unassignedTickets.length}`);
if (unassignedTickets.length > 0) {
  unassignedTickets.slice(0, 3).forEach((c, i) => {
    console.log(`   ${i + 1}. ${c.complaintId} - "${c.title}" (${c.priority})`);
  });
  if (unassignedTickets.length > 3) {
    console.log(`   ... and ${unassignedTickets.length - 3} more`);
  }
} else {
  console.log("   ⚠️  No unassigned tickets - Worker will not assign anything");
}
console.log();

// Simulate what will happen when ticket is resolved
console.log("═══════════════════════════════════════════════════════");
console.log("🔮 PREDICTED BEHAVIOR WHEN TICKET IS RESOLVED:");
console.log("═══════════════════════════════════════════════════════\n");

if (activeComplaints.length === 0) {
  console.log("✅ Step 1: Agent has NO active complaints");
  console.log("   → Agent will be marked as AVAILABLE");
  console.log();
  
  if (unassignedTickets.length > 0) {
    console.log("✅ Step 2: Unassigned tickets exist");
    console.log(`   → Worker will auto-assign: ${unassignedTickets[0].complaintId}`);
    console.log(`   → Ticket: "${unassignedTickets[0].title}"`);
    console.log("   → Agent will be marked as BUSY again");
  } else {
    console.log("⚠️  Step 2: NO unassigned tickets");
    console.log("   → Agent will remain AVAILABLE");
    console.log("   → No auto-assignment will occur");
  }
} else if (activeComplaints.length === 1) {
  console.log("⚠️  Step 1: Agent has 1 active complaint");
  console.log("   → After resolving this, agent will be AVAILABLE");
  console.log();
  
  if (unassignedTickets.length > 0) {
    console.log("✅ Step 2: Unassigned tickets exist");
    console.log(`   → Worker will auto-assign: ${unassignedTickets[0].complaintId}`);
  } else {
    console.log("⚠️  Step 2: NO unassigned tickets");
    console.log("   → Agent will remain AVAILABLE");
  }
} else {
  console.log(`📌 Step 1: Agent has ${activeComplaints.length} active complaints`);
  console.log("   → After resolving ONE, agent will still be BUSY");
  console.log("   → NO auto-assignment will occur");
  console.log(`   → Agent must resolve ${activeComplaints.length - 1} more tickets to become AVAILABLE`);
}

console.log();
console.log("═══════════════════════════════════════════════════════");
console.log("📝 INSTRUCTIONS TO TEST:");
console.log("═══════════════════════════════════════════════════════\n");

console.log("1. ✅ Make sure Backend is running: npm start");
console.log("2. ✅ Make sure Worker is running: node worker/sqsWorker.js");
console.log("3. ✅ Make sure Frontend is running: npm run dev\n");

console.log("4. Login as Agent in the browser");
console.log("5. Go to 'My Tickets' or Agent Dashboard");
if (activeComplaints.length > 0) {
  console.log(`6. Click on ticket: ${activeComplaints[0].complaintId}`);
  console.log('7. Click "Mark as Resolved" button');
  console.log("8. Enter resolution message and submit\n");
} else {
  console.log("6. ⚠️  NO ACTIVE TICKETS - Assign a ticket to this agent first\n");
}

console.log("═══════════════════════════════════════════════════════");
console.log("👀 WHAT TO WATCH:");
console.log("═══════════════════════════════════════════════════════\n");

console.log("📡 Backend Console should show:");
console.log("   - ✅ Complaint [ID] saved with status: Resolved");
console.log("   - 🔍 Checking agent availability for [agentId]...");
console.log("   - ✅ Agent [name] is now AVAILABLE (if no more tickets)");
console.log("   - 🔄 Agent availability refreshed: available");
console.log("   - 📡 Agent status broadcast: [name] is now available");
console.log("   - 📡 SNS Event published: ticket.resolved\n");

console.log("🔧 Worker Console should show:");
console.log("   - 📬 Event Received: ticket.resolved");
console.log("   - ✅ Processing ticket.resolved event");
console.log("   - 👤 Processing for agent: [name]");
console.log("   - 📊 Agent [name] has 0 active tickets remaining");
console.log("   - ✅ Agent [name] marked as AVAILABLE");
if (unassignedTickets.length > 0) {
  console.log("   - 🎯 Found unassigned ticket: [ID]");
  console.log("   - ✅ Ticket [ID] assigned to [name]");
  console.log("   - 📌 Agent [name] marked as BUSY again");
  console.log("   - 🔔 Notification sent to agent\n");
} else {
  console.log("   - ℹ️  No unassigned tickets available\n");
}

console.log("🖥️  User Dashboard should:");
console.log("   - Show complaint status as 'Resolved' ✅");
console.log("   - Display green badge");
console.log("   - Show browser notification: 'Complaint Resolved! 🎉'\n");

console.log("👨‍💼 Agent Dashboard should:");
if (unassignedTickets.length > 0) {
  console.log("   - Remove resolved ticket from 'Active' list");
  console.log("   - Add new auto-assigned ticket");
  console.log("   - Show notification: 'New Ticket Auto-Assigned'");
  console.log("   - Agent status: BUSY 📌\n");
} else {
  console.log("   - Remove resolved ticket from 'Active' list");
  console.log("   - Agent status: AVAILABLE ✅\n");
}

console.log("═══════════════════════════════════════════════════════\n");

await mongoose.disconnect();
console.log("✅ Test setup complete. You can now test in the browser.\n");
