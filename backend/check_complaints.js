/**
 * Check for existing complaints and assign unassigned ones
 */

import mongoose from 'mongoose';
import { Complaint } from './src/models/Complaint.js';
import { AgentUser } from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quickfix';

async function checkComplaintsAndAgents() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Get all agents
    const agents = await AgentUser.find({});
    console.log(`👥 Agents in database: ${agents.length}`);
    agents.forEach(agent => {
      console.log(`   - ${agent.name} (${agent.email}) - ID: ${agent._id}`);
    });
    console.log();
    
    // Get all complaints
    const allComplaints = await Complaint.find({})
      .populate('assignedTo', 'name email')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);
    
    console.log(`📋 Recent complaints (last 10):`);
    allComplaints.forEach((c, index) => {
      const assignedInfo = c.assignedTo 
        ? `${c.assignedTo.name} (${c.assignedTo.email})`
        : 'Unassigned';
      console.log(`\n${index + 1}. Complaint #${c.complaintId}`);
      console.log(`   Title: ${c.title}`);
      console.log(`   Status: ${c.status}`);
      console.log(`   Assigned To: ${assignedInfo}`);
      console.log(`   User: ${c.user?.name || 'Unknown'}`);
      console.log(`   Created: ${c.createdAt}`);
    });
    
    // Count by status
    console.log('\n📊 Complaint statistics:');
    const stats = await Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count}`);
    });
    
    // Count assigned vs unassigned
    const assigned = await Complaint.countDocuments({ assignedTo: { $exists: true, $ne: null } });
    const unassigned = await Complaint.countDocuments({ 
      $or: [
        { assignedTo: { $exists: false } },
        { assignedTo: null }
      ]
    });
    console.log(`\n   Assigned: ${assigned}`);
    console.log(`   Unassigned: ${unassigned}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📤 Disconnected from MongoDB');
  }
}

checkComplaintsAndAgents();
