import twilio from 'twilio';
import { SMSLog } from '../models/SMSLog.js';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
const appName = process.env.APP_NAME || 'QuickFix';

let twilioClient = null;

// Initialize Twilio client if credentials are available
if (accountSid && authToken) {
  twilioClient = twilio(accountSid, authToken);
  console.log('✅ Twilio SMS service initialized');
} else {
  console.warn('⚠️  Twilio credentials not found. SMS service will be disabled.');
}

/**
 * SMS Event Types
 */
export const SMS_EVENTS = {
  SIGNUP: 'SIGNUP',
  OTP_GENERATION: 'OTP_GENERATION',
  INTERVIEW_SCHEDULED: 'INTERVIEW_SCHEDULED',
  REMINDER: 'REMINDER',
  COMPLAINT_CREATED: 'COMPLAINT_CREATED',
  COMPLAINT_ASSIGNED: 'COMPLAINT_ASSIGNED',
  COMPLAINT_RESOLVED: 'COMPLAINT_RESOLVED',
  STATUS_UPDATE: 'STATUS_UPDATE',
  PASSWORD_RESET: 'PASSWORD_RESET',
  PAYMENT_SUCCESS: 'PAYMENT_SUCCESS',
  PAYMENT_FAILED: 'PAYMENT_FAILED'
};

/**
 * Generate dynamic SMS message based on event type
 * @param {string} userName - User's name
 * @param {string} eventType - Type of event
 * @param {object} eventData - Additional event data
 * @returns {string} Formatted SMS message
 */
const generateMessage = (userName, eventType, eventData = {}) => {
  const templates = {
    [SMS_EVENTS.SIGNUP]: `Hello ${userName} 👋\n\nWelcome to QuickFix Complaint Management System.\nWe are here to help you resolve issues quickly and efficiently.\n\nThank you for joining us!\n– QuickFix Team`,
    
    [SMS_EVENTS.OTP_GENERATION]: `Your OTP for ${appName} is: ${eventData.otp}. Valid for ${eventData.expiryMinutes || 10} minutes. Do not share this code.`,
    
    [SMS_EVENTS.INTERVIEW_SCHEDULED]: `Interview scheduled for ${eventData.date} at ${eventData.time}. Location: ${eventData.location || 'TBD'}. Good luck!`,
    
    [SMS_EVENTS.REMINDER]: `Reminder: ${eventData.reminderText}`,
    
    [SMS_EVENTS.COMPLAINT_CREATED]: `Hello ${userName},\n\nYour complaint has been successfully registered.\nComplaint ID: ${eventData.complaintId}\n\nOur team will review it shortly.\n– QuickFix Support`,
    
    [SMS_EVENTS.COMPLAINT_ASSIGNED]: `Hi ${userName}, your complaint #${eventData.complaintId} has been assigned to ${eventData.agentName}. They will contact you shortly to assist with your issue.`,
    
    [SMS_EVENTS.COMPLAINT_RESOLVED]: `✅ *Complaint Resolved*\n\nHello ${userName},\nYour complaint *#${eventData.complaintId}* is now *Resolved*.\n\nIf you still face issues, reply HELP.\nThank you for choosing QuickFix 🙌`,
    
    [SMS_EVENTS.STATUS_UPDATE]: `Complaint #${eventData.complaintId} status updated to: ${eventData.status}. ${eventData.additionalInfo || ''}`,
    
    [SMS_EVENTS.PASSWORD_RESET]: `Your password reset request for ${appName} has been received. Use this code: ${eventData.resetCode}. Valid for 30 minutes.`,
    
    [SMS_EVENTS.PAYMENT_SUCCESS]: `Payment of ${eventData.currency}${eventData.amount} received successfully. Transaction ID: ${eventData.transactionId}.`,
    
    [SMS_EVENTS.PAYMENT_FAILED]: `Payment of ${eventData.currency}${eventData.amount} failed. Please try again or contact support.`
  };

  const eventMessage = templates[eventType] || eventData.customMessage || 'You have a new notification.';
  
  return eventMessage;
};

/**
 * Send SMS to a user
 * @param {Object} options - SMS options
 * @param {string} options.userName - User's name
 * @param {string} options.phoneNumber - User's phone number (E.164 format: +1234567890)
 * @param {string} options.eventType - Type of event triggering the SMS
 * @param {object} options.eventData - Additional event data for message generation
 * @param {string} options.customMessage - Custom message (overrides template)
 * @param {string} options.userId - User ID for logging (optional)
 * @returns {Promise<object>} SMS delivery status
 */
