/**
 * EXAMPLE: How to integrate AI summarization and reply generation into complaint handling
 * 
 * This file shows example patterns for:
 * 1. Auto-summarizing long complaint descriptions
 * 2. Generating draft replies using RAG (knowledge base context)
 * 3. Implementing human-in-the-loop safety with confidence scores
 * 4. Graceful fallbacks when AI service is unavailable
 * 
 * IMPORTANT: Do NOT auto-send AI-generated replies to customers!
 * Always require human review, especially when needs_human_review flag is true.
 */

const Complaint = require('../models/Complaint');
const aiService = require('../services/aiService');

/**
 * Example 1: Create complaint with automatic summarization
 * 
 * Use case: When customer submits long complaint, auto-generate summary
 * for quick overview in dashboard and notifications
 */
async function createComplaintWithSummary(req, res) {
  try {
    const { title, description, category } = req.body;
    
    // Create complaint
    const complaint = new Complaint({
      title,
      description,
      category,
      user: req.user.id,
      status: 'pending'
    });

    // Auto-generate summary if description is long enough
    if (description && description.length > 100) {
      try {
        const summaryResult = await aiService.summarize(
          description,
          80,  // max_length: short summary for dashboard
          30   // min_length
        );
        
        complaint.ai_summary = summaryResult.summary;
        complaint.ai_summary_confidence = summaryResult.error ? 0.5 : 0.85;
        
        console.log('Generated summary:', summaryResult.summary);
      } catch (error) {
        console.error('Summary generation failed, continuing without summary:', error.message);
        // Continue without summary - not critical
      }
    }

    await complaint.save();
    
    res.status(201).json({
      success: true,
      data: complaint
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create complaint',
      error: error.message
    });
  }
}

/**
 * Example 2: Generate draft reply with knowledge base context (RAG)
 * 
 * Use case: Agent clicks "Generate Draft Reply" button in UI
 * System retrieves relevant KB articles and generates contextual response
 */
async function generateDraftReply(req, res) {
  try {
    const { complaintId } = req.params;
    
    // Get complaint
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // STEP 1: Retrieve relevant knowledge base articles
    // (This is simplified - in production, you'd use semantic search on KB)
    const kbContext = await getRelevantKBArticles(complaint.category, complaint.description);
    
    // STEP 2: Generate draft reply
    const replyResult = await aiService.generateReply(
      complaint.description,
      kbContext,  // RAG: Include KB context to ground response
      'empathetic'  // Match tone to complaint sentiment
    );

    // STEP 3: Store draft reply with metadata
    complaint.ai_draft_reply = replyResult.draft_reply;
    complaint.ai_reply_confidence = replyResult.confidence;
    complaint.ai_needs_human_review = replyResult.needs_human_review;
    complaint.ai_reply_model = replyResult.model;
    complaint.ai_reply_generated_at = new Date();
    
    await complaint.save();

    // STEP 4: Return response with appropriate UI guidance
    res.status(200).json({
      success: true,
      data: {
        draft_reply: replyResult.draft_reply,
        confidence: replyResult.confidence,
        needs_human_review: replyResult.needs_human_review,
        model: replyResult.model,
        source: replyResult.source,
        // UI should show warning if confidence is low
        ui_message: replyResult.needs_human_review 
          ? '⚠️ Low confidence - human review required before sending'
          : '✓ Draft generated - please review before sending'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate draft reply',
      error: error.message
    });
  }
}

/**
 * Example 3: Approve and send AI-generated reply (with safety checks)
 * 
 * Use case: Agent reviews draft, optionally edits it, and approves for sending
 * CRITICAL: Always require explicit agent approval before sending to customer
 */
async function approveAndSendReply(req, res) {
  try {
    const { complaintId } = req.params;
    const { edited_reply, agent_edited } = req.body;
    
    const complaint = await Complaint.findById(complaintId);
    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Safety check: Require human review for low confidence replies
    if (complaint.ai_needs_human_review && !agent_edited) {
      return res.status(400).json({
        success: false,
        message: 'This draft requires editing before sending due to low confidence',
        needs_human_review: true
      });
    }

    // Use edited version if provided, otherwise use AI draft
    const finalReply = edited_reply || complaint.ai_draft_reply;

    // TODO: Send reply to customer (via email, SMS, etc.)
    // await emailService.sendReplyToCustomer(complaint.user, finalReply);

    // Update complaint with final reply
    complaint.agent_reply = finalReply;
    complaint.agent_reply_sent_at = new Date();
    complaint.agent_id = req.user.id;
    complaint.was_ai_assisted = true;
    complaint.agent_edited_ai_draft = agent_edited || false;
    complaint.status = 'responded';
    
    await complaint.save();

    res.status(200).json({
      success: true,
      message: 'Reply sent to customer',
      data: complaint
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send reply',
      error: error.message
    });
  }
}

/**
 * Example 4: Batch summarization for dashboard
 * 
 * Use case: Admin views dashboard with many complaints
 * Generate summaries for all complaints that don't have one yet
 */
async function batchGenerateSummaries(req, res) {
  try {
    // Find complaints without summaries that have long descriptions
    const complaints = await Complaint.find({
      ai_summary: { $exists: false },
      description: { $exists: true }
    }).limit(50);  // Process in batches to avoid overwhelming AI service

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: []
    };

    for (const complaint of complaints) {
      if (complaint.description.length < 50) {
        continue;  // Skip short descriptions
      }

      results.processed++;

      try {
        const summaryResult = await aiService.summarize(
          complaint.description,
          100,  // max_length
          30    // min_length
        );

        complaint.ai_summary = summaryResult.summary;
        complaint.ai_summary_confidence = summaryResult.error ? 0.5 : 0.85;
        await complaint.save();
        
        results.succeeded++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          complaintId: complaint._id,
          error: error.message
        });
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    res.status(200).json({
      success: true,
      message: 'Batch summarization completed',
      data: results
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Batch summarization failed',
      error: error.message
    });
  }
}

