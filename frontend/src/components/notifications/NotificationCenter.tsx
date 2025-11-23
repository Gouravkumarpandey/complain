import { useState, useEffect } from 'react';
import { X, Bell, CheckCheck, Trash2, AlertCircle, CheckCircle, Info, AlertTriangle, Clock, MessageSquare } from 'lucide-react';
import apiService from '../../services/apiService';

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  priority: string;
  isRead: boolean;
  createdAt: string;
  relatedComplaint?: {
    complaintId: string;
    title: string;
    status: string;
  };
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiService.getNotifications();
      if (response.data) {
        let notifs = response.data.notifications || [];
        // Filter on client side if needed
        if (filter === 'unread') {
          notifs = notifs.filter((n: Notification) => !n.isRead);
        }
        setNotifications(notifs);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, filter]);

  const markAsRead = async (id: string) => {
    try {
      const response = await apiService.markNotificationAsRead(id);
      if (response.data) {
        setUnreadCount(response.data.unreadCount || 0);
        setNotifications(prev =>
          prev.map(n => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiService.markAllNotificationsAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await apiService.deleteNotification(id);
      if (response.data) {
        setUnreadCount(response.data.unreadCount || 0);
        setNotifications(prev => prev.filter(n => n._id !== id));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const clearAllRead = async () => {
    try {
      await apiService.clearReadNotifications();
      setNotifications(prev => prev.filter(n => !n.isRead));
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'complaint_created':
      case 'complaint_updated':
      case 'status_change':
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case 'complaint_assigned':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'complaint_resolved':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'complaint_escalated':
      case 'sla_warning':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'new_comment':
        return <MessageSquare className="w-5 h-5 text-purple-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Notifications</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Unread Count Badge */}
          {unreadCount > 0 && (
            <div className="bg-white bg-opacity-20 rounded-lg px-3 py-2 mb-3">
              <p className="text-white text-sm font-medium">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-white text-slate-800'
                  : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-white text-slate-800'
                  : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>
        </div>

        {/* Actions Bar */}
        {notifications.length > 0 && (
          <div className="px-6 py-3 bg-gray-50 border-b flex items-center justify-between">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
            <button
              onClick={clearAllRead}
              className="flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear read
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 px-6">
              <Bell className="w-16 h-16 mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No notifications</p>
              <p className="text-sm text-center text-gray-400">
                {filter === 'unread'
                  ? "You're all caught up! No unread notifications."
                  : "You don't have any notifications yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {notification.priority && notification.priority !== 'medium' && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(
                                notification.priority
                              )}`}
                            >
                              {notification.priority}
                            </span>
                          )}
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          )}
                        </div>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        {notification.message}
                      </p>

                      {/* Related Complaint */}
                      {notification.relatedComplaint && (
                        <div className="bg-white border border-gray-200 rounded-lg p-2 mb-2">
                          <p className="text-xs text-gray-500">Related Complaint</p>
                          <p className="text-sm font-medium text-gray-900">
                            #{notification.relatedComplaint.complaintId}
                          </p>
                          <p className="text-xs text-gray-600">
                            {notification.relatedComplaint.title}
                          </p>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {formatTime(notification.createdAt)}
                        </div>

                        <div className="flex items-center gap-2">
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification._id)}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Mark as read
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification._id)}
                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
