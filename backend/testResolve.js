import "dotenv/config";
import { publishEvent } from "./utils/snsPublisher.js";

// Simulate a ticket being resolved
await publishEvent("ticket.resolved", {
  ticketId: "67892fd1a2b3c4e5f6789012",
  complaintId: "COMP-12345",
  agentId: "67892fd1a2b3c4e5f6789abc", // Replace with actual agent ID from your DB
  resolvedBy: "67892fd1a2b3c4e5f6789abc",
  resolvedAt: new Date().toISOString(),
  userId: "67892fd1a2b3c4e5f6789def"
});

console.log("✅ Test ticket.resolved event sent to SNS");
process.exit(0);
