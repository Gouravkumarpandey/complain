import React, { useState } from 'react';
import { useComplaints } from '../../contexts/ComplaintContext';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../contexts/NotificationContext';
import { Sparkles } from 'lucide-react';

interface ComplaintFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ComplaintForm({ onSuccess, onCancel }: ComplaintFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const { createComplaint } = useComplaints();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const complaint = await createComplaint(formData.title, formData.description, user.id);
      addNotification('success', 'Ticket Created successfully', `Your ticket has been classified as ${complaint.category} with priority ${complaint.priority}.`);
      setFormData({ title: '', description: '' });
      onSuccess?.();
    } catch (error: unknown) {
      const err = error as { message?: string };
      const errorMessage = err.message || 'Failed to file ticket. Please try again.';
      addNotification('error', 'Invalid Ticket', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Customer Information Section */}
      <div>
        <h4 className="text-base font-semibold text-gray-900 mb-4">Customer Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
              Customer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={user?.name || ''}
              readOnly
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-lg text-gray-500 cursor-not-allowed focus:ring-0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={user?.email || ''}
              readOnly
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-lg text-gray-500 cursor-not-allowed focus:ring-0"
            />
          </div>
        </div>
      </div>

      {/* Ticket Details Section */}
      <div>
        <h4 className="text-base font-semibold text-gray-900 mb-4">Ticket Details</h4>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-1.5">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief description of the issue"
              className="w-full px-4 py-2.5 bg-gray-50 border-0 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-teal-400 focus:bg-white transition-all duration-200"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-1.5">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Provide detailed information about the issue..."
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 border-0 rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-teal-400 focus:bg-white transition-all duration-200 resize-none"
              required
            />
            <div className="mt-2 flex items-center gap-2 text-xs text-teal-600">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Priority and Assignment will be automatically handled by our AI agents.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-gray-200 text-gray-700 bg-white rounded-lg font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:ring-offset-2 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || !formData.title.trim() || !formData.description.trim()}
          className="px-6 py-2.5 bg-[#4AC7B5] text-white rounded-lg font-medium hover:bg-[#3eb3a2] focus:outline-none focus:ring-2 focus:ring-[#4AC7B5] focus:ring-offset-2 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center min-w-[140px]"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            'Create Ticket'
          )}
        </button>
      </div>
    </form>
  );
}