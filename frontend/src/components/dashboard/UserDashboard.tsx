import { useState, useEffect } from 'react';
// i18n removed
import { 
  Plus, Clock, CheckCircle, Bell, User, MessageCircle, 
  Search, Calendar, X, Shield, Home, 
  Inbox, HelpCircle, Menu,
  Bot, Star, AlertCircle, Eye, LogOut, Settings, ChevronDown,
  TrendingUp, BarChart3, Activity
} from 'lucide-react';
import { ComplaintForm } from '../complaints/ComplaintForm';
// Trans removed after migration
import { Notifications } from '../notifications/Notifications';
import { useAuth } from '../../hooks/useAuth';
import { useComplaints, Complaint } from '../../contexts/ComplaintContext';
import { 
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export function UserDashboard() {
  const { user, logout } = useAuth();
  const { complaints } = useComplaints();
  const [activeView, setActiveView] = useState('dashboard');
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showChatBot, setShowChatBot] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({
    name: user?.name || 'User',
    email: user?.email || 'user@example.com',
    phone: '+1 (555) 123-4567',
    organization: 'ABC Company',
    role: user?.role || 'user',
    joinDate: '2024-01-15'
  });

  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    security: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    language: 'English (US)',
    timezone: 'GMT-8 (Pacific Time)'
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Update user profile when user changes
  useEffect(() => {
    if (user) {
      setUserProfile({
        name: user.name,
        email: user.email,
        phone: '+1 (555) 123-4567',
        organization: 'ABC Company',
        role: user.role,
        joinDate: '2024-01-15'
      });
    }
  }, [user]);

  // Update filtered complaints when complaints change
  useEffect(() => {
    setLoading(true);
    if (complaints && user) {
      // Filter complaints to show only current user's complaints
      const userComplaints = complaints.filter(c => c.userId === user.id);
      setFilteredComplaints(userComplaints);
    }
    setLoading(false);
  }, [complaints, user]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  // Handle profile save
  const handleSaveProfile = async () => {
    setSaveError('');
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      // Validate password fields if changing password
      if (settings.security.newPassword) {
        if (settings.security.newPassword !== settings.security.confirmPassword) {
          setSaveError('Passwords do not match');
          setIsSaving(false);
          return;
        }
        if (settings.security.newPassword.length < 8) {
          setSaveError('Password must be at least 8 characters');
          setIsSaving(false);
          return;
        }
        if (!settings.security.currentPassword) {
          setSaveError('Current password is required to change password');
          setIsSaving(false);
          return;
        }
      }

      // In a real app, you would make API calls here
      // For now, we'll simulate a successful save
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Save to localStorage for persistence
      localStorage.setItem('userProfile', JSON.stringify(userProfile));
      localStorage.setItem('userSettings', JSON.stringify(settings));

      setSaveSuccess(true);
      setIsSaving(false);
      
      // Reset password fields
      setSettings(prev => ({
        ...prev,
        security: {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }
      }));

      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);

    } catch (error) {
      setSaveError('Failed to save settings. Please try again.');
      setIsSaving(false);
      console.error('Save error:', error);
    }
  };

  // Load saved settings on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    const savedSettings = localStorage.getItem('userSettings');
    
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setUserProfile(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse saved profile:', e);
      }
    }
    
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Calculate statistics from real data
  const stats = {
    total: filteredComplaints.length,
    open: filteredComplaints.filter(c => c.status === 'Open').length,
    inProgress: filteredComplaints.filter(c => c.status === 'In Progress' || c.status === 'Under Review').length,
    resolved: filteredComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length,
    escalated: filteredComplaints.filter(c => c.status === 'Escalated').length,
    urgent: filteredComplaints.filter(c => c.priority === 'High' || c.priority === 'Urgent').length,
    thisWeek: filteredComplaints.filter(c => {
      const createdDate = new Date(c.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdDate >= weekAgo;
    }).length,
    avgResponseTime: '2.5h'
  };

  // Prepare chart data - Status Distribution for Pie Chart
  const statusChartData = [
    { name: 'Open', value: stats.open, color: '#3B82F6' },
    { name: 'In Progress', value: stats.inProgress, color: '#F59E0B' },
    { name: 'Resolved', value: stats.resolved, color: '#10B981' },
    { name: 'Escalated', value: stats.escalated, color: '#EF4444' }
  ].filter(item => item.value > 0);

  // Prepare trend data for Line Chart (last 7 days)
  const getTrendData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const created = filteredComplaints.filter(c => {
        const complaintDate = new Date(c.createdAt);
        return complaintDate.toDateString() === date.toDateString();
      }).length;

      const resolved = filteredComplaints.filter(c => {
        const complaintDate = new Date(c.updatedAt || c.createdAt);
        return complaintDate.toDateString() === date.toDateString() && 
               (c.status === 'Resolved' || c.status === 'Closed');
      }).length;

      days.push({ date: dateStr, created, resolved });
    }
    return days;
  };

  const trendData = getTrendData();

  // Prepare category data for Bar Chart
  const categoryData = [
    { category: 'Technical', count: filteredComplaints.filter(c => c.category === 'Technical').length },
    { category: 'Billing', count: filteredComplaints.filter(c => c.category === 'Billing').length },
    { category: 'Service', count: filteredComplaints.filter(c => c.category === 'Service').length },
    { category: 'Product', count: filteredComplaints.filter(c => c.category === 'Product').length },
    { category: 'General', count: filteredComplaints.filter(c => c.category === 'General').length }
  ].filter(item => item.count > 0);

  // Prepare priority data
  const priorityData = [
    { name: 'Low', value: filteredComplaints.filter(c => c.priority === 'Low').length, color: '#10B981' },
    { name: 'Medium', value: filteredComplaints.filter(c => c.priority === 'Medium').length, color: '#F59E0B' },
    { name: 'High', value: filteredComplaints.filter(c => c.priority === 'High' || c.priority === 'Urgent').length, color: '#EF4444' }
  ].filter(item => item.value > 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'In Progress':
      case 'Under Review':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Escalated':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Open':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
      case 'Urgent':
        return 'text-red-600 bg-red-50';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'Low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Freshdesk-style Clean Sidebar */}
      <div className="bg-slate-800 w-16 flex flex-col items-center py-4 space-y-4">
        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        
        <div className="space-y-2">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              activeView === 'dashboard' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Dashboard"
          >
            <Home className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setActiveView('complaints')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              activeView === 'complaints' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="My Complaints"
          >
            <Inbox className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setActiveView('new-complaint')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              activeView === 'new-complaint' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="File New Complaint"
          >
            <Plus className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setActiveView('profile')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              activeView === 'profile' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Profile Management"
          >
            <User className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setShowNotifications(true)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setShowChatBot(true)}
            className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="AI Assistant"
          >
            <Bot className="w-5 h-5" />
          </button>
          
          <button className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Help & Support"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Freshdesk-style Clean Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              {activeView === 'dashboard' && 'User Dashboard'}
              {activeView === 'complaints' && 'My Complaints'}
              {activeView === 'new-complaint' && 'File New Complaint'}
              {activeView === 'profile' && 'Profile Management'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
              <button 
              onClick={() => setActiveView('new-complaint')}
              className="text-slate-800 hover:text-slate-900 font-medium text-sm flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg"
            >
              <Plus className="w-4 h-4" />
              New Complaint
            </button>            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
              <Search className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => setShowNotifications(true)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg relative"
            >
              <Bell className="w-5 h-5" />
              {stats.open > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {stats.open}
                </span>
              )}
            </button>
            
            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
              <HelpCircle className="w-5 h-5" />
            </button>
            
            <div className="relative user-menu-container">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
              >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {userProfile.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{userProfile.name}</p>
                  <p className="text-xs text-gray-500">{userProfile.role}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                  <button 
                    onClick={() => {
                      setActiveView('profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4" />
                    Profile Settings
                  </button>
                  <hr className="my-1" />
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard View - Core Complaint Features */}
        {activeView === 'dashboard' && (
          <div className="p-6 bg-gray-50 min-h-screen">
            {/* Clean Welcome Section */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">Welcome back, {userProfile.name}</h2>
              <p className="text-gray-600">Here's an overview of your tickets</p>
            </div>

            {/* Clean Stats Cards - Freshdesk Style */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Inbox className="w-5 h-5 text-gray-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stats.total}</div>
                <p className="text-sm text-gray-600">Total</p>
              </div>
              
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stats.open}</div>
                <p className="text-sm text-gray-600">Open</p>
              </div>
              
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stats.inProgress}</div>
                <p className="text-sm text-gray-600">In Progress</p>
              </div>
              
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stats.resolved}</div>
                <p className="text-sm text-gray-600">Resolved</p>
              </div>
              
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stats.urgent}</div>
                <p className="text-sm text-gray-600">Urgent</p>
              </div>
              
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stats.escalated}</div>
                <p className="text-sm text-gray-600">Escalated</p>
              </div>
            </div>

            {/* Analytics Charts Section - Freshdesk Style */}
            {filteredComplaints.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Status Distribution Pie Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Status Distribution</h3>
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                      <Activity className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={statusChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {statusChartData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Priority Distribution Pie Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Priority Levels</h3>
                    <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={priorityData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {priorityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {priorityData.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tickets Trend Line Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">7-Day Trend</h3>
                    <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line 
                        type="monotone" 
                        dataKey="created" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        name="Created"
                        dot={{ fill: '#3B82F6', r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="resolved" 
                        stroke="#10B981" 
                        strokeWidth={2}
                        name="Resolved"
                        dot={{ fill: '#10B981', r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Distribution Bar Chart */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">By Category</h3>
                    <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={categoryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="category" tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Bar dataKey="count" fill="#8B5CF6" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Complaints - Clean Freshdesk Style */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Tickets</h3>
                  <button 
                    onClick={() => setActiveView('complaints')}
                    className="text-slate-800 hover:text-slate-900 text-sm font-medium"
                  >
                    View all
                  </button>
                </div>
                <div className="p-5">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-800 border-t-transparent mx-auto"></div>
                      <p className="text-gray-500 mt-3 text-sm">Loading tickets...</p>
                    </div>
                  ) : filteredComplaints.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <Inbox className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="text-base font-medium text-gray-700 mb-1">No tickets yet</p>
                      <p className="text-sm text-gray-500 mb-4">Create your first ticket to get started</p>
                      <button 
                        onClick={() => setActiveView('new-complaint')}
                        className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 text-sm font-medium"
                      >
                        Create Ticket
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredComplaints.slice(0, 5).map((complaint) => (
                        <div key={complaint.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSelectedComplaint(complaint)}>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 text-sm mb-1 truncate">{complaint.title}</h4>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-1">{complaint.description}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{new Date(complaint.createdAt).toLocaleDateString()}</span>
                                <span>•</span>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                                  {complaint.priority}
                                </span>
                              </div>
                            </div>
                            <span className={`px-2.5 py-1 text-xs font-medium rounded border ${getStatusColor(complaint.status)} whitespace-nowrap`}>
                              {complaint.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions - Clean Style */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-5 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                </div>
                <div className="p-5">
                  <div className="space-y-2">
                    <button 
                      onClick={() => setActiveView('new-complaint')}
                      className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Plus className="w-5 h-5 text-slate-800" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm">New Ticket</h4>
                        <p className="text-xs text-gray-600">Create a new ticket</p>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => setActiveView('complaints')}
                      className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      <div className="w-9 h-9 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Inbox className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm">My Tickets</h4>
                        <p className="text-xs text-gray-600">View all tickets</p>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => setActiveView('profile')}
                      className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      <div className="w-9 h-9 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm">Profile</h4>
                        <p className="text-xs text-gray-600">Manage account</p>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => setShowChatBot(true)}
                      className="w-full flex items-center gap-3 p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
                    >
                      <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 text-sm">Support</h4>
                        <p className="text-xs text-gray-600">Get help</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Legend - Clean Style */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-5 border-b border-gray-200">
                <h3 className="text-base font-semibold text-gray-900">Ticket Status Guide</h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Open</p>
                      <p className="text-xs text-gray-600">New tickets</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">In Progress</p>
                      <p className="text-xs text-gray-600">Under review</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Resolved</p>
                      <p className="text-xs text-gray-600">Completed</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Escalated</p>
                      <p className="text-xs text-gray-600">Needs attention</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clean Complaints List View */}
        {activeView === 'complaints' && (
          <div className="p-6 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">My Tickets</h3>
                  <p className="text-sm text-gray-600 mt-0.5">View and manage all your tickets</p>
                </div>
                <button 
                  onClick={() => setActiveView('new-complaint')}
                  className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  New Ticket
                </button>
              </div>
              <div className="p-5">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-800 border-t-transparent mx-auto"></div>
                    <p className="text-gray-600 mt-3 text-sm">Loading tickets...</p>
                  </div>
                ) : filteredComplaints.length === 0 ? (
                  <div className="text-center py-12">
                    <Inbox className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-semibold text-gray-800 mb-2">No tickets found</p>
                    <p className="text-gray-600 mb-6 text-sm">You haven't created any tickets yet</p>
                    <button 
                      onClick={() => setActiveView('new-complaint')}
                      className="bg-slate-800 text-white px-6 py-2.5 rounded-lg hover:bg-slate-700 text-sm font-medium"
                    >
                      Create Your First Ticket
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredComplaints.map((complaint) => (
                      <div key={complaint.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSelectedComplaint(complaint)}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-gray-900 truncate">{complaint.title}</h4>
                              <span className={`px-2.5 py-0.5 text-xs font-medium rounded border ${getStatusColor(complaint.status)} whitespace-nowrap`}>
                                {complaint.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{complaint.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(complaint.createdAt).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="w-3.5 h-3.5" />
                                {complaint.category}
                              </span>
                              <span className={`px-2 py-0.5 rounded font-medium ${getPriorityColor(complaint.priority)}`}>
                                {complaint.priority}
                              </span>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedComplaint(complaint);
                            }}
                            className="text-slate-800 hover:text-slate-900 text-sm font-medium whitespace-nowrap"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Clean New Complaint View */}
        {activeView === 'new-complaint' && (
          <div className="p-6 bg-gray-50 min-h-screen">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Create New Ticket</h3>
                    <p className="text-sm text-gray-600 mt-0.5">Fill in the details to create a new support ticket</p>
                  </div>
                  <button 
                    onClick={() => setActiveView('dashboard')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <ComplaintForm onSuccess={() => setActiveView('complaints')} />
              </div>
            </div>
          </div>
        )}

        {/* Freshdesk-Style Profile Settings */}
        {activeView === 'profile' && (
          <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-5xl mx-auto">
              {/* Profile Header Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="relative">
                      <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                        {userProfile.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <button className="absolute bottom-0 right-0 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">{userProfile.name}</h2>
                      <p className="text-gray-600 mb-3">{userProfile.email}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-sm font-medium">{userProfile.role}</span>
                        <span className="text-sm text-gray-600 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          Member since {new Date(userProfile.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings Sections */}
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-5 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                    <p className="text-sm text-gray-600 mt-1">Update your personal details and contact information</p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <input 
                          type="text" 
                          value={userProfile.name.split(' ')[0] || ''}
                          onChange={(e) => setUserProfile({...userProfile, name: e.target.value + ' ' + (userProfile.name.split(' ')[1] || '')})}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                          placeholder="Enter first name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <input 
                          type="text" 
                          value={userProfile.name.split(' ')[1] || ''}
                          onChange={(e) => setUserProfile({...userProfile, name: (userProfile.name.split(' ')[0] || '') + ' ' + e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                          placeholder="Enter last name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <input 
                          type="email" 
                          value={userProfile.email}
                          onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                          placeholder="your.email@example.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input 
                          type="tel" 
                          value={userProfile.phone}
                          onChange={(e) => setUserProfile({...userProfile, phone: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                        <input 
                          type="text" 
                          value={userProfile.organization}
                          onChange={(e) => setUserProfile({...userProfile, organization: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                          placeholder="Your organization name"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notification Preferences */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-5 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
                    <p className="text-sm text-gray-600 mt-1">Manage how you receive notifications</p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Bell className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">Email Notifications</p>
                            <p className="text-sm text-gray-600">Receive email updates for ticket status changes</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={settings.notifications.email}
                            onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, email: e.target.checked}})}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-800"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <MessageCircle className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">SMS Notifications</p>
                            <p className="text-sm text-gray-600">Get text messages for urgent updates</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={settings.notifications.sms}
                            onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, sms: e.target.checked}})}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-800"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Bell className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">Push Notifications</p>
                            <p className="text-sm text-gray-600">Receive in-app notifications</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={settings.notifications.push}
                            onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, push: e.target.checked}})}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-800"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Settings */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-5 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Security</h3>
                    <p className="text-sm text-gray-600 mt-1">Manage your password and security settings</p>
                  </div>
                  <div className="p-6">
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                        <input 
                          type="password"
                          value={settings.security.currentPassword}
                          onChange={(e) => setSettings({...settings, security: {...settings.security, currentPassword: e.target.value}})}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                          placeholder="Enter current password"
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                          <input 
                            type="password"
                            value={settings.security.newPassword}
                            onChange={(e) => setSettings({...settings, security: {...settings.security, newPassword: e.target.value}})}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                            placeholder="Enter new password"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                          <input 
                            type="password"
                            value={settings.security.confirmPassword}
                            onChange={(e) => setSettings({...settings, security: {...settings.security, confirmPassword: e.target.value}})}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <Shield className="w-5 h-5 text-slate-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900 mb-1">Two-Factor Authentication</p>
                            <p className="text-sm text-gray-600 mb-3">Add an extra layer of security to your account</p>
                            <button className="text-slate-800 hover:text-slate-900 font-medium text-sm">
                              Enable 2FA →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Language & Time Zone */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                  <div className="p-5 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Language & Region</h3>
                    <p className="text-sm text-gray-600 mt-1">Set your preferred language and timezone</p>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                        <select 
                          value={settings.language}
                          onChange={(e) => setSettings({...settings, language: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                        >
                          <option>English (US)</option>
                          <option>Spanish</option>
                          <option>French</option>
                          <option>German</option>
                          <option>Hindi</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
                        <select 
                          value={settings.timezone}
                          onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                        >
                          <option>GMT-8 (Pacific Time)</option>
                          <option>GMT-5 (Eastern Time)</option>
                          <option>GMT+0 (London)</option>
                          <option>GMT+5:30 (India)</option>
                          <option>GMT+8 (Singapore)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Success/Error Messages */}
                {(saveSuccess || saveError) && (
                  <div className={`rounded-lg p-4 ${saveSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <div className="flex items-center gap-3">
                      {saveSuccess ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium text-green-900">Settings saved successfully!</p>
                            <p className="text-sm text-green-700 mt-0.5">Your profile and preferences have been updated.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-red-600" />
                          <div>
                            <p className="font-medium text-red-900">Error saving settings</p>
                            <p className="text-sm text-red-700 mt-0.5">{saveError}</p>
                          </div>
                        </>
                      )}
                      <button 
                        onClick={() => {
                          setSaveSuccess(false);
                          setSaveError('');
                        }}
                        className="ml-auto text-gray-500 hover:text-gray-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <button 
                    onClick={() => setActiveView('dashboard')}
                    className="text-gray-600 hover:text-gray-800 font-medium text-sm"
                  >
                    ← Back to Dashboard
                  </button>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setActiveView('dashboard')}
                      className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-300 font-medium text-sm transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="bg-slate-800 text-white px-6 py-2.5 rounded-lg hover:bg-slate-700 font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Save All Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Clean Complaint Details Modal */}
        {selectedComplaint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900">Ticket Details</h3>
                  <button 
                    onClick={() => setSelectedComplaint(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)] custom-scrollbar">
                <div className="space-y-5">
                  {/* Header */}
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900 mb-3">{selectedComplaint.title}</h4>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded border ${getStatusColor(selectedComplaint.status)}`}>
                            {selectedComplaint.status}
                          </span>
                          <span className={`px-2.5 py-1 text-xs font-medium rounded ${getPriorityColor(selectedComplaint.priority)}`}>
                            {selectedComplaint.priority} Priority
                          </span>
                          <span className="text-xs text-gray-600 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(selectedComplaint.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {selectedComplaint.status === 'Resolved' && (
                        <button 
                          onClick={() => {
                            setSelectedComplaint(null);
                            setShowFeedbackForm(true);
                          }}
                          className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 flex items-center gap-2 text-sm font-medium"
                        >
                          <Star className="w-4 h-4" />
                          Give Feedback
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2 text-sm">Description</h5>
                    <p className="text-sm text-gray-700 leading-relaxed">{selectedComplaint.description}</p>
                  </div>

                  {/* Timeline */}
                  <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-4 text-sm">Activity Timeline</h5>
                    <div className="space-y-4 relative">
                      <div className="absolute left-4 top-4 bottom-4 w-px bg-gray-300"></div>
                      
                      <div className="flex gap-3 relative">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center z-10">
                          <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1 pt-0.5">
                          <p className="font-medium text-gray-900 text-sm">Ticket Submitted</p>
                          <p className="text-xs text-gray-600 mt-0.5">ID: #{selectedComplaint.id}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(selectedComplaint.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      {selectedComplaint.status !== 'Open' && (
                        <div className="flex gap-3 relative">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center z-10">
                            <Eye className="w-4 h-4 text-yellow-600" />
                          </div>
                          <div className="flex-1 pt-0.5">
                            <p className="font-medium text-gray-900 text-sm">Under Review</p>
                            <p className="text-xs text-gray-600 mt-0.5">Assigned to support team</p>
                            <p className="text-xs text-gray-500 mt-1">Updated recently</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedComplaint.status === 'Resolved' && (
                        <div className="flex gap-3 relative">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center z-10">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1 pt-0.5">
                            <p className="font-medium text-gray-900 text-sm">Ticket Resolved</p>
                            <p className="text-xs text-gray-600 mt-0.5">Successfully closed</p>
                            <p className="text-xs text-gray-500 mt-1">Recently</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Support */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Need Additional Help?</p>
                        <p className="text-xs text-gray-600 mt-0.5">Chat with our support assistant</p>
                      </div>
                      <button 
                        onClick={() => {
                          setSelectedComplaint(null);
                          setShowChatBot(true);
                        }}
                        className="bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 text-sm font-medium"
                      >
                        Chat Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ChatBot Modal */}
        {showChatBot && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4 max-h-[600px]">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
                  </div>
                  <button 
                    onClick={() => setShowChatBot(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="h-[500px] p-4">
                <div className="text-center text-gray-500">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-blue-500" />
                  <p>AI Assistant is ready to help!</p>
                  <p className="text-sm mt-2">Ask me about your complaints or get support.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Modal */}
        {showNotifications && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4 max-h-[600px]">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="h-[500px] overflow-auto">
                <Notifications />
              </div>
            </div>
          </div>
        )}

        {/* Clean Feedback Form Modal */}
        {showFeedbackForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Submit Feedback</h3>
                  <button 
                    onClick={() => setShowFeedbackForm(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-5">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button 
                          key={star} 
                          className="text-3xl hover:scale-110 transition-transform"
                        >
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
                    <textarea 
                      className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      placeholder="Share your feedback..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowFeedbackForm(false)}
                      className="flex-1 bg-slate-800 text-white px-4 py-2 rounded-lg hover:bg-slate-700 font-medium text-sm"
                    >
                      Submit
                    </button>
                    <button 
                      onClick={() => setShowFeedbackForm(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}