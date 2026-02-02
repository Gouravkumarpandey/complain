import "dotenv/config";
import mongoose from "mongoose";

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;
console.log("🔌 Connecting to MongoDB...");
await mongoose.connect(MONGODB_URI);
console.log("✅ MongoDB connected");

// Import models
const { Complaint } = await import("./src/models/Complaint.js");
const { User } = await import("./src/models/User.js");

console.log("\n===========================================");
console.log("TEST: Status Update Persistence");
console.log("===========================================\n");

// Find a test complaint (In Progress status)
const testComplaint = await Complaint.findOne({ 
  status: 'In Progress' 
}).populate('assignedTo', 'name email');

if (!testComplaint) {
  console.log("❌ No 'In Progress' complaint found for testing");
  console.log("Please create a test complaint first");
  process.exit(1);
}

console.log("📋 Test Complaint Found:");
console.log(`   ID: ${testComplaint.complaintId}`);
console.log(`   Title: ${testComplaint.title}`);
console.log(`   Current Status: ${testComplaint.status}`);
console.log(`   Assigned To: ${testComplaint.assignedTo?.name || 'Unassigned'}\n`);

// Test 1: Update status to Resolved
console.log("TEST 1: Updating status to 'Resolved'...");
const oldStatus = testComplaint.status;
testComplaint.status = 'Resolved';
testComplaint.resolution = {
  description: 'Test resolution',
  resolvedBy: testComplaint.assignedTo?._id || null,
  resolvedAt: new Date()
};

console.log(`   Status changed in memory: ${oldStatus} → ${testComplaint.status}`);
console.log(`   Modified? ${testComplaint.isModified('status')}`);

// Save
await testComplaint.save();
console.log(`   ✅ Saved to database\n`);

// Test 2: Verify by re-fetching
console.log("TEST 2: Verifying persistence by re-fetching...");
const verified = await Complaint.findById(testComplaint._id).lean();
console.log(`   Status in DB: ${verified.status}`);
console.log(`   Resolution present: ${!!verified.resolution}`);

if (verified.status === 'Resolved') {
  console.log(`   ✅ SUCCESS: Status persisted correctly\n`);
} else {
  console.log(`   ❌ FAILURE: Status did not persist!`);
  console.log(`      Expected: Resolved`);
  console.log(`      Got: ${verified.status}\n`);
}

// Test 3: Check if any hooks/middleware might be changing it
console.log("TEST 3: Checking complaint schema hooks...");
const schema = Complaint.schema;
console.log(`   Pre-save hooks: ${schema.s.hooks._pres.get('save')?.length || 0}`);
console.log(`   Post-save hooks: ${schema.s.hooks._posts.get('save')?.length || 0}`);

// Test 4: Revert back to In Progress
console.log("\nTEST 4: Reverting status back to 'In Progress'...");
testComplaint.status = 'In Progress';
testComplaint.resolution = undefined;
await testComplaint.save();
console.log(`   ✅ Reverted for next test\n`);

// Final verification
const finalCheck = await Complaint.findById(testComplaint._id).lean();
console.log("FINAL STATE:");
console.log(`   Status: ${finalCheck.status}`);
console.log(`   Expected: In Progress`);

if (finalCheck.status === 'In Progress') {
  console.log(`   ✅ Revert successful\n`);
} else {
  console.log(`   ⚠️  Warning: Status is ${finalCheck.status}\n`);
}

console.log("===========================================");
console.log("Test Complete!");
console.log("===========================================\n");

await mongoose.disconnect();
process.exit(0);
