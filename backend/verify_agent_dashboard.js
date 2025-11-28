/**
 * Complete test to verify agent assignment and dashboard display
 */

import mongoose from 'mongoose';
import { AgentUser } from './src/models/User.js';
import { Complaint } from './src/models/Complaint.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quickfix';

async function verifyAgentDashboard() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // The agent ID from the screenshot
    const agentId = '6929013efc89c7d2a1eb2d75';
    
    console.log('🔍 Checking Agent:', agentId);
    console.log('═'.repeat(60));
    
    // 1. Verify agent exists
    const agent = await AgentUser.findById(agentId);
    if (!agent) {
      console.log('❌ Agent NOT FOUND in agent collection!');
      process.exit(1);
    }
    
    console.log('\n✅ Agent Found:');
    console.log(`   Name: ${agent.name}`);
    console.log(`   Email: ${agent.email}`);
    console.log(`   Availability: ${agent.availability || 'not set'}`);
    console.log(`   ID: ${agent._id}`);
    
    // 2. Check complaints assigned to this agent
    console.log('\n📋 Checking Assigned Complaints:');
    console.log('─'.repeat(60));
    
    const assignedComplaints = await Complaint.find({ 
      assignedTo: agentId 
    })
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
    
    console.log(`\n   Total assigned: ${assignedComplaints.length}`);
    
    if (assignedComplaints.length === 0) {
      console.log('\n   ⚠️  NO COMPLAINTS ASSIGNED TO THIS AGENT!');
      console.log('   This is why the dashboard shows "No assigned tickets"');
    } else {
      console.log('\n   Assigned complaints:');
      assignedComplaints.forEach((c, idx) => {
        console.log(`\n   ${idx + 1}. ${c.complaintId} - ${c.title}`);
        console.log(`      Status: ${c.status}`);
        console.log(`      Priority: ${c.priority}`);
        console.log(`      Created: ${c.createdAt}`);
        console.log(`      User: ${c.user?.name} (${c.user?.email})`);
      });
    }
    
    // 3. Check all complaints with their assignment status
    console.log('\n\n📊 All Recent Complaints:');
    console.log('─'.repeat(60));
    
    const allComplaints = await Complaint.find({})
      .populate('assignedTo', 'name email')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);
    
    allComplaints.forEach((c, idx) => {
      const assignedInfo = c.assignedTo 
        ? `${c.assignedTo.name} (${c.assignedTo._id})`
        : 'UNASSIGNED';
      console.log(`\n   ${idx + 1}. ${c.complaintId} - ${c.title}`);
      console.log(`      Status: ${c.status}`);
      console.log(`      Assigned To: ${assignedInfo}`);
      console.log(`      Created: ${c.createdAt}`);
    });
    
    // 4. Recommendation
    console.log('\n\n💡 DIAGNOSIS:');
    console.log('═'.repeat(60));
    
    if (assignedComplaints.length === 0) {
      console.log('The agent dashboard is empty because:');
      console.log('   • No complaints are currently assigned to this agent');
      console.log('   • Agent ID: ' + agentId);
      console.log('\nTo test the dashboard:');
      console.log('   1. Create a new complaint through the UI');
      console.log('   2. The AI will automatically assign it to an available agent');
      console.log('   3. The agent dashboard should refresh and show the complaint');
      console.log('   4. The agent will see a popup notification');
    } else {
      console.log('✅ Agent has assigned complaints!');
      console.log('   If not showing in dashboard, check:');
      console.log('   1. Frontend is fetching from /api/complaints');
      console.log('   2. Agent authentication token is valid');
      console.log('   3. WebSocket connection is established');
      console.log('   4. Browser console for errors');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
  }
}

verifyAgentDashboard();
