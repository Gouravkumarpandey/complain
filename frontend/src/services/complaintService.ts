/**
 * Complaint Service - API calls for complaint operations
 * 
 * Backend endpoints:
 * - GET /api/complaints/:id - Get complaint details
 * - POST /api/complaints/:id/generate-reply - Generate AI draft reply
 * - POST /api/complaints/:id/generate-summary - Generate AI summary
 * - POST /api/complaints/:id/accept-reply - Accept and save draft reply
 * - POST /api/complaints/:id/send-reply - Send reply to customer
 * 
 * Example API response for GET /api/complaints/:id:
 * {
 *   id: "123",
 *   title: "Cannot login",
 *   description: "I can't login to my account...",
 *   aiSummary: {
 *     text: "Customer cannot login after password reset. Email not received.",
 *     confidence: 0.85,
 *     model: "facebook/bart-large-cnn",
 *     generatedAt: "2025-11-07T10:30:00Z"
 *   },
 *   aiDraftReply: {
 *     text: "Hi, sorry for the trouble. Please click this reset link...",
 *     confidence: 0.82,
 *     needsHumanReview: true,
 *     model: "openai/gpt-4o-mini",
 *     source: "OpenAI API",
 *     tone: "empathetic",
 *     generatedAt: "2025-11-07T10:30:00Z"
 *   }
 * }
 */

import apiService from './apiService';
import { Complaint } from '../types/complaint';

interface SendReplyResponse {
  success: boolean;
  sentAt: string;
  messageId?: string;
  message?: string;
}

/**
 * Get complaint details by ID
 * @param id - Complaint ID
 * @returns Promise with complaint data
 */
export async function getComplaint(id: string): Promise<Complaint> {
  const response = await apiService.getComplaint(id);
  
  if (response.error) {
    throw new Error(response.error);
  }
  
  return response.data as Complaint;
}

/**
 * Accept and save the AI-generated draft reply
 * Agent has reviewed and approved the draft
 * 
 * @param id - Complaint ID
 * @param reply - The reply text (may be edited)
 * @returns Promise with updated complaint
 */
export async function acceptDraftReply(id: string, reply: string): Promise<Complaint> {
  // Since apiService doesn't have a specific method for this, we'll refetch after accepting
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/complaints/${id}/accept-reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ reply })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to accept draft reply');
  }
  
  const data = await response.json();
  return data.complaint;
}

/**
 * Send reply to customer via email/notification
 * IMPORTANT: Always show confirmation before calling this!
 * 
 * @param id - Complaint ID  
 * @param reply - The reply text to send
 * @returns Promise with send status
 */
export async function sendReply(id: string, reply: string): Promise<SendReplyResponse> {
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/complaints/${id}/send-reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ reply })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send reply');
  }
  
  return response.json();
}

/**
 * Regenerate AI draft reply for a complaint
 * Calls backend which then calls AI service /reply endpoint
 * 
 * @param id - Complaint ID
 * @returns Promise with new draft reply
 */
export async function regenerateReply(id: string): Promise<Complaint> {
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/complaints/${id}/generate-reply`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to regenerate reply');
  }
  
  // Refetch the full complaint to get updated data
  return getComplaint(id);
}

/**
 * Generate AI summary for a complaint
 * Calls backend which then calls AI service /summarize endpoint
 * 
 * @param id - Complaint ID
 * @returns Promise with updated complaint including summary
 */
export async function generateSummary(id: string): Promise<Complaint> {
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/complaints/${id}/generate-summary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to generate summary');
  }
  
  // Refetch the full complaint to get updated data
  return getComplaint(id);
}

export default {
  getComplaint,
  acceptDraftReply,
  sendReply,
  regenerateReply,
  generateSummary
};
