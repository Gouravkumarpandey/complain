import { User } from '../models/User.js';
import { Complaint } from '../models/Complaint.js';
import { createNotification } from './notificationService.js';

/**
 * Find a free agent (with no assigned tasks) and assign complaint
 * @param {string} complaintId - The ID of the complaint to assign
 * @param {object} io - Socket.io instance for real-time notifications
 * @returns {Promise<object>} The assigned agent and updated complaint
 */
export const autoAssignToFreeAgent = async (complaintId, io = null) => {
  try {
    const complaint = await Complaint.findById(complaintId);
    
    if (!complaint) {
      throw new Error(`Complaint ${complaintId} not found`);
    }
    
    if (complaint.assignedTo) {
      console.log(`Complaint ${complaintId} is already assigned`);
      return { complaint, assignedAgent: null, message: 'Already assigned' };
    }
    
    // Find agents with ZERO active tickets (completely free)
    const agents = await User.find({ role: 'agent' }).lean();
    
    if (!agents || agents.length === 0) {
      console.log('No agents available in the system');
      return { complaint, assignedAgent: null, message: 'No agents found' };
    }
    
    // Get the counts of active complaints per agent
    const agentLoads = await Promise.all(
      agents.map(async (agent) => {
        const activeTicketCount = await Complaint.countDocuments({
          assignedTo: agent._id,
          status: { $nin: ['Resolved', 'Closed'] }
        });
        
        return {
          agentId: agent._id,
          name: agent.name,
          email: agent.email,
          activeTickets: activeTicketCount
        };
      })
    );
    
    // Find agents with 0 active tickets (completely free)
    const freeAgents = agentLoads.filter(agent => agent.activeTickets === 0);
    
    if (freeAgents.length === 0) {
      console.log('No free agents available - all agents have assigned tasks');
      return { complaint, assignedAgent: null, message: 'All agents are busy' };
    }
    
    // Pick the first free agent (or randomize for load distribution)
    const selectedAgent = freeAgents[0];
    
    // Assign the complaint to the free agent
    complaint.assignedTo = selectedAgent.agentId;
    complaint.status = 'In Progress';
    complaint.updates.push({
      message: `Ticket automatically assigned to agent ${selectedAgent.name} (Free agent)`,
      updatedBy: selectedAgent.agentId,
      updateType: 'assignment',
      previousValue: 'Unassigned',
      newValue: selectedAgent.name,
      createdAt: new Date(),
    });
    
    await complaint.save();
    
    // Create notification for the agent
    await createNotification(
      selectedAgent.agentId,
      'New Ticket Assignment',
      `You have been assigned to ticket #${complaint.complaintId}`,
      'assignment',
      complaint._id,
      complaint.user
    );
    
    // Send real-time WebSocket notification to the agent
    if (io) {
      // Import the notification function
      const { notifyAgentAssignment } = await import('../socket/handlers/complaintHandler.js');
      
      notifyAgentAssignment(io, selectedAgent.agentId, {
        _id: complaint._id,
        complaintId: complaint.complaintId,
        title: complaint.title,
        description: complaint.description,
        priority: complaint.priority,
        category: complaint.category
      });
    }
    
    console.log(`✅ Complaint ${complaint.complaintId} assigned to free agent ${selectedAgent.name}`);
    
    return { 
      complaint, 
      assignedAgent: { 
        id: selectedAgent.agentId, 
        name: selectedAgent.name,
        activeTickets: selectedAgent.activeTickets
      },
      message: 'Assigned to free agent'
    };
  } catch (error) {
    console.error('Error in autoAssignToFreeAgent:', error.message);
    throw error;
  }
};

/**
 * Manually assign a complaint to a specific agent
 * @param {string} complaintId - The ID of the complaint to assign
 * @param {string} agentId - The ID of the agent to assign the complaint to
 * @param {string} adminId - The ID of the admin making the assignment
 * @returns {Promise<object>} The updated complaint
 */
