import "dotenv/config";
import mongoose from "mongoose";
import { publishEvent } from "./utils/snsPublisher.js";

// Connect to MongoDB to get real agent ID
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;
console.log("🔌 Connecting to MongoDB...");
await mongoose.connect(MONGODB_URI);
console.log("✅ MongoDB connected");

// Import models
const { AgentUser } = await import("./src/models/User.js");
const { Complaint } = await import("./src/models/Complaint.js");

// Find a real agent
const agent = await AgentUser.findOne();
if (!agent) {
  console.log("❌ No agent found in database. Please create an agent first.");
  process.exit(1);
}

console.log(`\n📋 Found agent: ${agent.name} (${agent.email})`);
console.log(`   Agent ID: ${agent._id}`);
console.log(`   Availability: ${agent.availability || 'not set'}`);

// Find a real complaint assigned to this agent
const complaint = await Complaint.findOne({ assignedTo: agent._id, status: { $nin: ['Resolved', 'Closed'] } });

if (!complaint) {
  console.log("\n⚠️  No active complaint assigned to this agent.");
  console.log("   Creating a test scenario anyway...\n");
} else {
  console.log(`\n📋 Found active complaint: ${complaint.complaintId}`);
  console.log(`   Title: ${complaint.title}`);
  console.log(`   Status: ${complaint.status}\n`);
}

// Simulate ticket resolution
console.log("📡 Publishing ticket.resolved event to SNS...\n");

await publishEvent("ticket.resolved", {
  ticketId: complaint?._id.toString() || "test-ticket-id",
  complaintId: complaint?.complaintId || "COMP-TEST",
  agentId: agent._id.toString(),
  resolvedBy: agent._id.toString(),
  resolvedAt: new Date().toISOString(),
  userId: complaint?.user.toString() || "test-user-id",
  title: complaint?.title || "Test Complaint",
  priority: complaint?.priority || "Medium"
});

console.log("✅ Test ticket.resolved event sent to SNS");
console.log("\n🔍 Expected Worker Behavior:");
console.log("   1. Receive event from SQS");
console.log("   2. Check if agent has other active tickets");
console.log("   3. If NO → Mark agent as AVAILABLE");
console.log("   4. Find next unassigned ticket");
console.log("   5. Assign to agent → Mark agent as BUSY");
console.log("   6. Send notification to agent");
console.log("\n👀 Check the worker terminal for output...\n");

await mongoose.disconnect();
process.exit(0);
