import React, { useState } from 'react';
import { i18n } from '../../i18n';
// Trans and t removed after migration
import { useComplaints } from '../../contexts/ComplaintContext';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../contexts/NotificationContext';
import { Send, FileText, Sparkles } from 'lucide-react';

interface ComplaintFormProps {
  onSuccess?: () => void;
}

export function ComplaintForm({ onSuccess }: ComplaintFormProps) {
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
  addNotification('success', i18n.t('complaint_filed_successfully'), i18n.t('your_complaint_has_been_classified_as', { category: complaint.category, priority: complaint.priority }));
      setFormData({ title: '', description: '' });
      onSuccess?.();
    } catch {
      // We're not using the error parameter, so we omit it completely
  addNotification('error', i18n.t('error'), i18n.t('failed_to_file_complaint_please_try_again'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          {i18n.t('complaint_title')}
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder={i18n.t('brief_summary_of_your_complaint')}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            required
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          {i18n.t('detailed_description')}
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder={i18n.t('please_provide_a_detailed_description_of_your_complaint')}
          rows={6}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 resize-none"
          required
        />
        <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
          <Sparkles className="w-4 h-4" />
          <span>{i18n.t('our_ai_will_automatically_categorize_and_prioritize_your_com')}</span>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !formData.title.trim() || !formData.description.trim()}
        className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <Send className="w-5 h-5" />
            {i18n.t('submit_complaint')}
          </>
        )}
      </button>
    </form>
  );
}