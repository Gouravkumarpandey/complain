/**
 * Complaint Service - API calls for complaint operations
 * 
 * Backend endpoints:
 * - GET /api/complaints/:id - Get complaint details
 * - POST /api/complaints/:id/generate-reply - Generate AI draft reply
 * - POST /api/complaints/:id/generate-summary - Generate AI summary
 * - POST /api/complaints/:id/accept-reply - Accept and save draft reply
 * - POST /api/complaints/:id/send-reply - Send reply to customer
 */

import api from '../utils/api';
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
  const response = await api.post(`/complaints/${id}/accept-reply`, { reply });
  return response.data.complaint;
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
  const response = await api.post(`/complaints/${id}/send-reply`, { reply });
  return response.data;
}

/**
 * Regenerate AI draft reply for a complaint
 * Calls backend which then calls AI service /reply endpoint
 * 
 * @param id - Complaint ID
 * @returns Promise with new draft reply
 */
export async function regenerateReply(id: string): Promise<Complaint> {
  await api.post(`/complaints/${id}/generate-reply`);
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
  await api.post(`/complaints/${id}/generate-summary`);
  // Refetch the full complaint to get updated data
  return getComplaint(id);
}

/**
 * Get AI-powered category insights using DeepSeek
 * @returns Promise with category statistics and AI analysis
 */
export async function getCategoryInsights(): Promise<{
  categoryStats: Array<{
    _id: string;
    count: number;
    color: string;
    resolutionRate: string;
    avgResolutionTime: number;
    resolvedCount: number;
  }>;
  aiInsights: string;
  totalComplaints: number;
  timestamp: Date;
}> {
  const response = await api.get('/analytics/category-insights');
  return response.data;
}

export default {
  getComplaint,
  acceptDraftReply,
  sendReply,
  regenerateReply,
  generateSummary,
  getCategoryInsights
};
