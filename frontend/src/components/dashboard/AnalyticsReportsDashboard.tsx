import { useState, useEffect } from 'react';
import { 
  TrendingUp, Download, Settings, 
  Clock, Users, Shield, Home,
  Bell, HelpCircle, 
  ChevronDown, LogOut, BarChart3,
  Activity, FileText, CheckCircle, Star
} from 'lucide-react';
import { useComplaints } from '../../contexts/ComplaintContext';
import { useAuth } from '../../hooks/useAuth';
import { Notifications } from '../notifications/Notifications';
import { 
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export function AnalyticsReportsDashboard() {
  const { complaints } = useComplaints();
  const { user, logout } = useAuth();
  
  // State management
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedReport, setSelectedReport] = useState<'overview' | 'sla' | 'agents' | 'trends' | 'export'>('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Analyst profile data
  const analystProfile = {
    name: user?.name || 'Analyst',
    email: user?.email || 'analyst@example.com',
    phone: '+1 (555) 456-7890',
    department: 'Analytics',
    role: user?.role || 'analyst',
    joinDate: '2023-11-10',
    lastLogin: new Date().toLocaleString()
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
  
  // Calculate analytics data
  const analyticsData = {
    total: complaints.length,
    resolved: complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length,
    pending: complaints.filter(c => c.status === 'Open' || c.status === 'In Progress').length,
    escalated: complaints.filter(c => c.status === 'Escalated').length,
    avgResolutionTime: '3.4 days',
    satisfactionScore: 4.6
  };

  // Chart data
  const statusData = [
    { name: 'Open', value: complaints.filter(c => c.status === 'Open').length, color: '#3B82F6' },
    { name: 'In Progress', value: complaints.filter(c => c.status === 'In Progress').length, color: '#F59E0B' },
    { name: 'Resolved', value: complaints.filter(c => c.status === 'Resolved').length, color: '#10B981' },
    { name: 'Escalated', value: complaints.filter(c => c.status === 'Escalated').length, color: '#EF4444' }
  ].filter(item => item.value > 0);

  const categoryData = [
    { category: 'Technical', count: complaints.filter(c => c.category?.includes('Technical')).length },
    { category: 'Billing', count: complaints.filter(c => c.category?.includes('Billing')).length },
    { category: 'Service', count: complaints.filter(c => c.category?.includes('Service')).length },
    { category: 'Product', count: complaints.filter(c => c.category?.includes('Product')).length },
    { category: 'Other', count: complaints.filter(c => !['Technical', 'Billing', 'Service', 'Product'].some(cat => c.category?.includes(cat))).length }
  ].filter(item => item.count > 0);

  const getTrendData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const created = complaints.filter(c => {
        const complaintDate = new Date(c.createdAt);
        return complaintDate.toDateString() === date.toDateString();
      }).length;

      const resolved = complaints.filter(c => {
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
      {/* Freshdesk-style Clean Sidebar */}
      <div className="bg-slate-800 w-16 flex flex-col items-center py-4 space-y-4">
        <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5 text-white" />
        </div>
        
        <div className="space-y-2">
          <button 
            onClick={() => setSelectedReport('overview')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              selectedReport === 'overview' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Overview"
          >
            <Home className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setSelectedReport('sla')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              selectedReport === 'sla' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="SLA Compliance"
          >
            <Clock className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setSelectedReport('agents')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              selectedReport === 'agents' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Agent Performance"
          >
            <Users className="w-5 h-5" />
          </button>
          
          <button 
            onClick={() => setSelectedReport('trends')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              selectedReport === 'trends' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Trends Analysis"
          >
            <TrendingUp className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mt-auto space-y-2">
          <button 
            onClick={() => setSelectedReport('export')}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              selectedReport === 'export' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Export Reports"
          >
            <Download className="w-5 h-5" />
          </button>
          
          <button 
            className="w-10 h-10 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Freshdesk-style Header */}
        <header className="bg-white border-b border-gray-200 py-3 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
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
              </div>
            </div>
            
            <div className="flex items-center gap-3">
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
                  className="flex items-center gap-2 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold">
                    {analystProfile.name.charAt(0)}
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 top-full mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <p className="font-medium text-gray-800">{analystProfile.name}</p>
                      <p className="text-sm text-gray-500">{analystProfile.email}</p>
                      <p className="text-xs mt-1 text-gray-500">Role: {analystProfile.role}</p>
                    </div>
                    <div className="p-2">
                      <button 
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 rounded-md transition-colors text-left"
                      >
                        <Settings className="w-4 h-4 text-gray-500" />
                        <span>Account Settings</span>
                      </button>
                      <button 
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-100 rounded-md transition-colors text-left"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4 text-gray-500" />
                        <span>Sign Out</span>
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
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-500">Total Complaints</h3>
                      <FileText className="w-5 h-5 text-blue-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{analyticsData.total}</p>
                    <div className="mt-2 text-sm text-green-600">+12% from previous period</div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-500">Resolved Complaints</h3>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{analyticsData.resolved}</p>
                    <div className="mt-2 text-sm text-green-600">+5% from previous period</div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-500">Avg. Resolution Time</h3>
                      <Clock className="w-5 h-5 text-orange-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{analyticsData.avgResolutionTime}</p>
                    <div className="mt-2 text-sm text-red-500">+0.2 days from previous period</div>
                  </div>
                  
                  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-500">Customer Satisfaction</h3>
                      <Star className="w-5 h-5 text-yellow-500" />
                    </div>
                    <p className="text-3xl font-bold text-gray-800">{analyticsData.satisfactionScore}/5</p>
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
                        <Bar dataKey="count" fill="#10B981" radius={[8, 8, 0, 0]} />
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
          </div>
        </div>
      </div>
    </div>
  );
}