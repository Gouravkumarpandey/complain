import express from 'express';
import { Complaint } from '../models/Complaint.js';
import { User } from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateComplaint, validateComplaintUpdate } from '../validators/complaintValidators.js';
import aiService from '../services/aiService.js';
import { sendComplaintConfirmationEmail, sendComplaintResolvedEmail } from '../services/emailService.js';
import { publishEvent } from '../../utils/snsPublisher.js';
// Redis cache disabled - uncomment when Redis is enabled
// import { invalidateComplaintCache } from '../services/cacheService.js';

const router = express.Router();

// Get all complaints for the logged-in user (user's complaint history)
router.get('/my-complaints', authenticate, asyncHandler(async (req, res) => {
  const {
    status,
    category,
    priority,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object - only for current user
  const filter = { user: req.user._id };

  // Apply additional filters
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Fetch complaints
  const complaints = await Complaint.find(filter)
    .populate('user', 'name username email')
    .populate('assignedTo', 'name username email')
    .populate('resolution.resolvedBy', 'name username email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Complaint.countDocuments(filter);

  // Get statistics for user's complaints
  const stats = {
    total: total,
    open: await Complaint.countDocuments({ user: req.user._id, status: 'Open' }),
    inProgress: await Complaint.countDocuments({ user: req.user._id, status: 'In Progress' }),
    resolved: await Complaint.countDocuments({ user: req.user._id, status: 'Resolved' }),
    closed: await Complaint.countDocuments({ user: req.user._id, status: 'Closed' })
  };

  res.json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role
    },
    complaints,
    stats,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total,
      hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
      hasPrev: parseInt(page) > 1
    }
  });
}));

// Get all complaints (with filters)
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const {
    status,
    category,
    priority,
    assignedTo,
    userId,
    isEscalated,
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build filter object
  const filter = {};

  // Regular users can only see their own complaints
  if (req.user.role === 'user') {
    filter.user = req.user._id; // Use 'user' field, not 'userId'
  } else if (userId && (req.user.role === 'admin' || req.user.role === 'agent')) {
    filter.user = userId; // Use 'user' field, not 'userId'
  }

  // Agents can ONLY see complaints assigned directly to them (by their _id)
  if (req.user.role === 'agent') {
    filter.assignedTo = req.user._id;
    console.log(`🔍 Agent ${req.user.email} (${req.user._id}) fetching their assigned complaints`);
  }

  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (isEscalated !== undefined) filter.isEscalated = isEscalated === 'true';

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const complaints = await Complaint.find(filter)
    .populate('user', 'name username email')
    .populate('assignedTo', 'name username email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Complaint.countDocuments(filter);

  res.json({
    complaints,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total
    }
  });
}));

// Get complaint by ID
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('user', 'name username email')
    .populate('assignedTo', 'name username email')
    .populate('updates.updatedBy', 'name email');

  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  // Check permissions (user field contains the user who created the complaint)
  if (req.user.role === 'user' && complaint.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Access denied' });
  }

  res.json(complaint);
}));