export const sendSMS = async ({
  userName,
  phoneNumber,
  eventType,
  eventData = {},
  customMessage = null,
  userId = null
}) => {
  const logData = {
    userId,
    phoneNumber,
    eventType,
    status: 'pending',
    sentAt: new Date()
  };

  try {
    // Validate required fields
    if (!userName || !phoneNumber || !eventType) {
      throw new Error('Missing required fields: userName, phoneNumber, or eventType');
    }

    // Check if Twilio is configured
    if (!twilioClient || !twilioPhoneNumber) {
      throw new Error('Twilio is not configured. Please add TWILIO credentials to .env file');
    }

    // Validate phone number format
    if (!phoneNumber.startsWith('+')) {
      throw new Error('Phone number must be in E.164 format (e.g., +1234567890)');
    }

    // Generate message
    const message = customMessage || generateMessage(userName, eventType, eventData);
    logData.message = message;

    console.log(`📱 Sending SMS to ${phoneNumber} for event: ${eventType}`);

    // Send SMS via Twilio
    const smsResponse = await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber
    });

    // Update log data with success
    logData.status = 'sent';
    logData.messageSid = smsResponse.sid;
    logData.deliveryStatus = smsResponse.status;
    logData.errorCode = null;
    logData.errorMessage = null;

    console.log(`✅ SMS sent successfully. SID: ${smsResponse.sid}`);

    // Save to database
    await saveSMSLog(logData);

    return {
      success: true,
      messageSid: smsResponse.sid,
      status: smsResponse.status,
      message: 'SMS sent successfully'
    };

  } catch (error) {
    console.error('❌ Error sending SMS:', error.message);

    // Update log data with error
    logData.status = 'failed';
    logData.errorCode = error.code || 'UNKNOWN_ERROR';
    logData.errorMessage = error.message;

    // Save error to database
    await saveSMSLog(logData);

    return {
      success: false,
      error: error.message,
      errorCode: error.code
    };
  }
};

/**
 * Send SMS to multiple users
 * @param {Array} recipients - Array of recipient objects
 * @param {string} eventType - Type of event
 * @param {object} commonEventData - Common event data for all recipients
 * @returns {Promise<object>} Bulk SMS results
 */
export const sendBulkSMS = async (recipients, eventType, commonEventData = {}) => {
  try {
    console.log(`📱 Sending bulk SMS to ${recipients.length} recipients`);

    const results = await Promise.allSettled(
      recipients.map(recipient =>
        sendSMS({
          userName: recipient.userName,
          phoneNumber: recipient.phoneNumber,
          eventType,
          eventData: { ...commonEventData, ...recipient.eventData },
          userId: recipient.userId
        })
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    console.log(`✅ Bulk SMS completed: ${successful} sent, ${failed} failed`);

    return {
      total: recipients.length,
      successful,
      failed,
      results: results.map(r => r.value)
    };
  } catch (error) {
    console.error('❌ Error in bulk SMS:', error);
    throw error;
  }
};

/**
 * Save SMS log to database
 * @param {object} logData - SMS log data
 */
const saveSMSLog = async (logData) => {
  try {
    const smsLog = new SMSLog(logData);
    await smsLog.save();
    console.log(`📝 SMS log saved: ${smsLog._id}`);
  } catch (error) {
    console.error('❌ Error saving SMS log:', error.message);
    // Don't throw error to prevent SMS failure from affecting the main flow
  }
};

/**
 * Get SMS delivery status from Twilio
 * @param {string} messageSid - Twilio message SID
 * @returns {Promise<object>} Message status
 */
export const getSMSStatus = async (messageSid) => {
  try {
    if (!twilioClient) {
      throw new Error('Twilio is not configured');
    }

    const message = await twilioClient.messages(messageSid).fetch();
    
    // Update database with latest status
    await SMSLog.findOneAndUpdate(
      { messageSid },
      { 
        deliveryStatus: message.status,
        updatedAt: new Date()
      }
    );

    return {
      success: true,
      status: message.status,
      dateCreated: message.dateCreated,
      dateSent: message.dateSent,
      dateUpdated: message.dateUpdated,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage
    };
  } catch (error) {
    console.error('❌ Error fetching SMS status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get SMS logs for a user
 * @param {string} userId - User ID
 * @param {object} options - Query options
 * @returns {Promise<Array>} SMS logs
 */
export const getUserSMSLogs = async (userId, options = {}) => {
  try {
    const { limit = 50, skip = 0, eventType = null } = options;
    
    const query = { userId };
    if (eventType) {
      query.eventType = eventType;
    }

    const logs = await SMSLog.find(query)
      .sort({ sentAt: -1 })
      .limit(limit)
      .skip(skip);

    return logs;
  } catch (error) {
    console.error('❌ Error fetching SMS logs:', error);
    throw error;
  }
};

/**
 * Get SMS statistics
 * @param {object} filters - Filter options
 * @returns {Promise<object>} SMS statistics
 */
export const getSMSStats = async (filters = {}) => {
  try {
    const { startDate, endDate, eventType } = filters;
    
    const query = {};
    if (startDate || endDate) {
      query.sentAt = {};
      if (startDate) query.sentAt.$gte = new Date(startDate);
      if (endDate) query.sentAt.$lte = new Date(endDate);
    }
    if (eventType) {
      query.eventType = eventType;
    }

    const [total, sent, failed, pending] = await Promise.all([
      SMSLog.countDocuments(query),
      SMSLog.countDocuments({ ...query, status: 'sent' }),
      SMSLog.countDocuments({ ...query, status: 'failed' }),
      SMSLog.countDocuments({ ...query, status: 'pending' })
    ]);

    return {
      total,
      sent,
      failed,
      pending,
      successRate: total > 0 ? ((sent / total) * 100).toFixed(2) : 0
    };
  } catch (error) {
    console.error('❌ Error fetching SMS stats:', error);
    throw error;
  }
};

export default {
  sendSMS,
  sendBulkSMS,
  getSMSStatus,
  getUserSMSLogs,
  getSMSStats,
  SMS_EVENTS
};
