/**
 * Create a test complaint and trigger AI assignment
 */

import mongoose from 'mongoose';
import { User, AgentUser } from './src/models/User.js';
import { Complaint } from './src/models/Complaint.js';
import { aiAssignToAgent } from './src/services/ticketAssignmentService.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quickfix';

async function createTestComplaint() {
  try {
    console.log('🎫 Creating test complaint and triggering AI assignment...\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Check for agents
    const agents = await AgentUser.find({});
    console.log(`👥 Found ${agents.length} agents available\n`);
    
    if (agents.length === 0) {
      console.log('❌ No agents found! Cannot test assignment.');
      process.exit(1);
    }
    
    // Find a regular user (not agent)
    let testUser = await User.findOne({ role: 'user' });
    
    if (!testUser) {
      console.log('⚠️  No regular user found, creating a test user...');
      testUser = await User.create({
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'hashedpassword123',
        role: 'user',
        isVerified: true
      });
      console.log('✅ Created test user\n');
    } else {
      console.log(`✅ Using existing user: ${testUser.name} (${testUser.email})\n`);
    }
    
    // Create a test complaint
    console.log('📝 Creating test complaint...');
    const complaint = await Complaint.create({
      title: 'Urgent: System performance issue',
      description: 'The application is running very slowly and sometimes freezes. This is affecting my work productivity. Please help resolve this as soon as possible.',
      category: 'Technical Support',
      priority: 'High',
      user: testUser._id,
      status: 'Open'
    });
    
    console.log(`✅ Created complaint #${complaint.complaintId}`);
    console.log(`   Title: ${complaint.title}`);
    console.log(`   Priority: ${complaint.priority}`);
    console.log(`   Status: ${complaint.status}\n`);
    
    // Trigger AI assignment
    console.log('🤖 Triggering AI assignment...\n');
    const result = await aiAssignToAgent(complaint._id, null);
    
    if (result.assignedAgent) {
      console.log('✅ SUCCESS! Complaint assigned to agent\n');
      console.log('📋 Assignment Details:');
      console.log(`   Agent: ${result.assignedAgent.name}`);
      console.log(`   Email: ${result.assignedAgent.email}`);
      console.log(`   Method: ${result.assignedAgent.assignmentMethod || 'AI-powered'}`);
      if (result.assignedAgent.reasoning) {
        console.log(`   Reasoning: ${result.assignedAgent.reasoning}`);
      }
      
      // Fetch updated complaint
      const updatedComplaint = await Complaint.findById(complaint._id)
        .populate('assignedTo', 'name email')
        .populate('user', 'name email');
      
      console.log('\n📄 Updated Complaint:');
      console.log(`   ID: ${updatedComplaint.complaintId}`);
      console.log(`   Status: ${updatedComplaint.status}`);
      console.log(`   Assigned To: ${updatedComplaint.assignedTo?.name} (${updatedComplaint.assignedTo?.email})`);
      console.log(`   User: ${updatedComplaint.user?.name}`);
      
      // Check if email is in description
      if (updatedComplaint.description.includes('**Assigned Agent:**')) {
        console.log('   ✅ Agent email added to description');
      } else {
        console.log('   ⚠️  Agent email NOT in description');
      }
      
      // Show latest update
      if (updatedComplaint.updates.length > 0) {
        const latestUpdate = updatedComplaint.updates[updatedComplaint.updates.length - 1];
        console.log(`\n📌 Latest Update:`);
        console.log(`   ${latestUpdate.message}`);
        if (latestUpdate.metadata?.agentEmail) {
          console.log(`   ✅ Agent email in metadata: ${latestUpdate.metadata.agentEmail}`);
        }
      }
      
    } else {
      console.log(`❌ Assignment failed: ${result.message}`);
    }
    
    console.log('\n✅ Test complete!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

createTestComplaint();
