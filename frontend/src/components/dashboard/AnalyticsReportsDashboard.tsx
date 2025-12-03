import { useState, useEffect } from 'react';
import { 
  TrendingUp, Download, Settings, Search,
  Clock, Users, Shield, Home,
  Bell, HelpCircle, Menu,
  ChevronDown, LogOut, BarChart3,
  Activity, CheckCircle, Star,
  Save, AlertCircle,
  Calendar, MessageCircle, X, RefreshCw
} from 'lucide-react';
import { useComplaints } from '../../contexts/ComplaintContext';
import { useAuth } from '../../hooks/useAuth';
import { Notifications } from '../notifications/Notifications';
import { 
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export function AnalyticsReportsDashboard() {
  const { complaints, refreshComplaints } = useComplaints();
  const { user, logout } = useAuth();
  
  // State management
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedReport, setSelectedReport] = useState<'overview' | 'sla' | 'agents' | 'trends' | 'export' | 'profile'>('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  // Settings state
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
      reportAlerts: true,
      slaWarnings: true,
      weeklyDigest: true
    },
    security: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    },
    language: 'English (US)',
    timezone: 'GMT-8 (Pacific Time)'
  });
  
  // Save states
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Handle profile save
  const handleSaveProfile = async () => {
    setSaveError('');
    setSaveSuccess(false);
    setIsSaving(true);

    try {
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

      await new Promise(resolve => setTimeout(resolve, 1000));
      localStorage.setItem('analystSettings', JSON.stringify(settings));

      setSaveSuccess(true);
      setIsSaving(false);
      
      setSettings(prev => ({
        ...prev,
        security: {
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        }
      }));

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
    const savedSettings = localStorage.getItem('analystSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }
  }, []);
  
  // Profile photo state
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  
  // Analyst profile data
  const [analystProfile, setAnalystProfile] = useState({
    name: user?.name || 'Analyst',
    email: user?.email || 'analyst@example.com',
    phone: '+1 (555) 456-7890',
    department: 'Analytics',
    role: user?.role || 'analyst',
    joinDate: '2023-11-10',
    lastLogin: new Date().toLocaleString()
  });
  
  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle photo remove
  const handlePhotoRemove = () => {
    setProfilePhoto(null);
  };
  
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
  
  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };
  
  // Handle dashboard refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshComplaints();
      console.log('Dashboard data refreshed from database');
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Filter complaints based on selected time range
  const getFilteredComplaints = () => {
    const now = new Date();
    let daysBack = 30;
    if (selectedTimeRange === '7d') daysBack = 7;
    else if (selectedTimeRange === '90d') daysBack = 90;
    
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - daysBack);
    
    return complaints.filter(c => new Date(c.createdAt) >= startDate);
  };
  
  const filteredComplaints = getFilteredComplaints();
  
  // Filter complaints by search query
  const filteredBySearch = searchQuery.trim() ? filteredComplaints.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.complaintId && c.complaintId.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  // Handle search result selection
  const handleSearchSelect = (complaint: typeof complaints[0]) => {
    setShowSearchModal(false);
    setSearchQuery('');
    // Navigate to overview or show complaint details
    setSelectedReport('overview');
    console.log('Selected complaint:', complaint);
  };
  
  // Calculate analytics data from database
  const analyticsData = {
    total: filteredComplaints.length,
    resolved: filteredComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length,
    pending: filteredComplaints.filter(c => c.status === 'Open' || c.status === 'In Progress').length,
    escalated: filteredComplaints.filter(c => c.status === 'Escalated' || c.isEscalated).length,
    highPriority: filteredComplaints.filter(c => c.priority === 'High' || c.priority === 'Urgent').length,
    avgResolutionTime: (() => {
      const resolvedComplaints = filteredComplaints.filter(c => c.resolutionTime);
      if (resolvedComplaints.length === 0) return '0 days';
      const avgHours = resolvedComplaints.reduce((sum, c) => sum + (c.resolutionTime || 0), 0) / resolvedComplaints.length;
      return `${(avgHours / 24).toFixed(1)} days`;
    })(),
    satisfactionScore: (() => {
      const withFeedback = filteredComplaints.filter(c => c.feedback?.rating);
      if (withFeedback.length === 0) return 0;
      return (withFeedback.reduce((sum, c) => sum + (c.feedback?.rating || 0), 0) / withFeedback.length).toFixed(1);
    })()
  };

  // Chart data from database
  const statusData = [
    { name: 'Open', value: filteredComplaints.filter(c => c.status === 'Open').length, color: '#3B82F6' },
    { name: 'In Progress', value: filteredComplaints.filter(c => c.status === 'In Progress').length, color: '#F59E0B' },
    { name: 'Resolved', value: filteredComplaints.filter(c => c.status === 'Resolved').length, color: '#10B981' },
    { name: 'Closed', value: filteredComplaints.filter(c => c.status === 'Closed').length, color: '#6B7280' },
    { name: 'Escalated', value: filteredComplaints.filter(c => c.status === 'Escalated').length, color: '#EF4444' }
  ].filter(item => item.value > 0);

  const categoryData = [
    { category: 'Technical', count: filteredComplaints.filter(c => c.category === 'Technical').length, color: '#3B82F6' },
    { category: 'Billing', count: filteredComplaints.filter(c => c.category === 'Billing').length, color: '#10B981' },
    { category: 'Product', count: filteredComplaints.filter(c => c.category === 'Product').length, color: '#F59E0B' },
    { category: 'Service', count: filteredComplaints.filter(c => c.category === 'Service').length, color: '#8B5CF6' },
    { category: 'General', count: filteredComplaints.filter(c => c.category === 'General').length, color: '#6B7280' }
  ].filter(item => item.count > 0);

  const getTrendData = () => {
    const days = [];
    const daysToShow = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 14 : 30;
    
    for (let i = daysToShow - 1; i >= 0; i--) {
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Collapsible Sidebar */}
      <div className={`bg-slate-800 ${sidebarCollapsed ? 'w-16' : 'w-64'} flex flex-col py-4 transition-all duration-300 ease-in-out`}>
        {/* Logo */}
        <div className={`${sidebarCollapsed ? 'px-3' : 'px-4'} mb-4`}>
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-white font-semibold text-lg">QuickFix</span>
            )}
          </div>
        </div>
        
        {/* Navigation */}
        <div className={`space-y-1 ${sidebarCollapsed ? 'px-3' : 'px-4'}`}>
          <button 
            onClick={() => setSelectedReport('overview')}
            className={`w-full ${sidebarCollapsed ? 'h-10' : 'h-10'} rounded-lg flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-3'} gap-3 transition-colors ${
              selectedReport === 'overview' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Overview"
          >
            <Home className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Overview</span>}
          </button>
          
          <button 
            onClick={() => setSelectedReport('sla')}
            className={`w-full ${sidebarCollapsed ? 'h-10' : 'h-10'} rounded-lg flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-3'} gap-3 transition-colors ${
              selectedReport === 'sla' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="SLA Compliance"
          >
            <Clock className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">SLA Compliance</span>}
          </button>
          
          <button 
            onClick={() => setSelectedReport('agents')}
            className={`w-full ${sidebarCollapsed ? 'h-10' : 'h-10'} rounded-lg flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-3'} gap-3 transition-colors ${
              selectedReport === 'agents' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Agent Performance"
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Agent Performance</span>}
          </button>
          
          <button 
            onClick={() => setSelectedReport('trends')}
            className={`w-full ${sidebarCollapsed ? 'h-10' : 'h-10'} rounded-lg flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-3'} gap-3 transition-colors ${
              selectedReport === 'trends' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Trends Analysis"
          >
            <TrendingUp className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Trends Analysis</span>}
          </button>
          
          <button 
            onClick={() => setSelectedReport('export')}
            className={`w-full ${sidebarCollapsed ? 'h-10' : 'h-10'} rounded-lg flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-3'} gap-3 transition-colors ${
              selectedReport === 'export' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Export Reports"
          >
            <Download className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Export Reports</span>}
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header with Menu Toggle */}
        <header className="bg-white border-b border-gray-200 py-3 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-semibold text-gray-800">
                QuickFix <span className="font-normal text-gray-500">| Analytics Dashboard</span>
              </h1>
              
              <div className="flex items-center gap-2 ml-8">
                <button 
                  onClick={() => setSelectedTimeRange('7d')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    selectedTimeRange === '7d' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  7 days
                </button>
                <button 
                  onClick={() => setSelectedTimeRange('30d')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    selectedTimeRange === '30d' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  30 days
                </button>
                <button 
                  onClick={() => setSelectedTimeRange('90d')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    selectedTimeRange === '90d' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  90 days
                </button>
                
                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="ml-4 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-50 flex items-center gap-2 border border-gray-200"
                  title="Refresh Overview"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="text-sm font-medium">Refresh Overview</span>
                </button>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Search Button */}
              <button 
                onClick={() => setShowSearchModal(true)}
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Search complaints"
              >
                <Search className="w-5 h-5" />
              </button>
              
              {/* Help Button */}
              <button 
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Help"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              
              {/* Notifications Button */}
              <button 
                className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              
              <div className="user-menu-container relative">
                <button 
                  className="flex items-center gap-3 hover:bg-gray-100 p-2 rounded-lg transition-colors"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {analystProfile.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{analystProfile.name}</p>
                    <p className="text-xs text-gray-500">{analystProfile.role}</p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <p className="font-semibold text-gray-900">{analystProfile.name}</p>
                      <p className="text-sm text-blue-600 truncate" title={analystProfile.email}>{analystProfile.email}</p>
                      <p className="text-sm text-gray-500 mt-1">Role: {analystProfile.role}</p>
                    </div>
                    <div className="p-2">
                      <button 
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-3"
                        onClick={() => {
                          setSelectedReport('profile');
                          setShowUserMenu(false);
                        }}
                      >
                        <Settings className="w-4 h-4 text-gray-500" />
                        Account Settings
                      </button>
                      <button 
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-3"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4 text-gray-500" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Dashboard Content will go here */}
        <div className="flex-1 overflow-auto p-6">
          {showNotifications && (
            <div className="absolute right-6 top-16 z-50">
              <Notifications />
            </div>
          )}
          
          {/* Dashboard content based on selected report */}
          <div>
            {selectedReport === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800">Analytics Overview</h2>
                <p className="text-gray-600">Data for the past {selectedTimeRange === '7d' ? '7 days' : selectedTimeRange === '30d' ? '30 days' : '90 days'}</p>
                
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <p className="text-sm text-gray-600 mb-2">Total Complaints</p>
                    <p className="text-3xl font-bold text-gray-800">{analyticsData.total}</p>
                    <div className="mt-2 text-sm text-green-600">+12% from previous period</div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <p className="text-sm text-gray-600 mb-2">Resolved Complaints</p>
                    <p className="text-3xl font-bold text-green-600">{analyticsData.resolved}</p>
                    <div className="mt-2 text-sm text-green-600">+5% from previous period</div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <p className="text-sm text-gray-600 mb-2">Avg. Resolution Time</p>
                    <p className="text-3xl font-bold text-yellow-600">{analyticsData.avgResolutionTime}</p>
                    <div className="mt-2 text-sm text-red-500">+0.2 days from previous period</div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <p className="text-sm text-gray-600 mb-2">Customer Satisfaction</p>
                    <p className="text-3xl font-bold text-orange-500">{analyticsData.satisfactionScore}/5</p>
                    <div className="mt-2 text-sm text-green-600">+0.1 from previous period</div>
                  </div>
                </div>
                
                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Status Distribution Chart */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Activity className="w-5 h-5 text-blue-500" />
                      Status Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Category Distribution Chart */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-green-500" />
                      Category Distribution
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Trend Analysis Chart */}
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-purple-500" />
                      7-Day Trend Analysis
                    </h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="created" stroke="#3B82F6" strokeWidth={2} name="Created" />
                        <Line type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={2} name="Resolved" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
            
            {selectedReport === 'sla' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800">SLA Compliance</h2>
                <p className="text-gray-600">Performance metrics for service level agreements</p>
                
                {/* SLA Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-500">SLA Compliance Rate</h3>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-800">87.5%</p>
                    <div className="mt-2 text-sm text-green-600">Target: 85%</div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-500">Breached SLAs</h3>
                      <Clock className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{Math.floor(analyticsData.total * 0.125)}</p>
                    <div className="mt-2 text-sm text-red-500">12.5% of total</div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-500">Avg. Response Time</h3>
                      <Activity className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-800">2.3h</p>
                    <div className="mt-2 text-sm text-green-600">Target: 4h</div>
                  </div>
                </div>
                
                {/* SLA Details Table */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">SLA Performance by Priority</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Actual Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Compliance</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Critical</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">4 hours</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3.2 hours</td>
                          <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">95%</span></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">High</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">24 hours</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">18.5 hours</td>
                          <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">91%</span></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Medium</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">48 hours</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">42.8 hours</td>
                          <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">88%</span></td>
                        </tr>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Low</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">72 hours</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">68.3 hours</td>
                          <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">82%</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {selectedReport === 'agents' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800">Agent Performance</h2>
                <p className="text-gray-600">Individual agent metrics and comparisons</p>
                
                {/* Agent Performance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-500">Active Agents</h3>
                      <Users className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-800">12</p>
                    <div className="mt-2 text-sm text-gray-500">3 on break</div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-500">Avg. Tickets/Agent</h3>
                      <Activity className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{Math.floor(analyticsData.total / 12)}</p>
                    <div className="mt-2 text-sm text-green-600">Balanced load</div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-500">Top Performer</h3>
                      <Star className="w-5 h-5 text-yellow-500" />
                    </div>
                    <p className="text-lg font-bold text-gray-800">Sarah Chen</p>
                    <div className="mt-2 text-sm text-green-600">98% satisfaction</div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-500">Team Efficiency</h3>
                      <TrendingUp className="w-5 h-5 text-purple-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-800">92%</p>
                    <div className="mt-2 text-sm text-green-600">+5% this month</div>
                  </div>
                </div>
                
                {/* Agent Leaderboard */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">Agent Leaderboard</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resolved</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Time</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Satisfaction</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {['Sarah Chen', 'Mike Johnson', 'Emily Davis', 'John Smith', 'Lisa Anderson'].map((name, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{idx + 1}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold mr-3">
                                  {name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <span className="text-sm font-medium text-gray-900">{name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{45 - idx * 5}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{2.1 + idx * 0.2}h</td>
                            <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">{98 - idx * 2}%</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
            
            {selectedReport === 'trends' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800">Trends Analysis</h2>
                <p className="text-gray-600">Long-term trends and patterns</p>
                
                {/* Trend Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-500">Peak Hours</h3>
                      <Clock className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">2-4 PM</p>
                    <div className="mt-2 text-sm text-gray-500">Highest ticket volume</div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-500">Busiest Day</h3>
                      <Activity className="w-5 h-5 text-purple-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">Monday</p>
                    <div className="mt-2 text-sm text-gray-500">35% of weekly tickets</div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-500">Growth Rate</h3>
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">+18%</p>
                    <div className="mt-2 text-sm text-green-600">Month over month</div>
                  </div>
                </div>
                
                {/* Trend Chart */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">30-Day Trend</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="created" stroke="#3B82F6" strokeWidth={3} name="Created Tickets" />
                      <Line type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={3} name="Resolved Tickets" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            
            {selectedReport === 'export' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-gray-800">Export Reports</h2>
                <p className="text-gray-600">Download analytics reports</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-800">Monthly Performance Report</h3>
                    <p className="text-sm text-gray-600 mt-2">Complete overview of system performance and metrics</p>
                    <button className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800">
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                  
                  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-800">Agent Efficiency Data</h3>
                    <p className="text-sm text-gray-600 mt-2">Detailed metrics on agent performance and resolution rates</p>
                    <button className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800">
                      <Download className="w-4 h-4" />
                      <span>Download CSV</span>
                    </button>
                  </div>
                  
                  <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <h3 className="font-semibold text-gray-800">Customer Satisfaction Report</h3>
                    <p className="text-sm text-gray-600 mt-2">Analysis of customer feedback and satisfaction scores</p>
                    <button className="mt-4 flex items-center gap-2 text-blue-600 hover:text-blue-800">
                      <Download className="w-4 h-4" />
                      <span>Download Excel</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Settings View */}
            {selectedReport === 'profile' && (
              <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-5xl mx-auto">
                  {/* Success/Error Messages */}
                  {saveSuccess && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-green-800">Settings saved successfully!</span>
                    </div>
                  )}
                  {saveError && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                      <span className="text-red-800">{saveError}</span>
                    </div>
                  )}

                  {/* Profile Header Card */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="p-6">
                      <div className="flex items-start gap-6">
                        <div className="relative group">
                          {profilePhoto ? (
                            <>
                              <img src={profilePhoto} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-slate-100" />
                              <button
                                onClick={handlePhotoRemove}
                                className="absolute top-0 left-0 w-8 h-8 bg-red-500 text-white border-2 border-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                title="Remove photo"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                              {analystProfile.name?.charAt(0).toUpperCase() || 'A'}
                            </div>
                          )}
                          <label htmlFor="photo-upload" className="absolute bottom-0 right-0 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 cursor-pointer transition-colors" title="Upload photo">
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </label>
                          <input
                            id="photo-upload"
                            type="file"
                            accept="image/jpeg,image/png,image/jpg,image/webp"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </div>
                        <div className="flex-1">
                          <h2 className="text-2xl font-semibold text-gray-900 mb-2">{analystProfile.name}</h2>
                          <p className="text-gray-600 mb-3">{analystProfile.email}</p>
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium capitalize">{analystProfile.role}</span>
                            <span className="text-sm text-gray-600 flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              Member since {new Date(analystProfile.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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
                              value={analystProfile.name.split(' ')[0] || ''}
                              onChange={(e) => setAnalystProfile({...analystProfile, name: e.target.value + ' ' + (analystProfile.name.split(' ')[1] || '')})}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              placeholder="Enter first name"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                            <input 
                              type="text" 
                              value={analystProfile.name.split(' ')[1] || ''}
                              onChange={(e) => setAnalystProfile({...analystProfile, name: (analystProfile.name.split(' ')[0] || '') + ' ' + e.target.value})}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              placeholder="Enter last name"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <input 
                              type="email" 
                              value={analystProfile.email}
                              onChange={(e) => setAnalystProfile({...analystProfile, email: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              placeholder="your.email@example.com"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <input 
                              type="tel" 
                              value={analystProfile.phone}
                              onChange={(e) => setAnalystProfile({...analystProfile, phone: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              placeholder="+1 (555) 000-0000"
                            />
                          </div>
                          
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                            <input 
                              type="text" 
                              value={analystProfile.department}
                              onChange={(e) => setAnalystProfile({...analystProfile, department: e.target.value})}
                              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                              placeholder="Your department"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Preferences & Security Settings - Combined */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                      <div className="p-5 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Preferences & Security</h3>
                        <p className="text-sm text-gray-600 mt-1">Manage notifications and account security</p>
                      </div>
                      <div className="p-6">
                        {/* Notification Toggles */}
                        <div className="mb-6">
                          <p className="text-sm font-medium text-gray-700 mb-3">Notification Channels</p>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg text-center">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                                <Bell className="w-5 h-5 text-blue-600" />
                              </div>
                              <p className="text-sm font-medium text-gray-900 mb-2">Email</p>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={settings.notifications.email}
                                  onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, email: e.target.checked}})}
                                  className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>

                            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg text-center">
                              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                                <MessageCircle className="w-5 h-5 text-purple-600" />
                              </div>
                              <p className="text-sm font-medium text-gray-900 mb-2">SMS</p>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={settings.notifications.sms}
                                  onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, sms: e.target.checked}})}
                                  className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>

                            <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg text-center">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                                <Bell className="w-5 h-5 text-green-600" />
                              </div>
                              <p className="text-sm font-medium text-gray-900 mb-2">Push</p>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={settings.notifications.push}
                                  onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, push: e.target.checked}})}
                                  className="sr-only peer" 
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Security Options */}
                        <div className="border-t border-gray-200 pt-5">
                          <p className="text-sm font-medium text-gray-700 mb-3">Security Options</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <button className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left">
                              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">Change Password</p>
                                <p className="text-xs text-gray-500">Update password</p>
                              </div>
                            </button>
                            
                            <button className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left">
                              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">Two-Factor Auth</p>
                                <p className="text-xs text-gray-500">Extra security</p>
                              </div>
                            </button>
                            
                            <button className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-left">
                              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">Active Sessions</p>
                                <p className="text-xs text-gray-500">Manage logins</p>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => setSelectedReport('overview')}
                        className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Changes
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[70vh] flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search complaints by ID, title, status, or category..."
                  className="flex-1 outline-none text-lg"
                  autoFocus
                />
                <button 
                  onClick={() => {
                    setShowSearchModal(false);
                    setSearchQuery('');
                  }}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {searchQuery.trim() ? (
                filteredBySearch.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {filteredBySearch.map((complaint) => (
                      <button
                        key={complaint.id}
                        onClick={() => handleSearchSelect(complaint)}
                        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-blue-600">
                            #{complaint.complaintId || complaint.id.slice(-8)}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            complaint.status === 'Resolved' || complaint.status === 'Closed' ? 'bg-green-100 text-green-700' :
                            complaint.status === 'In Progress' || complaint.status === 'Under Review' ? 'bg-blue-100 text-blue-700' :
                            complaint.status === 'Open' ? 'bg-yellow-100 text-yellow-700' :
                            complaint.status === 'Escalated' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {complaint.status}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 truncate">{complaint.title}</p>
                        <p className="text-sm text-gray-500 truncate">{complaint.description}</p>
                        {complaint.category && (
                          <span className="text-xs text-gray-400 mt-1 inline-block">{complaint.category}</span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No complaints found matching "{searchQuery}"</p>
                  </div>
                )
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Start typing to search complaints...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}