export const manualAssignTicket = async (complaintId, agentId, adminId) => {
  try {
    const [complaint, agent] = await Promise.all([
      Complaint.findById(complaintId),
      User.findById(agentId)
    ]);
    
    if (!complaint) {
      throw new Error(`Complaint ${complaintId} not found`);
    }
    
    if (!agent) {
      throw new Error(`Agent ${agentId} not found`);
    }
    
    if (agent.role !== 'agent') {
      throw new Error(`User ${agentId} is not an agent`);
    }
    
    // Check if the complaint is already assigned to the same agent
    if (complaint.assignedTo && complaint.assignedTo.toString() === agentId) {
      return { complaint, message: 'Complaint is already assigned to this agent' };
    }
    
    const previousAgent = complaint.assignedTo 
      ? (await User.findById(complaint.assignedTo).select('name'))?.name 
      : 'Unassigned';
    
    complaint.assignedTo = agentId;
    complaint.status = 'In Progress';
    complaint.updates.push({
      message: `Ticket manually assigned to agent ${agent.name} by admin`,
      updatedBy: adminId,
      updateType: 'assignment',
      previousValue: previousAgent,
      newValue: agent.name,
      createdAt: new Date(),
    });
    
    await complaint.save();
    
    // Create notification for the agent
    await createNotification(
      agentId,
      'New Ticket Assignment',
      `You have been assigned to ticket #${complaint.complaintId} by admin`,
      'assignment',
      complaint._id,
      adminId
    );
    
    return { complaint, assignedAgent: { id: agentId, name: agent.name } };
  } catch (error) {
    console.error('Error in manualAssignTicket:', error.message);
    throw error;
  }
};

/**
 * Get a list of all agents with their current workload
 * @returns {Promise<Array>} List of agents with their current workload information
 */
export const getAgentsWithWorkload = async () => {
  try {
    // Get all agents
    const agents = await User.find({ role: 'agent' }).select('name email').lean();
    
    // For each agent, get their workload
    const agentWorkloads = await Promise.all(
      agents.map(async (agent) => {
        const agentId = agent._id;
        
        // Count tickets by status for this agent
        const ticketCountsByStatus = await Complaint.aggregate([
          { $match: { assignedTo: agentId } },
          { $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]);
        
        // Convert the array to an object for easier access
        const ticketCounts = {};
        ticketCountsByStatus.forEach(status => {
          ticketCounts[status._id] = status.count;
        });
        
        // Calculate the average resolution time for resolved tickets
        const resolvedComplaints = await Complaint.find({
          assignedTo: agentId,
          'resolution.resolvedAt': { $exists: true }
        }).sort({ 'resolution.resolvedAt': -1 }).limit(10).lean();
        
        let totalResolutionTime = 0;
        resolvedComplaints.forEach(complaint => {
          const createdAt = new Date(complaint.createdAt);
          const resolvedAt = new Date(complaint.resolution.resolvedAt);
          totalResolutionTime += resolvedAt - createdAt;
        });
        
        const avgResolutionTime = resolvedComplaints.length > 0
          ? totalResolutionTime / resolvedComplaints.length / (1000 * 60) // in minutes
          : 0;
        
        // Determine agent status based on workload
        const activeTickets = (ticketCounts['Open'] || 0) + (ticketCounts['In Progress'] || 0);
        const status = activeTickets >= 5 ? 'busy' : 'available';
        
        return {
          id: agentId.toString(),
          name: agent.name,
          email: agent.email,
          status,
          currentLoad: activeTickets,
          ticketsByStatus: {
            open: ticketCounts['Open'] || 0,
            inProgress: ticketCounts['In Progress'] || 0,
            resolved: ticketCounts['Resolved'] || 0,
            closed: ticketCounts['Closed'] || 0
          },
          avgResponseTime: Math.round(avgResolutionTime) + 'm',
          lastUpdated: new Date()
        };
      })
    );
    
    return agentWorkloads;
  } catch (error) {
    console.error('Error in getAgentsWithWorkload:', error.message);
    throw error;
  }
};