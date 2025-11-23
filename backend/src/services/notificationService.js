import { Notification } from '../models/Notification.js';

/**
 * Create a notification for a user
 * @param {Object} options - Notification options
 * @param {string} options.userId - The ID of the user to notify
 * @param {string} options.title - The notification title
 * @param {string} options.message - The notification message
 * @param {string} options.type - The notification type
 * @param {string} options.priority - The notification priority (low, medium, high, urgent)
 * @param {string} options.complaintId - The related complaint ID (optional)
 * @param {Object} options.data - Additional data (optional)
 * @returns {Promise<object>} The created notification
 */
export const createNotification = async ({
  userId,
  title,
  message,
  type,
  priority = 'medium',
  complaintId = null,
  data = {}
}) => {
  try {
    console.log('🔔 createNotification called with:', {
      userId,
      title,
      message,
      type,
      priority,
      complaintId,
      hasData: !!data
    });
    
    const notification = new Notification({
      user: userId,
      title,
      message,
      type,
      priority,
      relatedComplaint: complaintId,
      data,
      isRead: false,
      channels: {
        inApp: { read: false }
      }
    });
    
    console.log('💾 Saving notification to database...');
    await notification.save();
    console.log(`✅ Notification created successfully: ${notification._id}`);
    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    console.error('   Error stack:', error.stack);
    throw error;
  }
};

/**
 * Create notifications for multiple users
 * @param {Array<string>} userIds - Array of user IDs
 * @param {Object} notificationData - Notification data
 * @returns {Promise<Array>} Array of created notifications
 */
export const createNotifications = async (userIds, notificationData) => {
  try {
    const { title, message, type, priority = 'medium', complaintId = null, data = {} } = notificationData;
    
    // Filter out duplicates and empty user IDs
    const uniqueUsers = [...new Set(userIds.filter(id => id))];
    
    // Create notifications for each user
    const notifications = uniqueUsers.map(userId => ({
      user: userId,
      title,
      message,
      type,
      priority,
      relatedComplaint: complaintId,
      data,
      isRead: false,
      channels: {
        inApp: { read: false }
      }
    }));
    
    // Batch insert notifications
    const createdNotifications = await Notification.insertMany(notifications);
    console.log(`✉️  ${createdNotifications.length} notifications created`);
    return createdNotifications;
  } catch (error) {
    console.error('Error creating multiple notifications:', error);
    throw error;
  }
};

/**
 * Notify user about complaint creation
 */
export const notifyComplaintCreated = async (userId, complaintId, complaintTitle) => {
  console.log('📨 notifyComplaintCreated called:', { userId, complaintId, complaintTitle });
  return createNotification({
    userId,
    title: 'Complaint Created Successfully',
    message: `Your complaint "${complaintTitle}" has been registered and is being reviewed.`,
    type: 'complaint_created',
    priority: 'medium',
    complaintId
  });
};

/**
 * Notify agent about complaint assignment
 */
export const notifyComplaintAssigned = async (agentId, complaintId, complaintTitle) => {
  return createNotification({
    userId: agentId,
    title: 'New Complaint Assigned',
    message: `You have been assigned to complaint "${complaintTitle}".`,
    type: 'complaint_assigned',
    priority: 'high',
    complaintId
  });
};

/**
 * Notify user about complaint status change
 */
export const notifyStatusChange = async (userId, complaintId, complaintTitle, newStatus) => {
  return createNotification({
    userId,
    title: 'Complaint Status Updated',
    message: `Your complaint "${complaintTitle}" status changed to ${newStatus}.`,
    type: 'status_change',
    priority: 'medium',
    complaintId
  });
};

/**
 * Notify user about complaint resolution
 */
export const notifyComplaintResolved = async (userId, complaintId, complaintTitle) => {
  return createNotification({
    userId,
    title: 'Complaint Resolved',
    message: `Your complaint "${complaintTitle}" has been resolved. Please provide feedback.`,
    type: 'complaint_resolved',
    priority: 'high',
    complaintId
  });
};

/**
 * Notify about SLA warning
 */
export const notifySlaWarning = async (agentId, complaintId, complaintTitle, hoursRemaining) => {
  return createNotification({
    userId: agentId,
    title: 'SLA Warning',
    message: `Complaint "${complaintTitle}" SLA deadline approaching in ${hoursRemaining} hours.`,
    type: 'sla_warning',
    priority: 'urgent',
    complaintId
  });
};

/**
 * Notify about complaint escalation
 */
export const notifyComplaintEscalated = async (userIds, complaintId, complaintTitle, reason) => {
  return createNotifications(userIds, {
    title: 'Complaint Escalated',
    message: `Complaint "${complaintTitle}" has been escalated. Reason: ${reason}`,
    type: 'complaint_escalated',
    priority: 'urgent',
    complaintId
  });
};

/**
 * Notify about new comment
 */
export const notifyNewComment = async (userId, complaintId, complaintTitle, commenterName) => {
  return createNotification({
    userId,
    title: 'New Comment',
    message: `${commenterName} commented on your complaint "${complaintTitle}".`,
    type: 'new_comment',
    priority: 'medium',
    complaintId
  });
};