// Create new complaint
router.post('/', authenticate, asyncHandler(async (req, res) => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🆕 NEW COMPLAINT CREATION REQUEST');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📥 REQUEST BODY:', JSON.stringify(req.body, null, 2));
  console.log('👤 REQUEST USER:', JSON.stringify({
    id: req.user?._id,
    email: req.user?.email,
    role: req.user?.role,
    name: req.user?.name
  }, null, 2));
  console.log('📋 HEADERS:', JSON.stringify({
    'content-type': req.headers['content-type'],
    'authorization': req.headers.authorization ? 'Bearer ***' : 'MISSING',
    'origin': req.headers.origin
  }, null, 2));
  console.log('═══════════════════════════════════════════════════════');

  const { error } = validateComplaint(req.body);
  if (error) {
    console.error('❌ VALIDATION ERROR:', error.details[0].message);
    return res.status(400).json({ error: error.details[0].message });
  }

  const { title, description, category, attachments } = req.body;

  console.log('✅ Validation passed');
  console.log('   Title:', title);
  console.log('   Category:', category);
  console.log('   Description length:', description?.length || 0);

  // Import DeepSeek service for AI validation
  const deepseekService = (await import('../services/deepseekService.js')).default;
  
  // AI VALIDATION: Check if complaint is genuine
  console.log('🤖 AI Validation: Analyzing complaint authenticity...');
  try {
    const validation = await deepseekService.validateComplaint(title, description);
    console.log('   Validation result:', validation);
    
    if (!validation.isValid) {
      console.error('❌ AI REJECTED: Complaint appears to be invalid/gibberish');
      console.error('   Reason:', validation.reason);
      console.error('   Confidence:', validation.confidence);
      
      return res.status(400).json({ 
        error: 'Invalid complaint detected',
        message: 'Your complaint appears to contain invalid or meaningless content. Please provide a genuine description of your issue.',
        reason: validation.reason,
        aiAnalysis: {
          isValid: false,
          confidence: validation.confidence,
          model: validation.model
        }
      });
    }
    
    console.log('✅ AI APPROVED: Complaint is genuine');
    console.log('   Reason:', validation.reason);
    console.log('   Confidence:', validation.confidence);
  } catch (validationError) {
    console.error('⚠️  AI validation error (proceeding anyway):', validationError.message);
    // Continue with complaint creation even if validation fails
  }

  // Use AI service to analyze the complaint (with fallback)
  let aiAnalysis = { priority: 'Medium', sentiment: 'Neutral', category: category || 'General Inquiry', keywords: [] };
  try {
    if (aiService && typeof aiService.classifyComplaint === 'function') {
      aiAnalysis = await aiService.classifyComplaint(description);
    } else {
      console.log('⚠️ AI service not available, using default classification');
    }
  } catch (error) {
    console.error('❌ AI classification failed:', error.message);
    console.log('   Using fallback classification');
  }

  // Calculate SLA target based on priority
  const slaHours = {
    'Critical': 4,
    'High': 24,
    'Medium': 48,
    'Low': 72
  };
  const targetHours = slaHours[aiAnalysis.priority] || 48;

  console.log('🏗️  Creating complaint object...');
  console.log('   User ID for complaint:', req.user._id);
  console.log('   Category:', category || aiAnalysis.category);
  console.log('   Priority:', aiAnalysis.priority);
  console.log('   Target resolution hours:', targetHours);

  const complaint = new Complaint({
    user: req.user._id, // Links complaint to the authenticated user
    title,
    description,
    category: category || aiAnalysis.category,
    priority: aiAnalysis.priority,
    status: 'Open',
    attachments: attachments || [],
    sla: {
      resolutionTime: {
        target: targetHours,
        actual: null,
        met: null
      },
      responseTime: {
        target: Math.min(4, targetHours / 4),
        actual: null,
        met: null
      }
    },
    aiAnalysis: {
      sentiment: aiAnalysis.sentiment || 'Neutral',
      confidence: aiAnalysis.confidence || 0.7,
      keywords: aiAnalysis.keywords || [],
      analyzedAt: new Date()
    },
    updates: [{
      message: 'Complaint has been created and classified automatically.',
      updatedBy: req.user._id,
      updateType: 'status_change',
      createdAt: new Date(),
      isInternal: false
    }]
  });

  console.log('💾 Attempting to save complaint to MongoDB...');
  console.log('   Complaint object created:', {
    hasUser: !!complaint.user,
    hasTitle: !!complaint.title,
    hasDescription: !!complaint.description,
    hasCategory: !!complaint.category
  });

  try {
    await complaint.save();
    console.log('✅ COMPLAINT SAVED SUCCESSFULLY!');
    console.log('   Complaint ID:', complaint._id);
    console.log('   Complaint Number:', complaint.complaintId);
    
    // Redis cache disabled
    // await invalidateComplaintCache(complaint._id.toString());
  } catch (saveError) {
    console.error('❌ MONGODB SAVE ERROR:', saveError);
    console.error('   Error name:', saveError.name);
    console.error('   Error message:', saveError.message);
    console.error('   Error stack:', saveError.stack);
    throw saveError;
  }
  
  // Generate AI summary if description is long enough
  if (description && description.length > 100) {
    try {
      const summaryResult = await aiService.summarize(description, 100, 30);
      complaint.aiSummary = {
        text: summaryResult.summary,
        confidence: summaryResult.error ? 0.5 : 0.85,
        model: summaryResult.model,
        generatedAt: new Date()
      };
      await complaint.save();
    } catch (error) {
      console.error('Failed to generate summary on creation:', error);
      // Continue without summary - not critical
    }
  }
  
  // Import the ticket assignment service and get io instance
  const { aiAssignToAgent, autoAssignToFreeAgent } = await import('../services/ticketAssignmentService.js');
  const { getIoInstance } = await import('../socket/socketHandlers.js');
  const { notifyComplaintCreated, notifyComplaintAssigned } = await import('../services/notificationService.js');
  
  try {
    // Get WebSocket instance for real-time notifications
    const io = getIoInstance();
    
    // AI-POWERED ASSIGNMENT: Use DeepSeek to intelligently assign ticket
    console.log('🤖 Attempting AI-powered agent assignment...');
    const { assignedAgent, message: assignMessage } = await aiAssignToAgent(complaint._id, io);
    
    // If an agent was assigned, update the response
    if (assignedAgent) {
      console.log(`✅ Complaint ${complaint.complaintId} AI-assigned to agent ${assignedAgent.name}`);
      console.log(`   Active tickets: ${assignedAgent.activeTickets}`);
      console.log(`   AI Confidence: ${assignedAgent.aiAssignment?.confidence}`);
      console.log(`   Reasoning: ${assignedAgent.aiAssignment?.reasoning}`);
      console.log(`   Method: ${assignedAgent.aiAssignment?.method}`);
      
      // Create notification for assigned agent
      try {
        await notifyComplaintAssigned(
          assignedAgent.id,
          complaint._id,
          complaint.title
        );
      } catch (notifError) {
        console.error('Failed to create assignment notification:', notifError);
      }
    } else {
      console.log(`ℹ️  ${assignMessage || 'No available agent'} for complaint ${complaint.complaintId}`);
    }
  } catch (err) {
    console.error('Error in AI ticket assignment:', err);
    // Continue even if assignment fails - complaint is still created
  }
  
  // Get updated complaint after assignment
  const updatedComplaint = await Complaint.findById(complaint._id)
    .populate('assignedTo', 'name username email')
    .populate('user', 'name username email');
  
  // Create notification for user about complaint creation
  try {
    console.log('🔔 Creating notification for user...');
    console.log('   User ID:', req.user._id);
    console.log('   Complaint ID:', complaint._id);
    console.log('   Complaint Title:', complaint.title);
    
    const notificationResult = await notifyComplaintCreated(
      req.user._id,
      complaint._id,
      complaint.title
    );
    
    console.log('✅ Notification created successfully:', notificationResult._id);
  } catch (notifError) {
    console.error('❌ Failed to create complaint notification:', notifError);
    console.error('   Error stack:', notifError.stack);
  }
  
  console.log('🔍 DEBUG: About to send email confirmation...');
  console.log('   Complaint ID:', complaint._id);
  console.log('   Updated complaint exists:', !!updatedComplaint);
  console.log('   User object:', updatedComplaint?.user);
  console.log('   User email:', updatedComplaint?.user?.email);
  console.log('   User name:', updatedComplaint?.user?.name);
  console.log('   Complaint Number:', updatedComplaint?.complaintId);
  console.log('   Request user:', { id: req.user?._id, email: req.user?.email, name: req.user?.name });
  
  // Send complaint confirmation email to user
  // Use req.user if populated user is not available
  const userEmail = updatedComplaint?.user?.email || req.user?.email;
  const userName = updatedComplaint?.user?.name || req.user?.name;
  
  if (!userEmail) {
    console.error('❌ Cannot send email: User email is missing');
    console.error('   updatedComplaint.user:', updatedComplaint?.user);
    console.error('   req.user:', req.user);
  } else {
    try {
      console.log(`📧 Sending complaint confirmation email...`);
      console.log(`   To: ${userEmail}`);
      console.log(`   Name: ${userName}`);
      console.log(`   Complaint: ${updatedComplaint.complaintId}`);
      
      await sendComplaintConfirmationEmail(
        userEmail,
        userName,
        updatedComplaint.complaintId,
        updatedComplaint.title,
        updatedComplaint.description,
        updatedComplaint.category,
        updatedComplaint.priority
      );
      console.log(`✅ Confirmation email sent to ${userEmail} for complaint ${updatedComplaint.complaintId}`);
    } catch (emailError) {
      console.error('❌ Failed to send complaint confirmation email:', emailError.message);
      console.error('   Error code:', emailError.code);
      console.error('   Error stack:', emailError.stack);
      // Continue even if email fails - complaint is still created
    }
  }
  
  // Send WhatsApp notification if user has phone number
  try {
    const { sendComplaintRegistrationWhatsApp } = await import('../services/whatsappService.js');
    const userPhoneNumber = req.user?.phoneNumber;
    
    if (userPhoneNumber) {
      console.log(`📱 Sending WhatsApp notification to ${userPhoneNumber}...`);
      const whatsappResult = await sendComplaintRegistrationWhatsApp(
        userPhoneNumber,
        userName,
        updatedComplaint.complaintId,
        updatedComplaint.title,
        updatedComplaint.category,
        updatedComplaint.priority
      );
      
      if (whatsappResult.success) {
        console.log(`✅ WhatsApp notification sent successfully for complaint ${updatedComplaint.complaintId}`);
      } else {
        console.log(`⚠️  WhatsApp notification failed: ${whatsappResult.error}`);
      }
    } else {
      console.log('ℹ️  No phone number on user record, skipping WhatsApp notification');
    }
  } catch (whatsappError) {
    console.error('❌ Failed to send WhatsApp notification:', whatsappError.message);
    // Continue even if WhatsApp fails - complaint is still created
  }
  
  // Publish event to SNS for ticket creation
  try {
    await publishEvent('ticket.created', {
      ticketId: updatedComplaint._id.toString(),
      complaintId: updatedComplaint.complaintId,
      userId: req.user._id.toString(),
      title: updatedComplaint.title,
      category: updatedComplaint.category,
      priority: updatedComplaint.priority,
      assignedTo: updatedComplaint.assignedTo?.toString() || null
    });
    console.log(`📡 SNS Event published: ticket.created for ${updatedComplaint.complaintId}`);
  } catch (snsError) {
    console.error('❌ Failed to publish ticket.created event:', snsError.message);
    // Continue even if SNS fails
  }
  
  res.status(201).json(updatedComplaint);
}));

