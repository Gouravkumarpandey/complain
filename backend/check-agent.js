import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/User.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quickfix';
const agentId = '6921f5a8ff19ab681f4cbe1f';

console.log('Connecting to MongoDB:', MONGODB_URI);

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB\n');
    
    // Check if the agent exists
    console.log('🔍 Looking for agent with ID:', agentId);
    const agent = await User.findById(agentId);
    
    if (agent) {
      console.log('✅ Agent found:');
      console.log('   ID:', agent._id);
      console.log('   Name:', agent.name);
      console.log('   Email:', agent.email);
      console.log('   Role:', agent.role);
      console.log('   Availability:', agent.availability);
    } else {
      console.log('❌ Agent not found!');
      
      // List all users
      console.log('\n📋 All users in database:');
      const allUsers = await User.find().select('_id name email role availability');
      allUsers.forEach(user => {
        console.log(`   - ${user._id} | ${user.name} | ${user.email} | ${user.role}`);
      });
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
