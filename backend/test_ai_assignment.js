/**
 * Test script for AI-powered ticket assignment
 * 
 * This script demonstrates how to test the AI assignment feature
 */

// Test data: Sample complaints
const testComplaints = [
  {
    title: "Internet connection down",
    description: "My internet has been completely down since yesterday morning. I work from home and this is urgent. Need immediate assistance.",
    category: "Technical",
    priority: "High"
  },
  {
    title: "Billing discrepancy",
    description: "I noticed I was charged twice for my monthly subscription. Can someone review my account and process a refund?",
    category: "Billing",
    priority: "Medium"
  },
  {
    title: "Product quality issue",
    description: "The product I received is damaged and not working as advertised. I would like a replacement.",
    category: "Product",
    priority: "High"
  },
  {
    title: "General inquiry",
    description: "I would like to know more about your premium plans and what additional features are included.",
    category: "General",
    priority: "Low"
  },
  {
    title: "Service request",
    description: "I need to schedule a technician visit for installation. Preferably this week.",
    category: "Service",
    priority: "Medium"
  }
];

// Test data: Sample agents
const testAgents = [
  {
    _id: "agent001",
    name: "John Tech",
    email: "john@example.com",
    activeTickets: 2,
    availability: "available",
    department: "Technical Support",
    expertise: "Technical"
  },
  {
    _id: "agent002",
    name: "Sarah Billing",
    email: "sarah@example.com",
    activeTickets: 1,
    availability: "available",
    department: "Billing Department",
    expertise: "Billing"
  },
  {
    _id: "agent003",
    name: "Mike Service",
    email: "mike@example.com",
    activeTickets: 0,
    availability: "available",
    department: "Customer Service",
    expertise: "General"
  },
  {
    _id: "agent004",
    name: "Lisa Support",
    email: "lisa@example.com",
    activeTickets: 5,
    availability: "busy",
    department: "General Support",
    expertise: "General"
  }
];

console.log("╔════════════════════════════════════════════════════════╗");
console.log("║     AI-POWERED TICKET ASSIGNMENT TEST SUITE           ║");
console.log("╚════════════════════════════════════════════════════════╝");
console.log();

console.log("📋 Test Complaints:");
testComplaints.forEach((complaint, index) => {
  console.log(`${index + 1}. [${complaint.priority}] ${complaint.title}`);
  console.log(`   Category: ${complaint.category}`);
  console.log(`   Description: ${complaint.description.substring(0, 60)}...`);
  console.log();
});

console.log("👥 Available Agents:");
testAgents.forEach((agent, index) => {
  console.log(`${index + 1}. ${agent.name} (${agent.expertise})`);
  console.log(`   Status: ${agent.availability} | Active Tickets: ${agent.activeTickets}`);
  console.log();
});

console.log("═══════════════════════════════════════════════════════");
console.log("🤖 AI Assignment Logic:");
console.log("═══════════════════════════════════════════════════════");
console.log();
console.log("The AI will analyze each complaint and assign it based on:");
console.log("1. ✅ Agent availability (available > busy)");
console.log("2. ⚖️  Workload balance (fewer active tickets preferred)");
console.log("3. 🎯 Expertise match (category matching)");
console.log("4. 🚨 Priority handling (urgent tickets to less busy agents)");
console.log();

console.log("═══════════════════════════════════════════════════════");
console.log("Expected Assignments:");
console.log("═══════════════════════════════════════════════════════");
console.log();

console.log("1. Internet connection down (Technical, High Priority)");
console.log("   → Expected: John Tech (Technical expertise, available)");
console.log("   → Reasoning: Technical issue + high priority + available");
console.log();

console.log("2. Billing discrepancy (Billing, Medium Priority)");
console.log("   → Expected: Sarah Billing (Billing expertise, least busy)");
console.log("   → Reasoning: Perfect expertise match + low workload");
console.log();

console.log("3. Product quality issue (Product, High Priority)");
console.log("   → Expected: Mike Service (0 active tickets, available)");
console.log("   → Reasoning: High priority + completely free agent");
console.log();

console.log("4. General inquiry (General, Low Priority)");
console.log("   → Expected: Mike Service or Sarah Billing");
console.log("   → Reasoning: Low priority + low workload agents");
console.log();

console.log("5. Service request (Service, Medium Priority)");
console.log("   → Expected: Mike Service (Customer Service)");
console.log("   → Reasoning: Service category match + available");
console.log();

console.log("═══════════════════════════════════════════════════════");
console.log("🧪 How to Test:");
console.log("═══════════════════════════════════════════════════════");
console.log();
console.log("1. Start the backend server:");
console.log("   cd backend && npm start");
console.log();
console.log("2. Create test agents in database (if not exists):");
console.log("   POST /api/auth/register");
console.log("   { role: 'agent', name: 'John Tech', email: '...' }");
console.log();
console.log("3. Submit test complaints:");
console.log("   POST /api/complaints");
console.log("   { title: '...', description: '...', category: '...' }");
console.log();
console.log("4. Watch console logs for AI assignment:");
console.log("   Look for: '🤖 Using DeepSeek AI to assign...'");
console.log("   Check: Confidence score, reasoning, assigned agent");
console.log();
console.log("5. Verify in database:");
console.log("   Check complaint.assignedTo field");
console.log("   Review complaint.updates array for AI metadata");
console.log();

console.log("═══════════════════════════════════════════════════════");
console.log("📊 Success Indicators:");
console.log("═══════════════════════════════════════════════════════");
console.log();
console.log("✅ Complaint assigned to appropriate agent");
console.log("✅ AI reasoning logged in console");
console.log("✅ Confidence score between 0.6-1.0");
console.log("✅ Agent receives real-time notification");
console.log("✅ Ticket status changes to 'In Progress'");
console.log("✅ Update log contains AI metadata");
console.log();

console.log("═══════════════════════════════════════════════════════");
console.log("🔧 API Testing with curl:");
console.log("═══════════════════════════════════════════════════════");
console.log();

console.log("# Login as user");
console.log("curl -X POST http://localhost:5001/api/auth/login \\");
console.log("  -H 'Content-Type: application/json' \\");
console.log("  -d '{\"email\":\"user@example.com\",\"password\":\"password123\"}'");
console.log();

console.log("# Create complaint (triggers AI assignment)");
console.log("curl -X POST http://localhost:5001/api/complaints \\");
console.log("  -H 'Content-Type: application/json' \\");
console.log("  -H 'Authorization: Bearer YOUR_TOKEN' \\");
console.log("  -d '{");
console.log("    \"title\": \"Internet connection down\",");
console.log("    \"description\": \"My internet has been down since yesterday\",");
console.log("    \"category\": \"Technical\",");
console.log("    \"priority\": \"High\"");
console.log("  }'");
console.log();

console.log("# Admin manual AI assignment");
console.log("curl -X POST http://localhost:5001/api/complaints/auto-assign \\");
console.log("  -H 'Content-Type: application/json' \\");
console.log("  -H 'Authorization: Bearer ADMIN_TOKEN' \\");
console.log("  -d '{\"complaintId\": \"COMPLAINT_ID_HERE\"}'");
console.log();

console.log("═══════════════════════════════════════════════════════");
console.log("✨ Test completed! Follow the steps above to test the AI assignment.");
console.log("═══════════════════════════════════════════════════════");
