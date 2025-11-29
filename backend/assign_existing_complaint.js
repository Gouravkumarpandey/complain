/**
 * Manually assign an existing complaint to test the dashboard
 */

import mongoose from 'mongoose';
import { AgentUser } from './src/models/User.js';
import { Complaint } from './src/models/Complaint.js';
import { aiAssignToAgent } from './src/services/ticketAssignmentService.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quickfix';

async function assignExistingComplaint() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get the most recent unassigned complaint
    const unassignedComplaint = await Complaint.findOne({
      $or: [
        { assignedTo: { $exists: false } },
        { assignedTo: null }
      ]
    }).sort({ createdAt: -1 });
    
    if (!unassignedComplaint) {
      console.log('❌ No unassigned complaints found');
      process.exit(1);
    }
    
    console.log('📋 Found unassigned complaint:');
    console.log(`   ID: ${unassignedComplaint.complaintId}`);
    console.log(`   Title: ${unassignedComplaint.title}`);
    console.log(`   Status: ${unassignedComplaint.status}`);
    console.log(`   Created: ${unassignedComplaint.createdAt}\n`);
    
    // Get available agents
    const agents = await AgentUser.find({});
    console.log(`👥 Found ${agents.length} agents:\n`);
    agents.forEach((agent, idx) => {
      console.log(`   ${idx + 1}. ${agent.name} (${agent.email})`);
      console.log(`      ID: ${agent._id}`);
      console.log(`      Availability: ${agent.availability || 'not set'}\n`);
    });
    
    if (agents.length === 0) {
      console.log('❌ No agents available');
      process.exit(1);
    }
    
    console.log('🤖 Triggering AI assignment...\n');
    
    // Assign using AI
    const result = await aiAssignToAgent(unassignedComplaint._id, null);
    
    if (result.assignedAgent) {
      console.log('✅ SUCCESS! Complaint assigned\n');
      console.log('📋 Assignment Details:');
      console.log(`   Agent: ${result.assignedAgent.name}`);
      console.log(`   Agent ID: ${result.assignedAgent.id}`);
      console.log(`   Confidence: ${result.assignedAgent.aiAssignment?.confidence || 'N/A'}`);
      console.log(`   Reasoning: ${result.assignedAgent.aiAssignment?.reasoning || 'N/A'}`);
      
      // Fetch the updated complaint
      const updatedComplaint = await Complaint.findById(unassignedComplaint._id)
        .populate('assignedTo', 'name email');
      
      console.log('\n📄 Updated Complaint:');
      console.log(`   ID: ${updatedComplaint.complaintId}`);
      console.log(`   Status: ${updatedComplaint.status}`);
      console.log(`   Assigned To: ${updatedComplaint.assignedTo?.name} (${updatedComplaint.assignedTo?._id})`);
      console.log(`   Agent Email: ${updatedComplaint.assignedTo?.email}`);
      
      console.log('\n✅ The agent should now see this complaint in their dashboard!');
      console.log('   Refresh the agent dashboard page to see the update.');
      
    } else {
      console.log(`❌ Assignment failed: ${result.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
  }
}

assignExistingComplaint();
