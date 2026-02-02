import { sendSMS, sendBulkSMS, getSMSStatus, getUserSMSLogs, getSMSStats, SMS_EVENTS } from '../services/smsService.js';
import { SMSLog } from '../models/SMSLog.js';

/**
 * Send SMS to a single user
 * POST /api/sms/send
 */
export const sendSingleSMS = async (req, res) => {
  try {
    const { userName, phoneNumber, eventType, eventData, customMessage } = req.body;

    // Validate required fields
    if (!userName || !phoneNumber || !eventType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: userName, phoneNumber, or eventType'
      });
    }

    // Validate event type
    if (!Object.values(SMS_EVENTS).includes(eventType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event type',
        validEventTypes: Object.values(SMS_EVENTS)
      });
    }

    // Send SMS
    const result = await sendSMS({
      userName,
      phoneNumber,
      eventType,
      eventData: eventData || {},
      customMessage,
      userId: req.user?._id // If user is authenticated
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'SMS sent successfully',
        data: result
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send SMS',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in sendSingleSMS:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Send bulk SMS to multiple users
 * POST /api/sms/send-bulk
 */
export const sendBulkSMSHandler = async (req, res) => {
  try {
    const { recipients, eventType, commonEventData } = req.body;

    // Validate required fields
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipients array is required and must not be empty'
      });
    }

    if (!eventType) {
      return res.status(400).json({
        success: false,
        message: 'Event type is required'
      });
    }

    // Validate event type
    if (!Object.values(SMS_EVENTS).includes(eventType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event type',
        validEventTypes: Object.values(SMS_EVENTS)
      });
    }

    // Validate recipient format
    for (const recipient of recipients) {
      if (!recipient.userName || !recipient.phoneNumber) {
        return res.status(400).json({
          success: false,
          message: 'Each recipient must have userName and phoneNumber'
        });
      }
    }

    // Send bulk SMS
    const result = await sendBulkSMS(recipients, eventType, commonEventData || {});

    return res.status(200).json({
      success: true,
      message: 'Bulk SMS processing completed',
      data: result
    });
  } catch (error) {
    console.error('Error in sendBulkSMSHandler:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get SMS delivery status
 * GET /api/sms/status/:messageSid
 */
export const getSMSStatusHandler = async (req, res) => {
  try {
    const { messageSid } = req.params;

    if (!messageSid) {
      return res.status(400).json({
        success: false,
        message: 'Message SID is required'
      });
    }

    const result = await getSMSStatus(messageSid);

    if (result.success) {
      return res.status(200).json({
        success: true,
        data: result
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Failed to fetch SMS status',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in getSMSStatusHandler:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get SMS logs for current user
 * GET /api/sms/logs
 */
export const getUserSMSLogsHandler = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { limit = 50, skip = 0, eventType } = req.query;

    const logs = await getUserSMSLogs(userId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      eventType
    });

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    console.error('Error in getUserSMSLogsHandler:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get SMS logs for specific user (admin only)
 * GET /api/sms/logs/:userId
 */
export const getUserSMSLogsByIdHandler = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, skip = 0, eventType } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const logs = await getUserSMSLogs(userId, {
      limit: parseInt(limit),
      skip: parseInt(skip),
      eventType
    });

    return res.status(200).json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error) {
    console.error('Error in getUserSMSLogsByIdHandler:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get SMS statistics
 * GET /api/sms/stats
 */
export const getSMSStatsHandler = async (req, res) => {
  try {
    const { startDate, endDate, eventType } = req.query;

    const stats = await getSMSStats({
      startDate,
      endDate,
      eventType
    });

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getSMSStatsHandler:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get event type statistics
 * GET /api/sms/stats/events
 */
export const getEventTypeStatsHandler = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const stats = await SMSLog.getEventTypeStats({
      startDate,
      endDate
    });

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in getEventTypeStatsHandler:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Get all SMS event types
 * GET /api/sms/events
 */
export const getSMSEventTypes = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: Object.values(SMS_EVENTS)
    });
  } catch (error) {
    console.error('Error in getSMSEventTypes:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

/**
 * Test SMS configuration
 * POST /api/sms/test
 */
export const testSMSConfiguration = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required for testing'
      });
    }

    const result = await sendSMS({
      userName: 'Test User',
      phoneNumber,
      eventType: SMS_EVENTS.REMINDER,
      eventData: {
        reminderText: 'This is a test SMS from QuickFix. Your SMS configuration is working correctly!'
      }
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Test SMS sent successfully',
        data: result
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send test SMS',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in testSMSConfiguration:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
