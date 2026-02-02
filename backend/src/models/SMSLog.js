import mongoose from 'mongoose';

const smsLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    maxlength: [1600, 'Message cannot exceed 1600 characters']
  },
  eventType: {
    type: String,
    required: [true, 'Event type is required'],
    enum: [
      'SIGNUP',
      'OTP_GENERATION',
      'INTERVIEW_SCHEDULED',
      'REMINDER',
      'COMPLAINT_CREATED',
      'COMPLAINT_ASSIGNED',
      'COMPLAINT_RESOLVED',
      'STATUS_UPDATE',
      'PASSWORD_RESET',
      'PAYMENT_SUCCESS',
      'PAYMENT_FAILED'
    ],
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'failed', 'undelivered'],
    default: 'pending',
    index: true
  },
  messageSid: {
    type: String,
    default: null,
    index: true
  },
  deliveryStatus: {
    type: String,
    default: null
  },
  sentAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  errorCode: {
    type: String,
    default: null
  },
  errorMessage: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
smsLogSchema.index({ userId: 1, sentAt: -1 });
smsLogSchema.index({ eventType: 1, status: 1 });
smsLogSchema.index({ messageSid: 1 });

// Virtual for checking if SMS was successful
smsLogSchema.virtual('isSuccessful').get(function() {
  return this.status === 'sent' || this.status === 'delivered';
});

// Virtual for checking if SMS failed
smsLogSchema.virtual('isFailed').get(function() {
  return this.status === 'failed' || this.status === 'undelivered';
});

// Method to mark SMS as delivered
smsLogSchema.methods.markAsDelivered = async function() {
  this.status = 'delivered';
  this.deliveredAt = new Date();
  return await this.save();
};

// Method to mark SMS as failed
smsLogSchema.methods.markAsFailed = async function(errorCode, errorMessage) {
  this.status = 'failed';
  this.errorCode = errorCode;
  this.errorMessage = errorMessage;
  return await this.save();
};

// Static method to get delivery statistics
smsLogSchema.statics.getStats = async function(filters = {}) {
  const { startDate, endDate, eventType } = filters;
  
  const matchStage = {};
  if (startDate || endDate) {
    matchStage.sentAt = {};
    if (startDate) matchStage.sentAt.$gte = new Date(startDate);
    if (endDate) matchStage.sentAt.$lte = new Date(endDate);
  }
  if (eventType) {
    matchStage.eventType = eventType;
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        sent: {
          $sum: { $cond: [{ $in: ['$status', ['sent', 'delivered']] }, 1, 0] }
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        pending: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        }
      }
    }
  ]);

  if (stats.length === 0) {
    return { total: 0, sent: 0, failed: 0, pending: 0, successRate: 0 };
  }

  const result = stats[0];
  result.successRate = result.total > 0 ? ((result.sent / result.total) * 100).toFixed(2) : 0;
  delete result._id;

  return result;
};

// Static method to get event type statistics
smsLogSchema.statics.getEventTypeStats = async function(filters = {}) {
  const { startDate, endDate } = filters;
  
  const matchStage = {};
  if (startDate || endDate) {
    matchStage.sentAt = {};
    if (startDate) matchStage.sentAt.$gte = new Date(startDate);
    if (endDate) matchStage.sentAt.$lte = new Date(endDate);
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$eventType',
        count: { $sum: 1 },
        sent: {
          $sum: { $cond: [{ $in: ['$status', ['sent', 'delivered']] }, 1, 0] }
        },
        failed: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        eventType: '$_id',
        count: 1,
        sent: 1,
        failed: 1,
        successRate: {
          $cond: [
            { $eq: ['$count', 0] },
            0,
            { $multiply: [{ $divide: ['$sent', '$count'] }, 100] }
          ]
        }
      }
    },
    { $sort: { count: -1 } }
  ]);

  return stats;
};

// Pre-save hook to validate phone number format
smsLogSchema.pre('save', function(next) {
  if (this.isModified('phoneNumber') && !this.phoneNumber.startsWith('+')) {
    next(new Error('Phone number must be in E.164 format (e.g., +1234567890)'));
  } else {
    next();
  }
});

export const SMSLog = mongoose.model('SMSLog', smsLogSchema);