// Update complaint status
router.patch('/:id/status', authenticate, authorize('agent', 'admin'), asyncHandler(async (req, res) => {
  const { status, message } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  // Check if agent can update this complaint
  if (req.user.role === 'agent' && 
      complaint.assignedTo?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'You can only update complaints assigned to you' });
  }

  const oldStatus = complaint.status;
  complaint.status = status;
  complaint.updatedAt = new Date();
  
  console.log(`\n🔄 STATUS UPDATE REQUEST`);
  console.log(`   Complaint ID: ${complaint.complaintId} (${complaint._id})`);
  console.log(`   Current status in DB: ${oldStatus}`);
  console.log(`   New status requested: ${status}`);
  console.log(`   Status field updated in memory: ${complaint.status}`);
  console.log(`   Modified? ${complaint.isModified('status')}`);

  // Add update record
  const updateRecord = {
    message: message || `Status changed from ${oldStatus} to ${status}`,
    author: `${req.user.firstName} ${req.user.lastName}`,
    authorId: req.user._id,
    timestamp: new Date(),
    type: 'status_change',
    isInternal: false
  };
  complaint.updates.push(updateRecord);

  // Calculate resolution time if resolved or closed
  if (status === 'Resolved' || status === 'Closed') {
    // Store resolution details if resolved
    if (status === 'Resolved') {
      complaint.resolution = {
        description: message || 'Complaint resolved',
        resolvedBy: req.user._id,
        resolvedAt: new Date()
      };
      
      // Send WhatsApp notification for resolution
      try {
        const { sendComplaintResolvedWhatsApp } = await import('../services/whatsappService.js');
        const { findUserById } = await import('../models/User.js');
        
        // Get the complaint owner's phone number
        const { user: complaintOwner } = await findUserById(complaint.user);
        
        if (complaintOwner && complaintOwner.phoneNumber) {
          console.log(`📱 Sending WhatsApp resolution notification to ${complaintOwner.phoneNumber}...`);
          const whatsappResult = await sendComplaintResolvedWhatsApp(
            complaintOwner.phoneNumber,
            complaintOwner.name,
            complaint.complaintId,
            complaint.title,
            message || 'Your complaint has been resolved.'
          );
          
          if (whatsappResult.success) {
            console.log(`✅ WhatsApp resolution notification sent successfully for complaint ${complaint.complaintId}`);
          } else {
            console.log(`⚠️  WhatsApp resolution notification failed: ${whatsappResult.error}`);
          }
        } else {
          console.log('ℹ️  No phone number on complaint owner record, skipping WhatsApp notification');
        }
      } catch (whatsappError) {
        console.error('❌ Failed to send WhatsApp resolution notification:', whatsappError.message);
        // Continue even if WhatsApp fails
      }
    }
  }

  // Save the complaint FIRST before checking agent availability
  console.log(`\n💾 SAVING COMPLAINT TO DATABASE...`);
  console.log(`   Status before save: ${complaint.status}`);
  console.log(`   Resolution before save:`, complaint.resolution ? JSON.stringify(complaint.resolution) : 'None');
  
  await complaint.save();
  
  // Verify the save was successful by re-fetching from database
  const verifyComplaint = await Complaint.findById(complaint._id).lean();
  console.log(`\n✅ COMPLAINT SAVED AND VERIFIED`);
  console.log(`   Complaint ID: ${complaint.complaintId}`);
  console.log(`   Status in memory: ${complaint.status}`);
  console.log(`   Status in DB (verified): ${verifyComplaint.status}`);
  console.log(`   Resolution in DB:`, verifyComplaint.resolution ? 'Present' : 'None');
  console.log(`   Old status: ${oldStatus} → New status: ${verifyComplaint.status}`);
  
  if (verifyComplaint.status !== status) {
    console.error(`\n❌ CRITICAL ERROR: Status mismatch after save!`);
    console.error(`   Expected: ${status}`);
    console.error(`   Got: ${verifyComplaint.status}`);
  }
  
  // Get io instance early for use throughout
  const io = req.app.get('io');
  
  // Send resolution email to user if complaint is marked as resolved
  if (status === 'Resolved') {
    try {
      // Get user details for email
      const complaintUser = await User.findById(complaint.user);
      
      if (complaintUser && complaintUser.email) {
        console.log(`📧 Sending resolution email to ${complaintUser.email}...`);
        await sendComplaintResolvedEmail(
          complaintUser.email,
          complaintUser.name || complaintUser.username,
          complaint.complaintId,
          complaint.title
        );
        console.log(`✅ Resolution email sent successfully for complaint ${complaint.complaintId}`);
      } else {
        console.log('⚠️  User email not found, skipping resolution email');
      }
    } catch (emailError) {
      console.error('❌ Failed to send resolution email:', emailError.message);
      // Continue even if email fails - don't block the resolution process
    }
  }
  
  // NOW check if the assigned agent should be marked available (after save)
  if ((status === 'Resolved' || status === 'Closed') && complaint.assignedTo) {
    // Import the agent service
    const { refreshAgentAvailability } = await import('../services/agentService.js');
    
    try {
      // This will check if agent has any remaining active complaints
      // and update their availability accordingly
      console.log(`🔍 Checking agent availability for ${complaint.assignedTo}...`);
      const updatedAgent = await refreshAgentAvailability(complaint.assignedTo);
      console.log(`🔄 Agent availability refreshed: ${updatedAgent.availability}`);
      
      // Broadcast agent status update via socket
      if (io) {
        io.emit('agent_status_update', {
          agentId: updatedAgent._id.toString(),
          availability: updatedAgent.availability,
          name: updatedAgent.name,
          email: updatedAgent.email
        });
        console.log(`📡 Agent status broadcast: ${updatedAgent.name} is now ${updatedAgent.availability}`);
      }
    } catch (err) {
      console.error('❌ Error updating agent availability:', err);
    }
  }
  
  // Get populated complaint for response - FETCH FRESH FROM DB
  const populatedComplaint = await Complaint.findById(complaint._id)
    .populate('user', 'name email')
    .populate('assignedTo', 'name email')
    .populate('resolution.resolvedBy', 'name email')
    .lean(); // Use lean() for performance and to get plain object
  
  console.log(`\n📊 POPULATED COMPLAINT FOR RESPONSE`);
  console.log(`   Status: ${populatedComplaint.status}`);
  console.log(`   Resolution:`, populatedComplaint.resolution ? 'Present' : 'None');
  console.log(`   Assigned to:`, populatedComplaint.assignedTo?.name || 'Unassigned');
  
  if (populatedComplaint.status !== status) {
    console.error(`\n❌ CRITICAL: Response status doesn't match requested status!`);
    console.error(`   Requested: ${status}`);
    console.error(`   Returning: ${populatedComplaint.status}`);
  }
  
  // Invalidate cache since complaint was updated
  // await invalidateComplaintCache(complaint._id.toString());

  // Emit socket event for real-time updates to user dashboard
  if (io) {
    // Create complete complaint data for socket event
    const complaintData = {
      _id: populatedComplaint._id,
      complaintId: populatedComplaint.complaintId,
      title: populatedComplaint.title,
      description: populatedComplaint.description,
      status: populatedComplaint.status,
      category: populatedComplaint.category,
      priority: populatedComplaint.priority,
      userId: populatedComplaint.user?._id || populatedComplaint.user,
      user: populatedComplaint.user,
      assignedTo: populatedComplaint.assignedTo?._id || populatedComplaint.assignedTo,
      assignedAgentName: populatedComplaint.assignedTo?.name,
      assignedAgentEmail: populatedComplaint.assignedTo?.email,
      createdAt: populatedComplaint.createdAt,
      updatedAt: populatedComplaint.updatedAt,
      resolvedAt: status === 'Resolved' ? populatedComplaint.resolution?.resolvedAt : null,
      resolution: populatedComplaint.resolution,
      updates: populatedComplaint.updates
    };
    
    // Emit to specific user for their dashboard (using both patterns for compatibility)
    const userId = complaint.user.toString();
    io.to(`user:${userId}`).emit('complaintUpdated', { complaint: complaintData });
    io.to(`user:${userId}`).emit('complaint_status_updated', { complaint: complaintData });
    
    // Broadcast to all for general updates
    io.emit('complaintStatusChanged', {
      complaintId: complaint._id,
      status: complaint.status,
      updatedBy: req.user._id,
      complaint: complaintData
    });
    
    console.log(`🔔 Socket events emitted:`);
    console.log(`   - complaintUpdated to user:${userId}`);
    console.log(`   - complaint_status_updated to user:${userId}`);
    console.log(`   - complaintStatusChanged (broadcast)`);
    console.log(`   Status: ${complaint.status}`);
  }
  
  // Publish event to SNS for ticket resolution (triggers worker for auto-assignment)
  if (status === 'Resolved') {
    try {
      await publishEvent('ticket.resolved', {
        ticketId: complaint._id.toString(),
        complaintId: complaint.complaintId,
        agentId: complaint.assignedTo?.toString() || null,
        resolvedBy: req.user._id.toString(),
        resolvedAt: new Date().toISOString(),
        userId: complaint.user.toString(),
        title: complaint.title,
        priority: complaint.priority
      });
      console.log(`📡 SNS Event published: ticket.resolved for ${complaint.complaintId}`);
      console.log(`   Event will trigger worker to mark agent as free and auto-assign next ticket`);
    } catch (snsError) {
      console.error('❌ Failed to publish ticket.resolved event:', snsError.message);
      // Continue even if SNS fails
    }
  }

  console.log(`\n📤 SENDING RESPONSE TO CLIENT`);
  console.log(`   Complaint ID: ${populatedComplaint.complaintId}`);
  console.log(`   Status: ${populatedComplaint.status}`);
  console.log(`   Has resolution:`, !!populatedComplaint.resolution);
  console.log(`   ================================\n`);

  res.json(populatedComplaint);
}));

