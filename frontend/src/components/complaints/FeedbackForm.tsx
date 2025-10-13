import { useState } from 'react';
import { i18n } from '../../i18n';
import { Star, Send } from 'lucide-react';
// Trans and t removed after migration
import { useComplaints } from '../../contexts/ComplaintContext';
import { useNotifications } from '../../contexts/NotificationContext';

interface FeedbackFormProps {
  complaintId: string;
  onClose: () => void;
}

export function FeedbackForm({ complaintId, onClose }: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const { submitFeedback } = useComplaints();
  const { addNotification } = useNotifications();

  const handleSubmit = () => {
    if (rating === 0) {
      addNotification('error', i18n.t('rating_required'), i18n.t('please_provide_a_rating_before_submitting_feedback'));
      return;
    }

    submitFeedback(complaintId, rating, comment);
    addNotification('success', i18n.t('feedback_submitted'), i18n.t('thank_you_for_your_feedback_it_helps_us_improve_our_service'));
    onClose();
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1;
      return (
        <button
          key={index}
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoveredRating(starValue)}
          onMouseLeave={() => setHoveredRating(0)}
          className="transition-colors duration-200"
        >
          <Star
            className={`w-8 h-8 ${
              starValue <= (hoveredRating || rating)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        </button>
      );
    });
  };

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return i18n.t('very_dissatisfied');
      case 2: return i18n.t('dissatisfied');
      case 3: return i18n.t('neutral');
      case 4: return i18n.t('satisfied');
      case 5: return i18n.t('very_satisfied');
      default: return i18n.t('please_rate_your_experience');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
  <h3 className="text-xl font-semibold text-gray-800 mb-4">{i18n.t('how_was_your_experience')}</h3>
  <p className="text-gray-600 mb-6">{i18n.t('your_feedback_helps_us_improve_our_service_quality')}</p>
        
        {/* Rating Stars */}
        <div className="mb-6">
          <div className="flex justify-center gap-2 mb-3">
            {renderStars()}
          </div>
          <div className="text-center">
            <span className="text-lg font-medium text-gray-700">
              {getRatingText(hoveredRating || rating)}
            </span>
          </div>
        </div>

        {/* Comment */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {i18n.t('additional_comments_optional')}
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={i18n.t('tell_us_more_about_your_experience')}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            {i18n.t('cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {i18n.t('submit_feedback')}
          </button>
        </div>
      </div>
    </div>
  );
}
