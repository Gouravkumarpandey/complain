/**
 * Complaint Handler - Real-time notifications for complaint assignments
 * SIMPLIFIED: Only notifies agents when complaints are assigned to them
 */
import { createNotification } from '../../services/notificationService.js';

/**
 * Initialize the complaint handler
 * @param {object} io - Socket.io instance
 */
export const initComplaintHandler = (io) => {
  io.on('connection', (socket) => {
    // Only handle agent notifications - nothing else
    console.log(`Socket connected for complaint notifications: ${socket.user?.name || 'Unknown'}`);
  });
};

/**
 * Notify specific agent about new complaint assignment
 * Called from ticketAssignmentService when complaint is assigned
 * @param {object} io - Socket.io instance
 * @param {string} agentId - ID of agent to notify
 * @param {object} complaintData - Complaint information
 */
export const notifyAgentAssignment = (io, agentId, complaintData) => {
  io.to(`agent:${agentId}`).emit('new_complaint_assigned', {
    complaintId: complaintData._id,
    complaintNumber: complaintData.complaintId,
    title: complaintData.title,
    description: complaintData.description,
    priority: complaintData.priority,
    category: complaintData.category,
    assignedAt: new Date(),
    message: `New ${complaintData.priority} priority complaint assigned to you`
  });
  
  console.log(`✅ Notified agent ${agentId} about new complaint assignment`);
};