// Assign complaint to agent
router.patch('/:id/assign', authenticate, authorize('admin', 'agent'), asyncHandler(async (req, res) => {
  const { agentId } = req.body;

  if (!agentId) {
    return res.status(400).json({ error: 'Agent ID is required' });
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  complaint.assignedTo = agentId;
  complaint.status = 'In Progress';
  complaint.updatedAt = new Date();

  // Add update record
  complaint.updates.push({
    message: `Complaint assigned to agent`,
    author: `${req.user.firstName} ${req.user.lastName}`,
    authorId: req.user._id,
    timestamp: new Date(),
    type: 'assignment',
    isInternal: false
  });

  await complaint.save();
  console.log(`✅ Complaint ${complaint.complaintId} assigned to agent ${agentId}`);

  // Mark the agent as busy after assignment
  try {
    const { updateAgentAvailability } = await import('../services/agentService.js');
    await updateAgentAvailability(agentId, 'busy');
    console.log(`📌 Agent ${agentId} marked as BUSY after ticket assignment`);
  } catch (err) {
    console.error('❌ Error updating agent availability to busy:', err);
  }
  
  // Emit socket event for complaint assignment
  const io = req.app.get('io');
  if (io) {
    io.emit('complaintAssigned', {
      complaintId: complaint._id,
      assignedTo: agentId,
      assignedBy: req.user._id
    });
    
    // Also broadcast agent status update
    try {
      const agent = await User.findById(agentId);
      if (agent) {
        io.emit('agent_status_update', {
          agentId: agent._id.toString(),
          availability: 'busy',
          name: agent.name,
          email: agent.email
        });
        console.log(`📡 Agent status broadcast: ${agent.name} is now BUSY`);
      }
    } catch (socketErr) {
      console.error('❌ Error broadcasting agent status:', socketErr);
    }
  }
  
  // Invalidate cache since complaint was assigned
  // await invalidateComplaintCache(complaint._id.toString());

  res.json(complaint);
}));

// Add comment/update to complaint
router.post('/:id/updates', authenticate, asyncHandler(async (req, res) => {
  const { error } = validateComplaintUpdate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { message, type = 'comment', isInternal = false, attachments } = req.body;

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  // Check permissions (user field contains the user who created the complaint)
  if (req.user.role === 'user' && complaint.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Access denied' });
  }

  complaint.updates.push({
    message,
    updatedBy: req.user._id,
    timestamp: new Date(),
    updateType: type,
    isInternal,
    attachments: attachments || []
  });

  complaint.updatedAt = new Date();
  await complaint.save();
  
  // Invalidate cache since complaint was updated
  await invalidateComplaintCache(complaint._id.toString());

  // Emit socket event
  const io = req.app.get('io');
  io.emit('complaintCommentAdded', {
    complaintId: complaint._id,
    update: complaint.updates[complaint.updates.length - 1],
    addedBy: req.user._id
  });

  res.json(complaint);
}));

// Escalate complaint
router.patch('/:id/escalate', authenticate, authorize('agent', 'admin'), asyncHandler(async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'Escalation reason is required' });
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  complaint.isEscalated = true;
  complaint.escalationReason = reason;
  complaint.escalatedAt = new Date();
  complaint.status = 'Escalated';
  complaint.updatedAt = new Date();

  // Add update record
  complaint.updates.push({
    message: `Complaint escalated: ${reason}`,
    author: `${req.user.firstName} ${req.user.lastName}`,
    authorId: req.user._id,
    timestamp: new Date(),
    type: 'escalation',
    isInternal: false
  });

  await complaint.save();

  // Emit socket event
  const io = req.app.get('io');
  io.emit('complaintEscalated', {
    complaintId: complaint._id,
    reason,
    escalatedBy: req.user._id
  });

  res.json(complaint);
}));