/**
 * Helper: Get relevant KB articles for RAG
 * (Simplified example - in production, use semantic search)
 */
async function getRelevantKBArticles(category, description) {
  // TODO: Implement actual KB search using embeddings
  // This would:
  // 1. Generate embedding for complaint description
  // 2. Search KB articles with similar embeddings (cosine similarity)
  // 3. Return top 3-5 most relevant articles
  
  // For now, return category-based snippets
  const kbDatabase = {
    'billing': [
      'Refunds are processed within 5-7 business days.',
      'Bill credits are automatically applied for service outages exceeding 24 hours.',
      'For billing disputes, please provide invoice number and specific charges in question.'
    ],
    'technical': [
      'For internet issues, first check if router lights are solid green.',
      'Standard troubleshooting: restart router, check cables, verify account status.',
      'Technical support response time is typically 24-48 hours for non-urgent issues.'
    ],
    'account': [
      'Account recovery requires verification via email or phone number on file.',
      'Password resets are sent to registered email and expire after 24 hours.',
      'For security reasons, account changes require identity verification.'
    ]
  };

  return kbDatabase[category] || [
    'Thank you for contacting us. Our support team will assist you promptly.',
    'We take customer concerns seriously and aim to resolve issues within 48 hours.',
    'Please contact support@quickfix.com if you need immediate assistance.'
  ];
}

/**
 * Example 5: Track AI performance metrics
 * 
 * Use case: Analytics dashboard showing AI reply acceptance rates
 * Helps identify when to retrain models or adjust confidence thresholds
 */
async function getAIPerformanceMetrics(req, res) {
  try {
    const metrics = await Complaint.aggregate([
      {
        $match: {
          ai_draft_reply: { $exists: true },
          agent_reply_sent_at: { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          total_ai_assisted: { $sum: 1 },
          human_edited: { $sum: { $cond: ['$agent_edited_ai_draft', 1, 0] } },
          low_confidence_count: { $sum: { $cond: [{ $lt: ['$ai_reply_confidence', 0.8] }, 1, 0] } },
          avg_confidence: { $avg: '$ai_reply_confidence' }
        }
      }
    ]);

    const data = metrics[0] || {
      total_ai_assisted: 0,
      human_edited: 0,
      low_confidence_count: 0,
      avg_confidence: 0
    };

    res.status(200).json({
      success: true,
      data: {
        ...data,
        acceptance_rate: data.total_ai_assisted > 0 
          ? ((data.total_ai_assisted - data.human_edited) / data.total_ai_assisted * 100).toFixed(1) + '%'
          : 'N/A',
        human_review_rate: data.total_ai_assisted > 0
          ? (data.low_confidence_count / data.total_ai_assisted * 100).toFixed(1) + '%'
          : 'N/A'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get AI metrics',
      error: error.message
    });
  }
}

module.exports = {
  createComplaintWithSummary,
  generateDraftReply,
  approveAndSendReply,
  batchGenerateSummaries,
  getAIPerformanceMetrics
};

/**
 * REQUIRED SCHEMA UPDATES for Complaint model:
 * 
 * Add these fields to backend/src/models/Complaint.js:
 * 
 * // AI-generated summary
 * ai_summary: {
 *   type: String
 * },
 * ai_summary_confidence: {
 *   type: Number,
 *   min: 0,
 *   max: 1
 * },
 * 
 * // AI-generated draft reply
 * ai_draft_reply: {
 *   type: String
 * },
 * ai_reply_confidence: {
 *   type: Number,
 *   min: 0,
 *   max: 1
 * },
 * ai_needs_human_review: {
 *   type: Boolean,
 *   default: true
 * },
 * ai_reply_model: {
 *   type: String
 * },
 * ai_reply_generated_at: {
 *   type: Date
 * },
 * 
 * // Agent interaction with AI
 * agent_reply: {
 *   type: String
 * },
 * agent_reply_sent_at: {
 *   type: Date
 * },
 * agent_edited_ai_draft: {
 *   type: Boolean,
 *   default: false
 * },
 * was_ai_assisted: {
 *   type: Boolean,
 *   default: false
 * }
 */
