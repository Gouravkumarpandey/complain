/**
 * AIReplyPanel Component
 * 
 * Displays AI-generated summary and draft reply with agent actions:
 * - Shows AI summary (if available)
 * - Shows draft reply with confidence score
 * - Allows editing the draft reply
 * - Provides buttons: Accept & Save, Send to Customer, Regenerate
 * - Indicates when human review is needed
 * 
 * Props:
 * - complaint: Complaint object with AI fields
 * - onUpdate: Callback when complaint is updated
 * - isAgent: Whether current user is an agent (controls edit capabilities)
 */

import { useState } from 'react';
import {
  Sparkles,
  Send,
  Check,
  RefreshCw,
  AlertTriangle,
  FileText,
  Brain
} from 'lucide-react';
import { Complaint } from '../../types/complaint';
import * as complaintService from '../../services/complaintService';

interface AIReplyPanelProps {
  complaint: Complaint;
  onUpdate: (updatedComplaint: Complaint) => void;
  isAgent?: boolean;
}

export function AIReplyPanel({ complaint, onUpdate, isAgent = false }: AIReplyPanelProps) {
  const [draftReply, setDraftReply] = useState(complaint.aiDraftReply?.text || '');
  const [isEdited, setIsEdited] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Show message temporarily
  const showMessage = (message: string, isError = false) => {
    if (isError) {
      setError(message);
      setTimeout(() => setError(null), 5000);
    } else {
      setSuccessMessage(message);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Handle accept and save draft
  const handleAccept = async () => {
    if (!draftReply.trim()) {
      showMessage('Draft reply cannot be empty', true);
      return;
    }

    setIsAccepting(true);
    setError(null);

    try {
      const updatedComplaint = await complaintService.acceptDraftReply(
        complaint.id,
        draftReply
      );
      onUpdate(updatedComplaint);
      setIsEdited(false);
      showMessage('Draft reply accepted and saved!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to accept draft';
      showMessage(message, true);
      console.error('Failed to accept draft reply:', err);
    } finally {
      setIsAccepting(false);
    }
  };

  // Handle send to customer
  const handleSend = async () => {
    if (!draftReply.trim()) {
      showMessage('Reply cannot be empty', true);
      return;
    }

    // Require confirmation before sending
    const confirmed = window.confirm(
      '⚠️ Are you sure you want to send this reply to the customer?\n\n' +
      'This action cannot be undone and the customer will receive an email/notification.'
    );

    if (!confirmed) return;

    setIsSending(true);
    setError(null);

    try {
      const result = await complaintService.sendReply(complaint.id, draftReply);

      // Refresh complaint data after sending
      const updatedComplaint = await complaintService.getComplaint(complaint.id);
      onUpdate(updatedComplaint);

      showMessage(`Reply sent successfully! ${result.messageId ? `(ID: ${result.messageId})` : ''}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reply';
      showMessage(message, true);
      console.error('Failed to send reply:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Handle regenerate draft
  const handleRegenerate = async () => {
    const confirmed = window.confirm(
      'Regenerate the AI draft reply?\n\n' +
      'This will create a new draft based on the complaint. Any unsaved edits will be lost.'
    );

    if (!confirmed) return;

    setIsRegenerating(true);
    setError(null);

    try {
      const updatedComplaint = await complaintService.regenerateReply(complaint.id);
      onUpdate(updatedComplaint);
      setDraftReply(updatedComplaint.aiDraftReply?.text || '');
      setIsEdited(false);
      showMessage('New draft reply generated!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to regenerate reply';
      showMessage(message, true);
      console.error('Failed to regenerate reply:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  // Handle generate summary
  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    setError(null);

    try {
      const updatedComplaint = await complaintService.generateSummary(complaint.id);
      onUpdate(updatedComplaint);
      showMessage('AI summary generated successfully!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate summary';
      showMessage(message, true);
      console.error('Failed to generate summary:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // Handle textarea change
  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraftReply(e.target.value);
    setIsEdited(e.target.value !== (complaint.aiDraftReply?.text || ''));
  };

  // Calculate confidence percentage
  const confidencePercent = complaint.aiDraftReply?.confidence
    ? Math.round(complaint.aiDraftReply.confidence * 100)
    : 0;

  // Determine confidence color
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-4">
      {/* AI Summary Section */}
      {complaint.aiSummary ? (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">AI Summary</h3>
            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
              {Math.round(complaint.aiSummary.confidence * 100)}% confidence
            </span>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            {complaint.aiSummary.text}
          </p>
          <div className="mt-2 text-xs text-gray-500">
            Generated by {complaint.aiSummary.model} • {new Date(complaint.aiSummary.generatedAt).toLocaleString()}
          </div>
        </div>
      ) : (
        /* No Summary Yet - Show Generate Button */
        isAgent && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-blue-800">No AI summary generated yet</span>
              </div>
              <button
                onClick={handleGenerateSummary}
                disabled={isGeneratingSummary}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 transition-colors text-sm"
              >
                {isGeneratingSummary ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Summary
                  </>
                )}
              </button>
            </div>
          </div>
        )
      )}

      {/* AI Draft Reply Section */}
      {complaint.aiDraftReply ? (
        <div className="bg-white border border-gray-200 rounded-md p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">AI Suggested Reply</h3>
            </div>
            <div className="flex items-center gap-2">
              {/* Confidence Badge */}
              <span className={`text-xs font-medium px-2 py-1 rounded ${getConfidenceColor(confidencePercent)}`}>
                {confidencePercent}% confidence
              </span>

              {/* Human Review Warning */}
              {complaint.aiDraftReply.needsHumanReview && (
                <span className="text-xs font-medium px-2 py-1 rounded bg-red-100 text-red-800 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Review Required
                </span>
              )}
            </div>
          </div>

          {/* Metadata */}
          <div className="mb-3 text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
            <span>Model: {complaint.aiDraftReply.model}</span>
            <span>Source: {complaint.aiDraftReply.source}</span>
            <span>Tone: {complaint.aiDraftReply.tone}</span>
            <span>Generated: {new Date(complaint.aiDraftReply.generatedAt).toLocaleString()}</span>
          </div>

          {/* Editable Draft Reply */}
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Draft Reply {isEdited && <span className="text-orange-600">(edited)</span>}
            </label>
            <textarea
              value={draftReply}
              onChange={handleReplyChange}
              disabled={!isAgent}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-600 min-h-[150px] font-sans text-sm"
              placeholder="No draft reply yet"
            />
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800 flex items-start gap-2">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Action Buttons (Agent Only) */}
          {isAgent && (
            <div className="flex flex-wrap gap-3">
              {/* Accept & Save Button */}
              <button
                onClick={handleAccept}
                disabled={isAccepting || isSending || isRegenerating || !draftReply.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {isAccepting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Accept & Save
                  </>
                )}
              </button>

              {/* Send to Customer Button */}
              <button
                onClick={handleSend}
                disabled={isAccepting || isSending || isRegenerating || !draftReply.trim()}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send to Customer
                  </>
                )}
              </button>

              {/* Regenerate Button */}
              <button
                onClick={handleRegenerate}
                disabled={isAccepting || isSending || isRegenerating}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                title="Generate a new AI draft reply"
              >
                {isRegenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Regenerate
                  </>
                )}
              </button>
            </div>
          )}

          {/* Safety Warning */}
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md text-xs text-orange-800 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Important:</strong> Always review AI-generated replies before sending to customers.
              Verify accuracy, tone, and completeness. AI suggestions should assist, not replace human judgment.
            </div>
          </div>
        </div>
      ) : (
        /* No Draft Reply Yet */
        isAgent && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-6 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-700 mb-2">No AI Draft Reply Yet</h3>
            <p className="text-sm text-gray-600 mb-4">
              Generate an AI-powered draft reply to help respond to this complaint.
            </p>
            <button
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-300 transition-colors text-sm font-medium"
            >
              {isRegenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate AI Draft Reply
                </>
              )}
            </button>
          </div>
        )
      )}
    </div>
  );
}