// Submit feedback
router.post('/:id/feedback', authenticate, asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  // Only the complaint owner can submit feedback
  if (complaint.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'Only the complaint owner can submit feedback' });
  }

  // Can only submit feedback for resolved/closed complaints
  if (!['Resolved', 'Closed'].includes(complaint.status)) {
    return res.status(400).json({ error: 'Feedback can only be submitted for resolved or closed complaints' });
  }

  complaint.feedback = {
    rating,
    comment: comment || '',
    submittedAt: new Date(),
    submittedBy: req.user._id
  };

  complaint.metrics.customerSatisfaction = rating;
  complaint.updatedAt = new Date();

  await complaint.save();

  res.json({ message: 'Feedback submitted successfully', feedback: complaint.feedback });
}));

// Bulk operations for admin dashboard
router.patch('/bulk/assign', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { complaintIds, assignedTo, assignedTeam } = req.body;

  if (!complaintIds || !Array.isArray(complaintIds) || complaintIds.length === 0) {
    return res.status(400).json({ error: 'Please provide complaint IDs' });
  }

  const updateData = { updatedAt: new Date() };
  if (assignedTo) updateData.assignedTo = assignedTo;
  if (assignedTeam) updateData.assignedTeam = assignedTeam;

  const result = await Complaint.updateMany(
    { _id: { $in: complaintIds } },
    updateData
  );

  // Add updates to each complaint
  await Promise.all(complaintIds.map(async (id) => {
    await Complaint.findByIdAndUpdate(id, {
      $push: {
        updates: {
          message: `Complaint bulk assigned to ${assignedTo ? 'agent' : 'team'}`,
          author: `${req.user.firstName} ${req.user.lastName}`,
          authorId: req.user._id,
          timestamp: new Date(),
          type: 'assignment',
          isInternal: false
        }
      }
    });
  }));

  res.json({ 
    message: `${result.modifiedCount} complaints updated successfully`,
    modifiedCount: result.modifiedCount 
  });
}));

