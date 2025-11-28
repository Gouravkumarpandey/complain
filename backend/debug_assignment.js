/**
 * Debug script to test AI assignment
 * Run this to check if agents are properly configured and if AI assignment works
 */

import mongoose from 'mongoose';
import { User, AgentUser } from './src/models/User.js';
import { Complaint } from './src/models/Complaint.js';
import { aiAssignToAgent } from './src/services/ticketAssignmentService.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quickfix';

async function debugAIAssignment() {
  try {
    console.log('🔍 Debugging AI Assignment System...\n');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Check for agents
    console.log('👥 Checking for agents in database...');
    const allAgents = await AgentUser.find({});
    console.log(`   Found ${allAgents.length} agents\n`);
    
    if (allAgents.length === 0) {
      console.log('❌ NO AGENTS FOUND!');
      console.log('   Solution: Create at least one agent user:');
      console.log('   POST /api/auth/register');
      console.log('   { "name": "Test Agent", "email": "agent@test.com", "password": "password123", "role": "agent" }\n');
      await mongoose.disconnect();
      return;
    }
    
    // Display agent details
    console.log('📋 Agent Details:');
    for (const agent of allAgents) {
      const activeTickets = await Complaint.countDocuments({
        assignedTo: agent._id,
        status: { $nin: ['Resolved', 'Closed'] }
      });
      
      console.log(`   ${agent.name} (${agent.email})`);
      console.log(`   - ID: ${agent._id}`);
      console.log(`   - Availability: ${agent.availability || 'NOT SET (will default to available)'}`);
      console.log(`   - Active Tickets: ${activeTickets}`);
      console.log('');
    }
    
    // Check for unassigned complaints
    console.log('🎫 Checking for unassigned complaints...');
    const unassignedComplaints = await Complaint.find({ 
      assignedTo: { $exists: false } 
    }).sort({ createdAt: -1 }).limit(5);
    
    console.log(`   Found ${unassignedComplaints.length} unassigned complaints\n`);
    
    if (unassignedComplaints.length === 0) {
      console.log('ℹ️  No unassigned complaints to test with.');
      console.log('   Create a complaint through the UI or API to test assignment.\n');
    } else {
      // Test AI assignment on first unassigned complaint
      const testComplaint = unassignedComplaints[0];
      console.log(`🧪 Testing AI assignment on complaint: ${testComplaint.complaintId}`);
      console.log(`   Title: ${testComplaint.title}`);
      console.log(`   Category: ${testComplaint.category}`);
      console.log(`   Priority: ${testComplaint.priority}\n`);
      
      console.log('🤖 Calling aiAssignToAgent...\n');
      
      const result = await aiAssignToAgent(testComplaint._id, null);
      
      if (result.assignedAgent) {
        console.log('✅ SUCCESS! Complaint assigned!');
        console.log(`   Agent: ${result.assignedAgent.name}`);
        console.log(`   Active Tickets: ${result.assignedAgent.activeTickets}`);
        if (result.assignedAgent.aiAssignment) {
          console.log(`   AI Confidence: ${result.assignedAgent.aiAssignment.confidence}`);
          console.log(`   AI Reasoning: ${result.assignedAgent.aiAssignment.reasoning}`);
          console.log(`   Assignment Method: ${result.assignedAgent.aiAssignment.method}`);
        }
      } else {
        console.log('❌ FAILED! Complaint not assigned');
        console.log(`   Message: ${result.message}`);
      }
      console.log('');
    }
    
    // Check environment variables
    console.log('🔧 Environment Configuration:');
    console.log(`   DEEPSEEK_API_KEY: ${process.env.DEEPSEEK_API_KEY ? '✅ Set' : '❌ NOT SET'}`);
    if (process.env.DEEPSEEK_API_KEY) {
      const keyPrefix = process.env.DEEPSEEK_API_KEY.substring(0, 10);
      const isOpenRouter = process.env.DEEPSEEK_API_KEY.startsWith('sk-or-v1-');
      console.log(`   Key Prefix: ${keyPrefix}...`);
      console.log(`   Provider: ${isOpenRouter ? 'OpenRouter' : 'DeepSeek'}`);
    } else {
      console.log('   ⚠️  AI assignment will use fallback method (workload-based)');
    }
    console.log('');
    
    // Recommendations
    console.log('💡 Recommendations:');
    
    if (allAgents.length === 0) {
      console.log('   1. Create agent users in the database');
    }
    
    const agentsWithoutAvailability = allAgents.filter(a => !a.availability);
    if (agentsWithoutAvailability.length > 0) {
      console.log(`   2. Set availability for ${agentsWithoutAvailability.length} agents (currently defaulting to 'available')`);
      console.log('      This is optional but recommended for better control');
    }
    
    if (!process.env.DEEPSEEK_API_KEY) {
      console.log('   3. Set DEEPSEEK_API_KEY in .env file for AI-powered assignment');
      console.log('      Without it, the system uses simple workload-based assignment');
    }
    
    console.log('');
    console.log('✅ Debug complete!');
    
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
    
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

debugAIAssignment();
