import { useState, useEffect, useMemo } from 'react';
// i18n removed
// Trans and t removed after migration
import { 
  Clock, CheckCircle, Bell, User, MessageCircle, 
  Search, Calendar, X, Shield, Home, 
  Inbox, HelpCircle, Menu, Download,
  Bot, Star, AlertCircle, Eye, LogOut, Settings, ChevronDown,
  Activity, UserCheck, UserX, RefreshCw
} from 'lucide-react';
import { agentService } from '../../services/agentService';
import { NotificationCenter } from '../notifications/NotificationCenter';
import AIAssistant from './AIAssistant';
import { useAuth } from '../../hooks/useAuth';
import { useComplaints, Complaint } from '../../contexts/ComplaintContext';
import { useSocket } from '../../hooks/useSocket';
import { 
  getStatusColor,
  getPriorityColor,
  getMessageSendButtonClasses,
  getProgressBarStyle
} from '../../utils/agentDashboardUtils';

export function AgentDashboard() {
  const { user, logout } = useAuth();
  const { complaints, loading: complaintsContextLoading, refreshComplaints } = useComplaints();
  const { isConnected, socket, joinComplaintRoom, updateComplaint, sendMessage } = useSocket();
  const [activeView, setActiveView] = useState('my-tickets');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Use loading state from context
  const complaintsLoading = complaintsContextLoading;
  const [filteredComplaints, setFilteredComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showChatBot, setShowChatBot] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  // Refreshing state for manual refresh
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedComplaintForMessage, setSelectedComplaintForMessage] = useState<Complaint | null>(null);
  
  // Handle manual refresh of complaints
  const handleRefreshComplaints = async () => {
    setIsRefreshing(true);
    try {
      await refreshComplaints();
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // We'll implement filtering directly in the component for now
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  // Simple filtering based on search query
  const filteredTickets = useMemo(() => {
    if (!searchQuery.trim()) return filteredComplaints;
    
    const query = searchQuery.toLowerCase().trim();
    return filteredComplaints.filter(complaint => 
      complaint.title.toLowerCase().includes(query) ||
      complaint.description.toLowerCase().includes(query) ||
      complaint.id.toLowerCase().includes(query) ||
      (complaint.category && complaint.category.toLowerCase().includes(query))
    );
  }, [filteredComplaints, searchQuery]);

  // Handle search result selection
  const handleSearchSelect = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setShowSearchModal(false);
    setSearchQuery('');
    setActiveView('my-tickets');
  };

  const [agentProfile, setAgentProfile] = useState({
    name: user?.name || 'Agent',
    email: user?.email || 'agent@example.com',
    phone: '+1 (555) 123-4567',
    department: 'Support',
    role: user?.role || 'agent',
    joinDate: '2024-01-15',
    availability: 'available'
  });
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: false,
      push: true
    }
  });

  // Update agent profile when user changes
  useEffect(() => {
    if (user) {
      setAgentProfile(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
        role: user.role,
      }));
    }
  }, [user]);

  // Debug socket connection status
  useEffect(() => {
    console.log('Socket connection status:', isConnected);
    console.log('Socket instance:', socket ? 'exists' : 'null');
    
    // Monitor connection status but don't try to reconnect here
    // Let the SocketContext handle reconnection
  }, [isConnected, socket]);

  // Listen for real-time complaint assignment events
  useEffect(() => {
    const handleComplaintAssigned = (event: CustomEvent) => {
      const data = event.detail;
      console.log('🎯 New complaint assigned to me:', data);
      
      // Show a prominent notification to the agent
      if (data.complaint && user && (data.agentId === user.id || data.agentId === user._id)) {
        // Create a visual alert with detailed info
        const aiInfo = data.aiAssignment 
          ? `\n\n🤖 AI Assignment Details:\n• Confidence: ${Math.round((data.aiAssignment.confidence || 0) * 100)}%\n• Reasoning: ${data.aiAssignment.reasoning || 'N/A'}\n• Est. Response Time: ${data.aiAssignment.estimatedResponseTime || 'N/A'}`
          : '';
        
        alert(`✅ New Complaint Assigned!\n\nComplaint ID: ${data.complaint.complaintId || data.complaint._id}\nTitle: ${data.complaint.title}\nCategory: ${data.complaint.category}\nPriority: ${data.complaint.priority}${aiInfo}`);
        
        // Refresh the complaints list to show the new assignment (without full page reload)
        refreshComplaints();
      }
    };

    window.addEventListener('complaintAssigned', handleComplaintAssigned as EventListener);
    
    return () => {
      window.removeEventListener('complaintAssigned', handleComplaintAssigned as EventListener);
    };
  }, [user, refreshComplaints]);

  // Update filtered complaints to show ONLY tickets assigned to this specific agent
  useEffect(() => {
    if (complaints && user) {
      // Filter complaints to show only tickets assigned to this specific agent
      // Match by agent ID, _id, name, or email - DO NOT show unassigned complaints
      const assignedComplaints = complaints.filter(c => {
        const assigned = c.assignedTo;
        
        // Skip if not assigned to anyone
        if (!assigned || assigned === '' || assigned === 'Unassigned') {
          return false;
        }
        
        // Check if assigned to current agent by ID, _id, name, or email
        // Compare case-insensitively for email matching
        const agentEmail = user.email?.toLowerCase();
        const complaintAgentEmail = c.assignedAgentEmail?.toLowerCase();
        
        const isMine = assigned === user.id || 
                       assigned === user._id || 
                       assigned === user.name ||
                       c.assignedAgentName === user.name ||
                       (agentEmail && complaintAgentEmail && complaintAgentEmail === agentEmail);
        
        console.log(`Complaint ${c.complaintId || c.id}: assigned=${assigned}, agentEmail=${complaintAgentEmail}, userEmail=${agentEmail}, isMine=${isMine}`);
        
        return isMine;
      });
      
      console.log('🎯 Agent Dashboard - Filtering complaints for agent:', {
        agentId: user.id,
        agentName: user.name,
        agentEmail: user.email,
        totalComplaints: complaints.length,
        assignedToMe: assignedComplaints.length,
        complaintDetails: complaints.map(c => ({
          id: c.complaintId || c.id,
          assignedTo: c.assignedTo,
          assignedAgentEmail: c.assignedAgentEmail,
          assignedAgentName: c.assignedAgentName
        }))
      });
      
      setFilteredComplaints(assignedComplaints);
      
      // Join socket rooms for all assigned complaints to receive real-time updates
      if (isConnected) {
        assignedComplaints.forEach(complaint => {
          joinComplaintRoom(complaint.id);
          console.log(`Joined complaint room: ${complaint.id}`);
        });
      }
      
      // Refresh agent availability status based on active tickets
      const refreshAvailability = async () => {
        try {
          if (user?.id) {
            const result = await agentService.refreshAvailability(user.id);
            const availability = result?.data?.availability;
            if (typeof availability === 'string') {
              setAgentProfile(prev => ({
                ...prev,
                availability
              }));
            }
          }
        } catch (error) {
          console.error('Error refreshing agent availability:', error);
        }
      };
      
      refreshAvailability();
    }
  }, [complaints, user, isConnected, joinComplaintRoom]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };
  
  const handleSendMessage = () => {
    if (selectedComplaintForMessage && messageText.trim()) {
      // Join the complaint room if not already joined
      joinComplaintRoom(selectedComplaintForMessage.id);
      
      // Send the message via socket
      sendMessage(selectedComplaintForMessage.id, messageText);
      
      // Clear the input and close the modal
      setMessageText('');
      setShowMessageModal(false);
      
      // Show success notification
      alert('Message sent successfully');
    }
  };
  
  const openMessageModal = (complaint: Complaint) => {
    setSelectedComplaintForMessage(complaint);
    setShowMessageModal(true);
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

  const handleStatusUpdate = async (complaintId: string, newStatus: 'Open' | 'In Progress' | 'Under Review' | 'Resolved' | 'Closed') => {
    try {
      // Use socket to update complaint status in real-time
      if (socket && isConnected) {
        // First join the complaint room if not already joined
        joinComplaintRoom(complaintId);
        
        // Then send the update via socket
        updateComplaint(complaintId, { status: newStatus }, `Status updated to ${newStatus} by ${user?.name}`);
      } else {
        console.warn('Cannot update status: Socket not connected');
        // Fallback to API call if socket is not connected
        // await api.updateComplaint(complaintId, { status: newStatus });
      }
      
      setFilteredComplaints(prev => 
        prev.map(c => c.id === complaintId ? { ...c, status: newStatus } : c)
      );
      if (selectedComplaint?.id === complaintId) {
        setSelectedComplaint({ ...selectedComplaint, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Function to update agent availability
  const updateAvailability = async (status: 'available' | 'busy' | 'offline') => {
    if (!user?.id) return;
    
    try {
      const result = await agentService.updateAvailability(user.id, status);
      
      const availability = result?.data?.availability;
      if (typeof availability === 'string') {
        setAgentProfile(prev => ({
          ...prev,
          availability
        }));

        // Inform the user of the status change
        alert(`Your availability status has been updated to ${status}`);
      } else if (result && result.error) {
        console.error('Error updating availability:', result.error);
        alert(`Failed to update availability: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating agent availability:', error);
      alert('An unexpected error occurred while updating your availability');
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Title', 'Category', 'Priority', 'Status', 'Created', 'User'];
    const rows = filteredComplaints.map(c => [
      c.id,
      c.title,
      c.category,
      c.priority,
      c.status,
      new Date(c.createdAt).toLocaleDateString(),
      c.userId
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agent_complaints_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Calculate statistics from real data
  const stats = {
    total: filteredComplaints.length,
    pending: filteredComplaints.filter(c => c.status === 'Open').length,
    inProgress: filteredComplaints.filter(c => c.status === 'In Progress' || c.status === 'Under Review').length,
    resolved: filteredComplaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length,
    urgent: filteredComplaints.filter(c => c.priority === 'High' || c.priority === 'Urgent').length,
    thisWeek: filteredComplaints.filter(c => {
      const createdDate = new Date(c.createdAt);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdDate >= weekAgo;
    }).length,
    avgResponseTime: '2.5h'
  };

  // Using imported helper functions for consistent styling

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Freshdesk-style Clean Sidebar */}
      <div className={`bg-slate-800 ${sidebarCollapsed ? 'w-16' : 'w-64'} flex flex-col py-4 transition-all duration-300 ease-in-out`}>
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
        
        <div className={`space-y-2 ${sidebarCollapsed ? 'px-3' : 'px-4'}`}>
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`w-full ${sidebarCollapsed ? 'h-10' : 'h-10'} rounded-lg flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-3'} gap-3 transition-colors ${
              activeView === 'dashboard' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Dashboard"
          >
            <Home className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Dashboard</span>}
          </button>
          
          <button 
            onClick={() => setActiveView('my-tickets')}
            className={`w-full ${sidebarCollapsed ? 'h-10' : 'h-10'} rounded-lg flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-3'} gap-3 transition-colors ${
              activeView === 'my-tickets' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="My Tickets"
          >
            <Inbox className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">My Tickets</span>}
          </button>
          
          <button 
            onClick={() => setActiveView('performance')}
            className={`w-full ${sidebarCollapsed ? 'h-10' : 'h-10'} rounded-lg flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-3'} gap-3 transition-colors ${
              activeView === 'performance' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Performance"
          >
            <Star className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Performance</span>}
          </button>
          
          <button 
            onClick={() => setActiveView('profile')}
            className={`w-full ${sidebarCollapsed ? 'h-10' : 'h-10'} rounded-lg flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-3'} gap-3 transition-colors ${
              activeView === 'profile' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Profile"
          >
            <User className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Profile</span>}
          </button>
          
          <button 
            onClick={() => setShowNotifications(true)}
            className={`w-full ${sidebarCollapsed ? 'h-10' : 'h-10'} rounded-lg flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-3'} gap-3 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors`}
            title="Notifications"
          >
            <Bell className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Notifications</span>}
          </button>
          
          <button 
            onClick={() => setShowChatBot(true)}
            className={`w-full ${sidebarCollapsed ? 'h-10' : 'h-10'} rounded-lg flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-3'} gap-3 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors`}
            title="AI Assistant"
          >
            <Bot className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">AI Assistant</span>}
          </button>
          
          <button 
            className={`w-full ${sidebarCollapsed ? 'h-10' : 'h-10'} rounded-lg flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-3'} gap-3 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors`}
            title="Help & Support"
          >
            <HelpCircle className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Help</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Freshdesk-style Clean Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <Menu className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">
              {activeView === 'dashboard' && 'Agent Dashboard'}
              {activeView === 'my-tickets' && 'My Tickets'}
              {activeView === 'performance' && 'Performance Metrics'}
              {activeView === 'profile' && 'Profile Management'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Refresh Button */}
            <button
              onClick={() => window.location.reload()}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh Dashboard"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            
            {/* Agent Availability Controls */}
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                <button 
                  onClick={() => updateAvailability('available')}
                  className={`px-2 py-1 rounded flex items-center gap-1 ${agentProfile.availability === 'available' ? 'bg-green-500 text-white' : 'hover:bg-gray-200'}`}
                  title="Set as Available"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Available</span>
                </button>

                <button 
                  onClick={() => updateAvailability('busy')}
                  className={`px-2 py-1 rounded flex items-center gap-1 ${agentProfile.availability === 'busy' ? 'bg-orange-500 text-white' : 'hover:bg-gray-200'}`}
                  title="Set as Busy"
                >
                  <Activity className="w-4 h-4" />
                  <span>Busy</span>
                </button>

                <button 
                  onClick={() => updateAvailability('offline')}
                  className={`px-2 py-1 rounded flex items-center gap-1 ${agentProfile.availability === 'offline' ? 'bg-gray-400 text-white' : 'hover:bg-gray-200'}`}
                  title="Set as Offline"
                >
                  <UserX className="w-4 h-4" />
                  <span>Offline</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefreshComplaints}
                  disabled={isRefreshing}
                  className="bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-200 flex items-center gap-1.5 disabled:opacity-50 text-sm font-medium"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh Tickets'}
                </button>
              </div>
            </div>
            
            {activeView === 'my-tickets' && (
              <button
                onClick={exportToCSV}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
            
            <button 
              onClick={() => setShowSearchModal(true)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
              title="Search tickets"
            >
              <Search className="w-5 h-5" />
            </button>
            
            <button 
              onClick={() => setShowNotifications(true)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg relative"
            >
              <Bell className="w-5 h-5" />
              {stats.pending > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {stats.pending}
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
                  {agentProfile.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{agentProfile.name}</p>
                  <p className="text-xs text-gray-500">{agentProfile.role}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">{agentProfile.name}</p>
                    <p className="text-sm text-blue-600 truncate" title={agentProfile.email}>{agentProfile.email}</p>
                    <p className="text-sm text-gray-500 mt-1">Role: {agentProfile.role}</p>
                  </div>
                  <div className="p-2">
                    <button 
                      onClick={() => {
                        setActiveView('profile');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-3"
                    >
                      <Settings className="w-4 h-4 text-gray-500" />
                      Account Settings
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md flex items-center gap-3"
                    >
                      <LogOut className="w-4 h-4 text-gray-500" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard View - Core Complaint Features */}
        {activeView === 'dashboard' && (
          <div className="p-6 bg-gray-50 min-h-screen">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Total Complaints</h3>
                <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Open</h3>
                <div className="text-3xl font-bold text-blue-600">{stats.pending}</div>
                <p className="text-xs text-gray-500 mt-1">Needs attention</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">In Progress</h3>
                <div className="text-3xl font-bold text-yellow-600">{stats.inProgress}</div>
                <p className="text-xs text-gray-500 mt-1">Being processed</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Resolved</h3>
                <div className="text-3xl font-bold text-green-600">{stats.resolved}</div>
                <p className="text-xs text-gray-500 mt-1">Completed</p>
              </div>
              
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Urgent</h3>
                <div className="text-3xl font-bold text-orange-600">{stats.urgent}</div>
                <p className="text-xs text-gray-500 mt-1">High priority</p>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Complaints */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Assigned Tickets</h3>
                  <button 
                    onClick={() => setActiveView('my-tickets')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View all
                  </button>
                </div>
                <div className="p-6">
                  {complaintsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Loading tickets...</p>
                    </div>
                  ) : filteredComplaints.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Inbox className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No tickets assigned to you</p>
                      <p className="text-sm">When AI assigns tickets to your account ({user?.email}), they will appear here</p>
                      <button 
                        onClick={handleRefreshComplaints}
                        disabled={isRefreshing}
                        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                      >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Checking...' : 'Check for New Tickets'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredComplaints.slice(0, 3).map((complaint) => (
                        <div key={complaint.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSelectedComplaint(complaint)}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              {/* Complaint ID */}
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 text-xs font-mono font-semibold bg-gray-100 text-gray-700 rounded border border-gray-300">
                                  {complaint.complaintId || complaint.id}
                                </span>
                                {complaint.aiAssignment && (
                                  <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded flex items-center gap-1">
                                    <Bot className="w-3 h-3" />
                                    AI Assigned
                                  </span>
                                )}
                              </div>
                              <h4 className="font-medium text-gray-900 text-sm mb-1">{complaint.title}</h4>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{complaint.description}</p>
                              {/* AI Assignment reasoning (if available) */}
                              {complaint.aiAssignment?.reasoning && (
                                <p className="text-xs text-blue-600 mb-2 italic">
                                  💡 {complaint.aiAssignment.reasoning}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(complaint.createdAt).toLocaleDateString()}
                                </span>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(complaint.priority)}`}>
                                  {complaint.priority}
                                </span>
                              </div>
                            </div>
                            <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(complaint.status)}`}>
                              {complaint.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <button 
                      onClick={() => setActiveView('performance')}
                      className="w-full flex items-center gap-3 p-4 text-left border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Star className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">View Performance</h4>
                        <p className="text-sm text-gray-600">See your metrics and statistics</p>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => setActiveView('my-tickets')}
                      className="w-full flex items-center gap-3 p-4 text-left border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-200 transition-colors"
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Inbox className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">View My Complaints</h4>
                        <p className="text-sm text-gray-600">Track status and updates</p>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => setActiveView('profile')}
                      className="w-full flex items-center gap-3 p-4 text-left border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-colors"
                    >
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">Update Profile</h4>
                        <p className="text-sm text-gray-600">Manage your account details</p>
                      </div>
                    </button>
                    
                    <button 
                      onClick={() => setShowChatBot(true)}
                      className="w-full flex items-center gap-3 p-4 text-left border border-gray-200 rounded-lg hover:bg-yellow-50 hover:border-yellow-200 transition-colors"
                    >
                      <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <Bot className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">AI Assistant</h4>
                        <p className="text-sm text-gray-600">Get instant help and guidance</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Tracking Overview */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Ticket Status Overview</h3>
                <p className="text-sm text-gray-600 mt-1">Track the progress of your assigned tickets</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-blue-900">Open</p>
                      <p className="text-sm text-blue-700">New complaints</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-yellow-900">In Progress</p>
                      <p className="text-sm text-yellow-700">Under review</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 border border-green-200 rounded-lg bg-green-50">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="font-medium text-green-900">Resolved</p>
                      <p className="text-sm text-green-700">Successfully completed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complaints List View */}
        {activeView === 'my-tickets' && (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Agent Dashboard</h3>
                  <p className="text-sm text-gray-600">Manage all tickets assigned to you</p>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={exportToCSV}
                    className="border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                  <button 
                    onClick={() => setActiveView('performance')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <Star className="w-4 h-4" />
                    View Performance
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {/* Simple Search */}
                <div className="mb-6">
                  <div className="relative flex-1 max-w-md">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="w-4 h-4 text-gray-400" />
                    </div>
                    <input
                      type="search"
                      className="w-full py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Search complaints..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                {complaintsLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-4">Loading your assigned tickets...</p>
                  </div>
                ) : filteredTickets.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Inbox className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-xl font-medium mb-2">No tickets found</p>
                    <p className="text-sm mb-2">
                      {filteredComplaints.length === 0
                        ? `No tickets have been assigned to your account (${user?.email}) yet`
                        : "No tickets match your search"}
                    </p>
                    {filteredComplaints.length === 0 && (
                      <p className="text-xs text-gray-400 mb-6">
                        When AI assigns complaints to you, they will appear here automatically
                      </p>
                    )}
                    {filteredComplaints.length === 0 ? (
                      <button 
                        onClick={handleRefreshComplaints}
                        disabled={isRefreshing}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center gap-2 mx-auto"
                      >
                        <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Checking...' : 'Check for New Tickets'}
                      </button>
                    ) : (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                      >
                        Clear Search
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredTickets.map((complaint) => (
                      <div key={complaint.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start justify-between">
                          <div 
                            className="flex-1 cursor-pointer" 
                            onClick={() => setSelectedComplaint(complaint)}
                          >
                            <div className="flex items-center gap-3 mb-2">
                              {/* Complaint ID Badge */}
                              <span className="px-2 py-1 text-xs font-mono font-semibold bg-gray-100 text-gray-700 rounded border border-gray-300">
                                {complaint.complaintId || complaint.id}
                              </span>
                              <h4 className="font-semibold text-gray-900">{complaint.title}</h4>
                              <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(complaint.status)}`}>
                                {complaint.status}
                              </span>
                            </div>
                            <p className="text-gray-600 mb-3 line-clamp-2">{complaint.description}</p>
                            
                            {/* AI Assignment Info Banner */}
                            {complaint.aiAssignment && (
                              <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-2">
                                  <Bot className="w-4 h-4 text-blue-600 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-800">
                                      🤖 AI Assigned
                                      {complaint.aiAssignment.confidence && (
                                        <span className="ml-2 text-xs font-normal text-blue-600">
                                          (Confidence: {Math.round(complaint.aiAssignment.confidence * 100)}%)
                                        </span>
                                      )}
                                    </p>
                                    {complaint.aiAssignment.reasoning && (
                                      <p className="text-xs text-blue-700 mt-1">{complaint.aiAssignment.reasoning}</p>
                                    )}
                                    {complaint.aiAssignment.estimatedResponseTime && (
                                      <p className="text-xs text-blue-600 mt-1">
                                        ⏱️ Est. Response: {complaint.aiAssignment.estimatedResponseTime}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Assignment Info if assigned but no AI info */}
                            {!complaint.aiAssignment && complaint.assignedAgentName && (
                              <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-xs text-green-700">
                                  <span className="font-medium">Assigned to:</span> {complaint.assignedAgentName}
                                  {complaint.assignedAgentEmail && ` (${complaint.assignedAgentEmail})`}
                                </p>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-6 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(complaint.createdAt).toLocaleDateString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="w-4 h-4" />
                                {complaint.category}
                              </span>
                              <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                                <AlertCircle className="w-3 h-3" />
                                {complaint.priority} Priority
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedComplaint(complaint);
                              }}
                              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              View Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openMessageModal(complaint);
                              }}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              <MessageCircle className="w-4 h-4" />
                              Message
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Performance Metrics View */}
        {activeView === 'performance' && (
          <div className="p-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
                    <p className="text-sm text-gray-600">Track your productivity and service quality</p>
                  </div>
                  <button 
                    onClick={() => setActiveView('my-tickets')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500 mb-1">Average Response Time</p>
                    <p className="text-2xl font-bold text-blue-600">2.5 hours</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500 mb-1">Resolution Rate</p>
                    <p className="text-2xl font-bold text-green-600">85%</p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500 mb-1">Customer Satisfaction</p>
                    <p className="text-2xl font-bold text-amber-600">4.7/5</p>
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Tickets Resolved This Week</span>
                      <span className="text-sm font-bold text-green-600">12</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-green-600 h-2 rounded-full" style={getProgressBarStyle(75)}></div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">Average Handle Time</span>
                      <span className="text-sm font-bold text-blue-600">3.2 hours</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={getProgressBarStyle(60)}></div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">First Contact Resolution</span>
                      <span className="text-sm font-bold text-purple-600">72%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={getProgressBarStyle(72)}></div>
                    </div>
                  </div>
                </div>
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
                    <div className="relative group">
                      <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                        {agentProfile.name?.charAt(0).toUpperCase() || 'A'}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">{agentProfile.name}</h2>
                      <p className="text-gray-600 mb-3">{agentProfile.email}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">{agentProfile.role}</span>
                        <span className="bg-slate-100 text-slate-800 px-3 py-1 rounded-full text-sm font-medium">{agentProfile.department}</span>
                        <span className="text-sm text-gray-600 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          Member since {new Date(agentProfile.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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
                          value={agentProfile.name.split(' ')[0] || ''}
                          onChange={(e) => setAgentProfile({...agentProfile, name: e.target.value + ' ' + (agentProfile.name.split(' ')[1] || '')})}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                          placeholder="Enter first name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <input 
                          type="text" 
                          value={agentProfile.name.split(' ')[1] || ''}
                          onChange={(e) => setAgentProfile({...agentProfile, name: (agentProfile.name.split(' ')[0] || '') + ' ' + e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                          placeholder="Enter last name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <input 
                          type="email" 
                          value={agentProfile.email}
                          onChange={(e) => setAgentProfile({...agentProfile, email: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                          placeholder="your.email@example.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input 
                          type="tel" 
                          value={agentProfile.phone}
                          onChange={(e) => setAgentProfile({...agentProfile, phone: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                        <input 
                          type="text" 
                          value={agentProfile.department}
                          onChange={(e) => setAgentProfile({...agentProfile, department: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                          placeholder="Your department"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Availability Status</label>
                        <select
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                          value={agentProfile.availability}
                          onChange={(e) => setAgentProfile({...agentProfile, availability: e.target.value})}
                        >
                          <option value="available">Available</option>
                          <option value="busy">Busy</option>
                          <option value="offline">Offline</option>
                        </select>
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
                            <p className="text-sm text-gray-600">Receive email updates for ticket assignments and status changes</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={settings.notifications.email}
                            onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, email: e.target.checked}})}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <MessageCircle className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">SMS Notifications</p>
                            <p className="text-sm text-gray-600">Get text messages for urgent ticket updates</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={settings.notifications.sms}
                            onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, sms: e.target.checked}})}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Bell className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">Push Notifications</p>
                            <p className="text-sm text-gray-600">Receive in-app notifications for new ticket assignments</p>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={settings.notifications.push}
                            onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, push: e.target.checked}})}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Changes Button */}
                <div className="flex justify-end gap-4">
                  <button 
                    onClick={() => setActiveView('my-tickets')}
                    className="bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complaint Details Modal */}
        {selectedComplaint && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full m-4 max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Complaint Details</h3>
                  <button 
                    onClick={() => setSelectedComplaint(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {/* Header with Status and Priority */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">{selectedComplaint.title}</h4>
                      <div className="flex items-center gap-4 mb-4">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(selectedComplaint.status)}`}>
                          {selectedComplaint.status}
                        </span>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(selectedComplaint.priority)}`}>
                          {selectedComplaint.priority} Priority
                        </span>
                        <span className="text-sm text-gray-500">
                          Filed on {new Date(selectedComplaint.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {selectedComplaint.status === 'Resolved' && (
                      <button 
                        onClick={() => {
                          setSelectedComplaint(null);
                          setShowFeedbackForm(true);
                        }}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Star className="w-4 h-4" />
                        Give Feedback
                      </button>
                    )}
                  </div>

                  {/* Description */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-2">Description</h5>
                    <p className="text-gray-700">{selectedComplaint.description}</p>
                  </div>

                  {/* Timeline/Updates Section */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-4">Timeline & Updates</h5>
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">Complaint Submitted</p>
                          <p className="text-sm text-gray-600">Your complaint has been received and assigned ID #{selectedComplaint.id}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(selectedComplaint.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      
                      {selectedComplaint.status !== 'Open' && (
                        <div className="flex gap-4">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Eye className="w-4 h-4 text-yellow-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Under Review</p>
                            <p className="text-sm text-gray-600">Your complaint is being reviewed by our support team</p>
                            <p className="text-xs text-gray-500 mt-1">Updated recently</p>
                          </div>
                        </div>
                      )}
                      
                      {selectedComplaint.status === 'Resolved' && (
                        <div className="flex gap-4">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Complaint Resolved</p>
                            <p className="text-sm text-gray-600">Your complaint has been successfully resolved</p>
                            <p className="text-xs text-gray-500 mt-1">Resolved recently</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Agent Actions Section */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-4">Agent Actions</h5>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {selectedComplaint.status === 'Resolved' || selectedComplaint.status === 'Closed' ? (
                        <div className="text-green-600 font-medium flex items-center gap-2">
                          <CheckCircle className="w-5 h-5" />
                          This complaint has been resolved. You are now available for new assignments.
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {selectedComplaint.status !== 'In Progress' && (
                            <button 
                              onClick={() => handleStatusUpdate(selectedComplaint.id, 'In Progress')}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
                            >
                              <Clock className="w-4 h-4" />
                              Mark In Progress
                            </button>
                          )}
                          
                          <button 
                            onClick={() => handleStatusUpdate(selectedComplaint.id, 'Resolved')}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark Resolved
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Communication Section */}
                  <div>
                    <h5 className="font-medium text-gray-900 mb-4">Customer Communication</h5>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Send updates to the customer</span>
                      </div>
                      <textarea
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-3"
                        placeholder="Type your message here..."
                        rows={3}
                      ></textarea>
                      <button 
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
                      >
                        Send Message
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
          <AIAssistant onClose={() => setShowChatBot(false)} />
        )}

        {/* Notifications Modal */}
        <NotificationCenter
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />

        {/* Feedback Form Modal */}
        {showFeedbackForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
              <div className="p-6 border-b border-gray-200">
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
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} className="text-yellow-400 hover:text-yellow-500">
                          ⭐
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                    <textarea 
                      className="w-full border border-gray-300 rounded-lg p-3 h-24"
                      placeholder="Share your feedback..."
                    />
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowFeedbackForm(false)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Submit
                    </button>
                    <button 
                      onClick={() => setShowFeedbackForm(false)}
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
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

      {/* Direct Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Send Message to User</h3>
                <button 
                  onClick={() => setShowMessageModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {selectedComplaintForMessage && (
                  <div className="mb-4">
                    <p className="font-medium text-gray-700">Complaint: {selectedComplaintForMessage.title}</p>
                    <p className="text-sm text-gray-500">
                      ID: {selectedComplaintForMessage.id} • Status: {selectedComplaintForMessage.status}
                    </p>
                  </div>
                )}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Type your message to the user here..."
                  />
                </div>
                
                <div className="flex justify-between pt-4">
                  <div className="text-sm text-gray-500">
                    {isConnected ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        Disconnected (Cannot send messages)
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setShowMessageModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSendMessage}
                      disabled={!isConnected || !messageText.trim()}
                      className={`px-4 py-2 rounded-lg ${getMessageSendButtonClasses(isConnected && Boolean(messageText.trim()))}`}
                    >
                      Send Message
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                  placeholder="Search tickets by ID, title, or description..."
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
                filteredTickets.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {filteredTickets.map((complaint) => (
                      <button
                        key={complaint.id}
                        onClick={() => handleSearchSelect(complaint)}
                        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-blue-600">
                            #{complaint.complaintId || complaint.id.slice(-8)}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(complaint.status)}`}>
                            {complaint.status}
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 truncate">{complaint.title}</p>
                        <p className="text-sm text-gray-500 truncate">{complaint.description}</p>
                        {complaint.priority && (
                          <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded ${getPriorityColor(complaint.priority)}`}>
                            {complaint.priority}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No tickets found matching "{searchQuery}"</p>
                  </div>
                )
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Start typing to search tickets...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}