// Bulk status update
router.patch('/bulk/status', authenticate, authorize('admin', 'agent'), asyncHandler(async (req, res) => {
  const { complaintIds, status, message } = req.body;

  if (!complaintIds || !Array.isArray(complaintIds) || complaintIds.length === 0) {
    return res.status(400).json({ error: 'Please provide complaint IDs' });
  }

  if (!status) {
    return res.status(400).json({ error: 'Status is required' });
  }

  const result = await Complaint.updateMany(
    { _id: { $in: complaintIds } },
    { 
      status, 
      updatedAt: new Date(),
      ...(status === 'Resolved' && { resolvedAt: new Date() })
    }
  );

  // Add updates to each complaint
  await Promise.all(complaintIds.map(async (id) => {
    await Complaint.findByIdAndUpdate(id, {
      $push: {
        updates: {
          message: message || `Status updated to ${status}`,
          author: `${req.user.firstName} ${req.user.lastName}`,
          authorId: req.user._id,
          timestamp: new Date(),
          type: 'status_change',
          isInternal: false
        }
      }
    });
  }));

  res.json({ 
    message: `${result.modifiedCount} complaints updated successfully`,
    modifiedCount: result.modifiedCount 
  });
}));

// AI-powered auto-assignment endpoint
router.post('/auto-assign', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { complaintId } = req.body;

  const complaint = await Complaint.findById(complaintId);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  // Import AI assignment service
  const { aiAssignToAgent } = await import('../services/ticketAssignmentService.js');
  const { getIoInstance } = await import('../socket/socketHandlers.js');
  
  try {
    const io = getIoInstance();
    
    // Use AI-powered assignment
    console.log(`🤖 Admin triggered AI assignment for complaint ${complaint.complaintId}`);
    const { assignedAgent, message: assignMessage } = await aiAssignToAgent(complaint._id, io);
    
    if (!assignedAgent) {
      return res.status(400).json({ 
        error: assignMessage || 'No available agents found',
        success: false
      });
    }
    
    // Get updated complaint
    const updatedComplaint = await Complaint.findById(complaint._id)
      .populate('assignedTo', 'name email')
      .populate('user', 'name email');
    
    res.json({ 
      success: true,
      message: 'Complaint AI-assigned successfully',
      assignedTo: {
        id: assignedAgent.id,
        name: assignedAgent.name,
        activeTickets: assignedAgent.activeTickets
      },
      aiAssignment: assignedAgent.aiAssignment,
      complaint: updatedComplaint
    });
  } catch (error) {
    console.error('Error in AI auto-assignment:', error);
    res.status(500).json({ 
      error: 'Failed to auto-assign complaint',
      message: error.message 
    });
  }
}));

// Add internal notes (for agents and admins)
router.post('/:id/internal-notes', authenticate, authorize('agent', 'admin'), asyncHandler(async (req, res) => {
  const { note } = req.body;

  if (!note || note.trim().length === 0) {
    return res.status(400).json({ error: 'Note content is required' });
  }

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  // Check if agent is assigned to this complaint or is admin
  if (req.user.role === 'agent' && complaint.assignedTo?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'You can only add notes to complaints assigned to you' });
  }

  const internalNote = {
    message: note,
    author: `${req.user.firstName} ${req.user.lastName}`,
    authorId: req.user._id,
    timestamp: new Date(),
    type: 'internal_note',
    isInternal: true
  };

  complaint.updates.push(internalNote);
  complaint.updatedAt = new Date();
  await complaint.save();

  res.json({ 
    message: 'Internal note added successfully',
    note: internalNote
  });
}));

