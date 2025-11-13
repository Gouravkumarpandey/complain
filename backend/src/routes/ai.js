/**
 * AI API routes
 * Provides endpoints for AI-powered features and chatbot functionality
 */

import express from 'express';
import aiService from '../services/aiService.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route POST /api/ai/classify
 * @desc Classify text using AI
 * @access Private
 */
router.post('/classify', authenticate, async (req, res) => {
  try {
    const { text, labels } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false, 
        message: 'Text is required for classification' 
      });
    }
    
    try {
      const result = await aiService.classify(text, labels);
      
      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (aiError) {
      console.warn('AI Service unavailable, using fallback classification:', aiError.message);
      
      // Fallback classification logic
      const textLower = text.toLowerCase();
      let category = 'General';
      let confidence = 0.7;
      
      // Simple keyword-based classification
      if (textLower.includes('password') || textLower.includes('login') || textLower.includes('access')) {
        category = 'Account';
        confidence = 0.85;
      } else if (textLower.includes('payment') || textLower.includes('bill') || textLower.includes('charge')) {
        category = 'Billing';
        confidence = 0.85;
      } else if (textLower.includes('slow') || textLower.includes('error') || textLower.includes('crash')) {
        category = 'Technical';
        confidence = 0.8;
      } else if (textLower.includes('delivery') || textLower.includes('shipping') || textLower.includes('order')) {
        category = 'Delivery';
        confidence = 0.8;
      }
      
      return res.status(200).json({
        success: true,
        top_label: category,
        confidence: confidence,
        fallback: true,
        model: 'keyword-based-fallback'
      });
    }
  } catch (error) {
    console.error('Error classifying text:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to classify text',
      error: error.message
    });
  }
});

/**
 * @route POST /api/ai/response
 * @desc Generate AI response (alias for /chat for backward compatibility)
 * @access Public
 */
router.post('/response', async (req, res) => {
  try {
    const { message, text, sessionId, context } = req.body;
    const inputText = message || text;
    
    if (!inputText) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message or text is required' 
      });
    }
    
    // Use reply generation for general responses
    const result = await aiService.generateReply(inputText, context?.kb_context || [], context?.tone || 'polite');
    
    return res.status(200).json({
      success: true,
      response: result.draft_reply,
      confidence: result.confidence,
      ...result
    });
  } catch (error) {
    console.error('Error generating response:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate response',
      error: error.message
    });
  }
});

/**
 * @route POST /api/ai/chat
 * @desc Generate chatbot response
 * @access Public (no auth required for customer-facing chatbot)
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, text, sessionId, context } = req.body;
    const inputText = message || text;
    
    if (!inputText) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message text is required' 
      });
    }
    
    // Use reply generation for chat responses
    const result = await aiService.generateReply(inputText, context?.kb_context || [], context?.tone || 'friendly');
    
    return res.status(200).json({
      success: true,
      response: result.draft_reply,
      confidence: result.confidence,
      sessionId,
      ...result
    });
  } catch (error) {
    console.error('Error generating chatbot response:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate chatbot response',
      error: error.message
    });
  }
});

/**
 * @route POST /api/ai/agent-response
 * @desc Generate agent assistance response
 * @access Private (agents only)
 */
router.post('/agent-response', authenticate, async (req, res) => {
  try {
    const { prompt, text, context } = req.body;
    const inputText = prompt || text;
    
    if (!inputText) {
      return res.status(400).json({ 
        success: false, 
        message: 'Prompt is required' 
      });
    }
    
    // Use reply generation for agent assistance
    const result = await aiService.generateReply(inputText, context?.kb_context || [], context?.tone || 'professional');
    
    return res.status(200).json({
      success: true,
      response: result.draft_reply,
      confidence: result.confidence,
      ...result
    });
  } catch (error) {
    console.error('Error generating agent response:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate agent response',
      error: error.message
    });
  }
});

export default router;