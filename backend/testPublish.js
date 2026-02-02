import "dotenv/config";
import { publishEvent } from "./utils/snsPublisher.js";

await publishEvent("ticket.resolved", {
  ticketId: "TICKET999",
  agentId: "AGENT7",
});

console.log("✅ Test event sent to SNS");
process.exit(0);