// Get internal notes for a complaint
router.get('/:id/internal-notes', authenticate, authorize('agent', 'admin'), asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  // Check if agent is assigned to this complaint or is admin
  if (req.user.role === 'agent' && complaint.assignedTo?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'You can only view notes for complaints assigned to you' });
  }

  const internalNotes = complaint.updates.filter(update => update.isInternal === true);

  res.json({ internalNotes });
}));

// Escalate complaint
router.patch('/:id/escalate', authenticate, authorize('agent', 'admin'), asyncHandler(async (req, res) => {
  const { reason, escalatedTo } = req.body;

  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  complaint.isEscalated = true;
  complaint.escalation = {
    reason: reason || 'Manual escalation',
    escalatedBy: req.user._id,
    escalatedAt: new Date(),
    escalatedTo: escalatedTo || null
  };
  complaint.priority = 'Urgent'; // Auto-upgrade priority
  complaint.updatedAt = new Date();
  complaint.updates.push({
    message: `Complaint escalated: ${reason || 'Manual escalation'}`,
    author: `${req.user.firstName} ${req.user.lastName}`,
    authorId: req.user._id,
    timestamp: new Date(),
    type: 'escalation',
    isInternal: false
  });

  await complaint.save();

  res.json({ 
    message: 'Complaint escalated successfully',
    escalation: complaint.escalation
  });
}));

// Get dashboard statistics for current user
router.get('/stats/dashboard', authenticate, asyncHandler(async (req, res) => {
  let matchFilter = {};

  // Role-based filtering
  if (req.user.role === 'user') {
    matchFilter.user = req.user._id; // Use 'user' field, not 'userId'
  } else if (req.user.role === 'agent') {
    matchFilter.assignedTo = req.user._id;
  }
  // Admin sees all complaints

  const [
    totalComplaints,
    openComplaints,
    inProgressComplaints,
    resolvedComplaints,
    escalatedComplaints,
    overdueComplaints
  ] = await Promise.all([
    Complaint.countDocuments(matchFilter),
    Complaint.countDocuments({ ...matchFilter, status: 'Open' }),
    Complaint.countDocuments({ ...matchFilter, status: 'In Progress' }),
    Complaint.countDocuments({ ...matchFilter, status: 'Resolved' }),
    Complaint.countDocuments({ ...matchFilter, isEscalated: true }),
    Complaint.countDocuments({ 
      ...matchFilter, 
      status: { $nin: ['Resolved', 'Closed'] },
      slaTarget: { $lt: new Date() }
    })
  ]);

  const resolutionRate = totalComplaints > 0 ? ((resolvedComplaints / totalComplaints) * 100).toFixed(1) : 0;

  res.json({
    totalComplaints,
    openComplaints,
    inProgressComplaints,
    resolvedComplaints,
    escalatedComplaints,
    overdueComplaints,
    resolutionRate: parseFloat(resolutionRate)
  });
}));

// Generate AI draft reply for a complaint
router.post('/:id/generate-reply', authenticate, authorize('agent', 'admin'), asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('user', 'name username email');

  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  // Check if agent can generate reply for this complaint
  if (req.user.role === 'agent' && 
      complaint.assignedTo?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'You can only generate replies for complaints assigned to you' });
  }

  try {
    // TODO: Implement KB context retrieval based on complaint category
    // For now, use some basic context based on category
    const kbContext = getKBContextForCategory(complaint.category);
    
    // Determine tone based on sentiment
    const tone = complaint.aiAnalysis?.sentiment === 'Negative' ? 'empathetic' : 'polite';

    // Generate draft reply using AI service
    const aiReply = await aiService.generateReply(
      complaint.description,
      kbContext,
      tone
    );

    // Store the AI draft reply in the complaint
    complaint.aiDraftReply = {
      text: aiReply.draft_reply,
      confidence: aiReply.confidence,
      needsHumanReview: aiReply.needs_human_review,
      model: aiReply.model,
      source: aiReply.source,
      tone: aiReply.tone_used,
      generatedAt: new Date(),
      wasUsed: false,
      wasEdited: false
    };

    await complaint.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`complaint:${complaint._id}`).emit('draftReplyGenerated', {
        complaintId: complaint._id,
        draftReply: complaint.aiDraftReply
      });
    }

    res.json({
      success: true,
      draftReply: complaint.aiDraftReply,
      message: aiReply.needs_human_review 
        ? 'Draft generated - human review required before sending'
        : 'Draft generated - please review before sending'
    });
  } catch (error) {
    console.error('Error generating AI reply:', error);
    res.status(500).json({ 
      error: 'Failed to generate draft reply',
      details: error.message 
    });
  }
}));

// Generate AI summary for a complaint
router.post('/:id/generate-summary', authenticate, authorize('agent', 'admin'), asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  try {
    // Generate summary using AI service
    const aiSummary = await aiService.summarize(complaint.description, 100, 30);

    // Store the AI summary in the complaint
    complaint.aiSummary = {
      text: aiSummary.summary,
      confidence: aiSummary.error ? 0.5 : 0.85,
      model: aiSummary.model,
      generatedAt: new Date()
    };

    await complaint.save();

    res.json({
      success: true,
      summary: complaint.aiSummary
    });
  } catch (error) {
    console.error('Error generating AI summary:', error);
    res.status(500).json({ 
      error: 'Failed to generate summary',
      details: error.message 
    });
  }
}));

// Helper function to get KB context based on category
function getKBContextForCategory(category) {
  // This is a simplified version - in production, use semantic search on KB
  const kbDatabase = {
    'Technical Support': [
      'For technical issues, first verify all cables are connected and device is powered on.',
      'Standard troubleshooting includes: restart device, clear cache, update software.',
      'Technical support response time is 24-48 hours for non-urgent issues.'
    ],
    'Billing': [
      'Refunds are processed within 5-7 business days to the original payment method.',
      'Bill credits are automatically applied for service outages exceeding 24 hours.',
      'For billing disputes, please provide invoice number and specific charges in question.'
    ],
    'Product Quality': [
      'Quality concerns are taken seriously and reviewed by our QA team within 48 hours.',
      'Defective products can be returned within 30 days for full refund or replacement.',
      'Please include photos or videos of the issue to expedite resolution.'
    ],
    'Customer Service': [
      'We apologize for any inconvenience. Customer satisfaction is our top priority.',
      'All feedback is reviewed by management and used to improve our services.',
      'You can escalate concerns to a supervisor by calling our dedicated line.'
    ],
    'Delivery': [
      'Standard delivery time is 3-5 business days. Delays may occur due to weather or holidays.',
      'Track your order using the tracking number provided in your confirmation email.',
      'For missing or delayed deliveries, please provide order number and expected delivery date.'
    ],
    'Account Issues': [
      'Account recovery requires verification via email or phone number on file.',
      'Password resets are sent to registered email and expire after 24 hours.',
      'For security reasons, account changes require identity verification.'
    ]
  };

  return kbDatabase[category] || [
    'Thank you for contacting us. Our support team will assist you promptly.',
    'We take customer concerns seriously and aim to resolve issues within 48 hours.',
    'Please provide any additional details that may help us resolve your issue faster.'
  ];
}

// Accept AI draft reply (save agent's reviewed/edited version)
router.post('/:id/accept-reply', authenticate, authorize('agent', 'admin'), asyncHandler(async (req, res) => {
  const { reply } = req.body;

  if (!reply || !reply.trim()) {
    return res.status(400).json({ error: 'Reply text is required' });
  }

  const complaint = await Complaint.findById(req.params.id);

  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  // Check authorization
  if (req.user.role === 'agent' && 
      complaint.assignedTo?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'You can only accept replies for complaints assigned to you' });
  }

  try {
    // Update the draft reply with agent's version
    if (complaint.aiDraftReply) {
      const wasEdited = complaint.aiDraftReply.text !== reply;
      complaint.aiDraftReply.text = reply;
      complaint.aiDraftReply.wasEdited = wasEdited;
      complaint.aiDraftReply.needsHumanReview = false; // Agent has reviewed
    } else {
      // If no AI draft exists, create one (agent manually created reply)
      complaint.aiDraftReply = {
        text: reply,
        confidence: 1.0, // Manual replies have 100% confidence
        needsHumanReview: false,
        model: 'manual',
        source: 'agent',
        tone: 'professional',
        generatedAt: new Date(),
        wasUsed: false,
        wasEdited: false
      };
    }

    await complaint.save();

    res.json({
      success: true,
      complaint: complaint,
      message: 'Draft reply accepted and saved'
    });
  } catch (error) {
    console.error('Error accepting draft reply:', error);
    res.status(500).json({ 
      error: 'Failed to save draft reply',
      details: error.message 
    });
  }
}));

// Send reply to customer (via email/notification)
router.post('/:id/send-reply', authenticate, authorize('agent', 'admin'), asyncHandler(async (req, res) => {
  const { reply } = req.body;

  if (!reply || !reply.trim()) {
    return res.status(400).json({ error: 'Reply text is required' });
  }

  const complaint = await Complaint.findById(req.params.id)
    .populate('user', 'name username email');

  if (!complaint) {
    return res.status(404).json({ error: 'Complaint not found' });
  }

  // Check authorization
  if (req.user.role === 'agent' && 
      complaint.assignedTo?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'You can only send replies for complaints assigned to you' });
  }

  try {
    // Import email service if available
    const emailService = await import('../services/emailService.js').catch(() => null);
    const notificationService = await import('../services/notificationService.js').catch(() => null);

    // Send email to customer
    if (emailService?.default?.sendEmail) {
      await emailService.default.sendEmail({
        to: complaint.user.email,
        subject: `Re: Your complaint - ${complaint.title}`,
        html: `
          <h2>Response to Your Complaint</h2>
          <p>Dear ${complaint.user.name || 'Customer'},</p>
          <p>${reply.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><small>Complaint ID: ${complaint._id}<br>
          Original message: ${complaint.description}</small></p>
        `
      });
    }

    // Create notification
    if (notificationService?.default?.createNotification) {
      await notificationService.default.createNotification({
        userId: complaint.user._id,
        type: 'complaint_reply',
        title: 'New Reply to Your Complaint',
        message: reply.substring(0, 200) + (reply.length > 200 ? '...' : ''),
        relatedId: complaint._id,
        relatedModel: 'Complaint'
      });
    }

    // Add reply to complaint updates
    complaint.updates.push({
      author: `${req.user.firstName} ${req.user.lastName}`,
      message: reply,
      type: 'agent_reply',
      timestamp: new Date()
    });

    // Mark draft reply as used if it exists
    if (complaint.aiDraftReply) {
      complaint.aiDraftReply.wasUsed = true;
    }

    // Update status if still Open
    if (complaint.status === 'Open') {
      complaint.status = 'In Progress';
    }

    complaint.updatedAt = new Date();
    await complaint.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`complaint:${complaint._id}`).emit('replyPosted', {
        complaintId: complaint._id,
        reply: reply,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      sentAt: new Date().toISOString(),
      messageId: `msg_${Date.now()}`,
      message: 'Reply sent to customer successfully'
    });
  } catch (error) {
    console.error('Error sending reply:', error);
    res.status(500).json({ 
      error: 'Failed to send reply',
      details: error.message 
    });
  }
}));

export default router;

