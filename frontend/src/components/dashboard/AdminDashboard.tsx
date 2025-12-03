import { useState, useEffect, useCallback } from 'react';
import { 
  Shield, Activity, FileText, UserCheck, RefreshCw,
  Users, Home, Settings, Bell, HelpCircle, LogOut,
  ChevronDown, Menu, TrendingUp, BarChart3,
  Clock, CheckCircle, Star, Eye, Calendar, MessageCircle, X, Search
} from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import { useComplaints } from '../../contexts/ComplaintContext';
import { apiService } from '../../services/apiService';
import { agentService } from '../../services/agentService';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { 
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// Helper functions - commented out since they are not used directly in this view
// but might be needed in the future or used elsewhere
/*
// Helper function to get background color class based on agent color
const getAgentBgColorClass = (color: string): string => {
  switch (color) {
    case 'blue': return 'bg-blue-500';
    case 'green': return 'bg-green-500';
    case 'red': return 'bg-red-500';
    case 'orange': return 'bg-orange-500';
    case 'purple': return 'bg-purple-500';
    case 'pink': return 'bg-pink-500';
    default: return 'bg-gray-500';
  }
};

// Helper function to get status badge classes
const getStatusBadgeClasses = (status: string): string => {
  switch (status) {
    case 'available': return 'bg-green-100 text-green-800';
    case 'busy': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Helper function to get workload bar color
const getWorkloadBarColor = (load: number): string => {
  if (load >= 7) return 'bg-red-500';
  if (load >= 5) return 'bg-orange-500';
  if (load >= 3) return 'bg-blue-500';
  return 'bg-green-500';
};

// Helper function to get satisfaction color
const getSatisfactionColor = (score: number): string => {
  if (score >= 90) return 'bg-green-500';
  if (score >= 80) return 'bg-blue-500';
  if (score >= 70) return 'bg-yellow-500';
  return 'bg-red-500';
};
*/

// Define interfaces for type safety
interface Agent {
  id: string;
  name: string;
  initials: string;
  status: string;
  availability: string;
  currentLoad: number;
  avgResponseTime: string;
  color: string;
  lastUpdated: Date;
  email?: string;
  currentTickets?: number;
  resolvedToday?: number;
  rating?: number;
}

interface AgentPerformance {
  id: string;
  name: string;
  initials: string;
  color: string;
  resolvedToday: number;
  totalResolved: number;
  avgResolutionTime: string;
  satisfaction: number;
}

interface TicketData {
  total: number;
  resolved: number;
  pending: number;
  critical: number;
  inProgress: number;
  newToday: number;
  reopened: number;
  trend: string;
  avgResolutionTime: string;
}

interface ApiAgentData {
  _id?: string;
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  department?: string;
  agentStatus?: string;
  availability?: string;
  status?: string;
  activeComplaints?: Array<unknown>;
  metrics?: {
    avgResponseTime?: number;
  };
  lastStatusChange?: string | Date;
  stats?: {
    totalTickets: number;
    resolvedTickets: number;
    openTickets: number;
    inProgressTickets: number;
    closedTickets: number;
    pendingTickets: number;
    resolutionRate: number;
    rating: number;
    avgResolutionTime: string;
  };
}

interface ApiPerformanceData {
  agentId: string;
  agentName?: string;
  resolvedToday?: number;
  totalResolved?: number;
  avgResolutionTime?: string;
  satisfactionScore?: number;
}

interface ApiAnalyticsData {
  totalComplaints?: number;
  resolvedComplaints?: number;
  openComplaints?: number;
  highPriorityComplaints?: number;
  inProgressComplaints?: number;
  newTodayComplaints?: number;
  reopenedComplaints?: number;
  trend?: string;
  avgResolutionTime?: string;
}

interface Complaint {
  _id: string;
  ticketId?: string;
  title: string;
  description: string;
  status: string;
  priority?: string;
  category?: string;
  userId?: string;
  agentId?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserData {
  _id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role: string;
  isVerified: boolean;
  planType?: string;
  createdAt: string;
  updatedAt?: string;
}

export const AdminDashboard = () => {
  // Remove unused state since it's not being used in the component
  // const [activeSection, setActiveSection] = useState<string>('user-agent-control');
  const { socket, isConnected } = useSocket();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  
  // Profile settings state
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    theme: 'light',
    language: 'en'
  });
  
  // Admin profile information
  const [adminProfile, setAdminProfile] = useState<{name: string; email: string; role: string; phone: string; organization: string; joinDate: string}>({ 
    name: user?.name || 'Admin',
    email: user?.email || 'admin@example.com',
    role: user?.role || 'admin',
    phone: '',
    organization: 'QuickFix Support',
    joinDate: new Date().toISOString()
  });

  // Real-time agent data - fetched from database
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(true);

  // Users data - fetched from database
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [usersPagination, setUsersPagination] = useState({ current: 1, pages: 1, total: 0 });

  // Notification state
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);

  const [ticketsData, setTicketsData] = useState<TicketData>({
    total: 92,
    resolved: 68,
    pending: 24,
    critical: 3,
    inProgress: 15,
    newToday: 8,
    reopened: 2,
    trend: '+8%',
    avgResolutionTime: '1.4 days'
  });
  
  // Agent performance data - commented out for now as we're using 'agents' directly
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [agentPerformance, setAgentPerformance] = useState<AgentPerformance[]>([
    {
      id: '1',
      name: 'John Doe',
      initials: 'JD',
      color: 'blue',
      resolvedToday: 5,
      totalResolved: 28,
      avgResolutionTime: '1.2 days',
      satisfaction: 94
    },
    {
      id: '2',
      name: 'Alice Smith',
      initials: 'AS',
      color: 'purple',
      resolvedToday: 7,
      totalResolved: 42,
      avgResolutionTime: '1.0 days',
      satisfaction: 96
    },
    {
      id: '3',
      name: 'Robert Johnson',
      initials: 'RJ',
      color: 'green',
      resolvedToday: 3,
      totalResolved: 19,
      avgResolutionTime: '1.5 days',
      satisfaction: 88
    },
    {
      id: '4',
      name: 'Emily Davis',
      initials: 'ED',
      color: 'orange',
      resolvedToday: 0,
      totalResolved: 23,
      avgResolutionTime: '1.3 days',
      satisfaction: 92
    },
    {
      id: '5',
      name: 'Michael Wilson',
      initials: 'MW',
      color: 'pink',
      resolvedToday: 4,
      totalResolved: 31,
      avgResolutionTime: '1.1 days',
      satisfaction: 90
    }
  ]);

  // Update admin profile when user changes
  useEffect(() => {
    if (user) {
      setAdminProfile(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
        role: user.role
      }));
    }
  }, [user]);

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

  // Get initials from name
  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map((part: string) => part[0] || '')
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };
  
  // Format response time
  const formatResponseTime = (minutes?: number): string => {
    if (!minutes) return '0m';
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };
  
  // Get color based on workload
  const getAgentColor = (load: number): string => {
    if (load >= 7) return 'red';
    if (load >= 5) return 'orange';
    if (load >= 3) return 'blue';
    return 'green';
  };

  // Fetch real data from the API
  const fetchDashboardData = useCallback(async () => {
    try {
      setIsRefreshing(true);
      
      // Fetch agents, including availability status, and dashboard analytics
      const [agentsResponse, analyticsResponse] = await Promise.all([
        agentService.getAllAgents(),
        apiService.getDashboardAnalytics('30')
      ]);
      
      if (agentsResponse.data && Array.isArray(agentsResponse.data)) {
        // Transform agent data to match our UI format
        const formattedAgents: Agent[] = agentsResponse.data.map((agent: ApiAgentData) => ({
          id: agent._id || agent.id || '',
          name: agent.name || `${agent.firstName || ''} ${agent.lastName || ''}`.trim(),
          initials: getInitials(agent.name || `${agent.firstName || ''} ${agent.lastName || ''}`),
          status: agent.agentStatus || 'available',
          availability: agent.availability || 'available',
          currentLoad: agent.activeComplaints?.length || 0,
          avgResponseTime: formatResponseTime(agent.metrics?.avgResponseTime),
          color: getAgentColor(agent.activeComplaints?.length || 0),
          lastUpdated: new Date(agent.lastStatusChange || Date.now())
        }));
        setAgents(formattedAgents);
      }
      
      if (analyticsResponse.data) {
        const stats = analyticsResponse.data as ApiAnalyticsData;
        setTicketsData({
          total: stats.totalComplaints || 0,
          resolved: stats.resolvedComplaints || 0,
          pending: stats.openComplaints || 0,
          critical: stats.highPriorityComplaints || 0,
          inProgress: stats.inProgressComplaints || 0,
          newToday: stats.newTodayComplaints || 0,
          reopened: stats.reopenedComplaints || 0,
          trend: stats.trend || '0%',
          avgResolutionTime: stats.avgResolutionTime || '0 days'
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [setIsRefreshing]);

  // Real-time system statistics from database
  const [systemStats, setSystemStats] = useState({
    totalUsers: 0,
    activeAgents: 0,
    totalComplaints: 0,
    resolved: 0,
    pending: 0,
    critical: 0,
    escalated: 0,
    avgResolutionTime: '0 days',
    newToday: 0,
    resolvedToday: 0
  });

  // Fetch system statistics from database
  const fetchSystemStats = useCallback(async () => {
    try {
      const response = await apiService.getSystemStats();
      if (response.data) {
        const data = response.data as {
          summary?: {
            users?: number;
            agents?: number;
            total?: number;
            resolved?: number;
            pending?: number;
            critical?: number;
          };
          totalUsers?: number;
          activeAgents?: number;
          totalComplaints?: number;
          resolvedComplaints?: number;
          closedComplaints?: number;
          pendingComplaints?: number;
          criticalComplaints?: number;
          escalatedComplaints?: number;
          newToday?: number;
          resolvedToday?: number;
        };
        
        setSystemStats({
          totalUsers: data.summary?.users || data.totalUsers || 0,
          activeAgents: data.summary?.agents || data.activeAgents || 0,
          totalComplaints: data.summary?.total || data.totalComplaints || 0,
          resolved: data.summary?.resolved || (data.resolvedComplaints || 0) + (data.closedComplaints || 0),
          pending: data.summary?.pending || data.pendingComplaints || 0,
          critical: data.summary?.critical || data.criticalComplaints || 0,
          escalated: data.escalatedComplaints || 0,
          avgResolutionTime: ticketsData.avgResolutionTime || '0 days',
          newToday: data.newToday || 0,
          resolvedToday: data.resolvedToday || 0
        });
      }
    } catch (error) {
      console.error('Error fetching system stats:', error);
    }
  }, [ticketsData.avgResolutionTime]);

  // Fetch agent performance data from database
  const fetchAgentPerformanceData = useCallback(async () => {
    try {
      setIsLoadingAgents(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5001/api/admin/agents/performance', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.agents && Array.isArray(data.agents)) {
          const formattedAgents: Agent[] = data.agents.map((agent: ApiAgentData) => ({
            id: agent._id || agent.id || '',
            name: agent.name || 'Unknown Agent',
            initials: getInitials(agent.name || 'Unknown Agent'),
            status: agent.status || 'offline',
            availability: agent.availability || 'offline',
            currentLoad: agent.stats?.pendingTickets || 0,
            avgResponseTime: agent.stats?.avgResolutionTime || 'N/A',
            color: getAgentColor(agent.stats?.pendingTickets || 0),
            lastUpdated: new Date(),
            email: agent.email || '',
            currentTickets: agent.stats?.totalTickets || 0,
            resolvedToday: agent.stats?.resolvedTickets || 0,
            rating: agent.stats?.rating || 0
          }));
          setAgents(formattedAgents);
        }
      }
    } catch (error) {
      console.error('Error fetching agent performance data:', error);
    } finally {
      setIsLoadingAgents(false);
    }
  }, []);

  // Fetch users data from database
  const fetchUsersData = useCallback(async (page = 1) => {
    try {
      setIsLoadingUsers(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5001/api/admin/users?page=${page}&limit=20`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.users && Array.isArray(data.users)) {
          setUsers(data.users);
          setUsersPagination(data.pagination || { current: 1, pages: 1, total: data.users.length });
        }
      }
    } catch (error) {
      console.error('Error fetching users data:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);
  
  // Subscribe to real-time updates
  useEffect(() => {
    if (!isConnected) return;
    
    // Handle new complaints
    const handleNewComplaint = (event: Event) => {
      const newComplaint = (event as CustomEvent).detail;
      console.log('New complaint received in AdminDashboard:', newComplaint);
      
      // Update ticket data counts
      setTicketsData(prev => ({
        ...prev,
        total: prev.total + 1,
        pending: prev.pending + 1,
        newToday: prev.newToday + 1
      }));
    };
    
    // Handle status updates
    const handleStatusUpdate = (event: Event) => {
      const update = (event as CustomEvent).detail;
      console.log('Complaint status update in AdminDashboard:', update);
      
      // Refresh dashboard data to get accurate counts
      fetchDashboardData();
    };
    
    // Handle agent status updates
    const handleAgentStatusUpdate = (event: Event) => {
      const { agents: updatedAgents } = (event as CustomEvent).detail;
      console.log('Agent status update in AdminDashboard:', updatedAgents);
      
      if (Array.isArray(updatedAgents)) {
        // Format agent data
        const formattedAgents = updatedAgents.map(agent => ({
          id: agent._id,
          name: agent.name,
          initials: agent.name ? agent.name.split(' ').map((n: string) => n[0]).join('') : '',
          status: agent.isOnline ? 'available' : 'offline',
          availability: agent.availability || (agent.isOnline ? 'available' : 'offline'),
          currentLoad: agent.activeComplaints?.length || 0,
          avgResponseTime: agent.avgResponseTime || '5m',
          color: getAgentColor(agent.activeComplaints?.length || 0),
          lastUpdated: new Date(agent.lastActive || Date.now())
        }));
        setAgents(formattedAgents);
      }
    };
    
    // Handle dashboard stats updates
    const handleDashboardStatsUpdate = (event: Event) => {
      console.log('Dashboard stats update:', (event as CustomEvent).detail);
      fetchDashboardData();
    };
    
    // Register event listeners
    window.addEventListener('newComplaint', handleNewComplaint);
    window.addEventListener('complaintStatusUpdate', handleStatusUpdate);
    window.addEventListener('agentStatusUpdate', handleAgentStatusUpdate);
    window.addEventListener('dashboardStatsUpdate', handleDashboardStatsUpdate);
    
    // Cleanup
    return () => {
      window.removeEventListener('newComplaint', handleNewComplaint);
      window.removeEventListener('complaintStatusUpdate', handleStatusUpdate);
      window.removeEventListener('agentStatusUpdate', handleAgentStatusUpdate);
      window.removeEventListener('dashboardStatsUpdate', handleDashboardStatsUpdate);
    };
  }, [isConnected, fetchDashboardData]);

  // Fetch agent performance data
  const fetchAgentPerformance = useCallback(async () => {
    try {
      const response = await apiService.getTeamPerformance();
      
      if (response.data && Array.isArray(response.data)) {
        const formattedPerformance: AgentPerformance[] = response.data.map((agent: ApiPerformanceData) => ({
          id: agent.agentId,
          name: agent.agentName || 'Unknown Agent',
          initials: getInitials(agent.agentName || 'Unknown Agent'),
          color: ['blue', 'green', 'purple', 'orange', 'pink'][Math.floor(Math.random() * 5)],
          resolvedToday: agent.resolvedToday || 0,
          totalResolved: agent.totalResolved || 0,
          avgResolutionTime: agent.avgResolutionTime || '0 days',
          satisfaction: agent.satisfactionScore || 0
        }));
        
        setAgentPerformance(prevPerformance => {
          return formattedPerformance.length > 0 ? formattedPerformance : prevPerformance;
        });
      }
    } catch (error) {
      console.error('Error fetching agent performance:', error);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    // Fetch initial data
    Promise.all([
      fetchDashboardData(),
      fetchAgentPerformance(),
      fetchAgentPerformanceData(),
      fetchUsersData()
    ]);
    
    // Set up a refresh interval
    const interval = setInterval(() => {
      Promise.all([
        fetchDashboardData(),
        fetchAgentPerformance(),
        fetchAgentPerformanceData()
      ]);
    }, 60000); // Refresh every minute
    
    return () => clearInterval(interval);
  }, [fetchDashboardData, fetchAgentPerformance, fetchAgentPerformanceData, fetchUsersData]);
  
  // Handle logout
  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };
  
  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showUserMenu && !target.closest('.admin-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);
  
  // Function to handle real-time updates
  const handleAgentStatusUpdate = useCallback((agentData: { id: string; status: string; currentLoad: number }) => {
    setAgents(prevAgents => {
      return prevAgents.map(agent => {
        if (agent.id === agentData.id) {
          return {
            ...agent,
            status: agentData.status,
            currentLoad: agentData.currentLoad,
            lastUpdated: new Date()
          };
        }
        return agent;
      });
    });
  }, []);
  
  // Socket event listener for real-time updates
  useEffect(() => {
    if (socket && isConnected) {
      // Listen for agent status updates
      socket.on('agent:statusUpdate', handleAgentStatusUpdate);
      socket.on('agent_status_update', (updatedAgents) => {
        // Handle agent status updates from the server
        if (Array.isArray(updatedAgents)) {
          setAgents(prevAgents => {
            const agentMap = new Map(prevAgents.map(a => [a.id, a]));
            
            updatedAgents.forEach(agent => {
              const agentId = agent.id || agent._id;
              if (agentId && agentMap.has(agentId)) {
                const existingAgent = agentMap.get(agentId);
                if (existingAgent) {
                  agentMap.set(agentId, {
                    ...existingAgent,
                    status: agent.agentStatus || agent.status || existingAgent.status,
                    currentLoad: agent.activeComplaints?.length || agent.currentLoad || existingAgent.currentLoad,
                    lastUpdated: new Date()
                  });
                }
              }
            });
            
            return Array.from(agentMap.values());
          });
        }
      });
      
      // Listen for ticket updates
      socket.on('tickets:update', (data) => {
        setTicketsData(prevData => ({
          ...prevData,
          total: data.total || prevData.total,
          resolved: data.resolved || prevData.resolved,
          pending: data.pending || prevData.pending,
          critical: data.critical || prevData.critical
        }));
      });
      
      // Listen for dashboard stats updates
      socket.on('dashboard_stats_update', (stats) => {
        setTicketsData(prevData => ({
          ...prevData,
          total: stats.totalComplaints || prevData.total,
          resolved: stats.resolvedComplaints || prevData.resolved,
          pending: stats.openComplaints || prevData.pending,
          critical: stats.highPriorityComplaints || prevData.critical,
          inProgress: stats.inProgressComplaints || prevData.inProgress,
          newToday: stats.newTodayComplaints || prevData.newToday,
          reopened: stats.reopenedComplaints || prevData.reopened,
          trend: stats.trend || prevData.trend,
          avgResolutionTime: stats.avgResolutionTime || prevData.avgResolutionTime
        }));
      });

      // Listen for new complaints
      socket.on('new_complaint', () => {
        // Refresh dashboard data when a new complaint is received
        Promise.all([
          fetchDashboardData(),
          fetchAgentPerformance(),
          fetchSystemStats()
        ]);
      });
      
      return () => {
        socket.off('agent:statusUpdate');
        socket.off('agent_status_update');
        socket.off('tickets:update');
        socket.off('dashboard_stats_update');
        socket.off('new_complaint');
      };
    }
  }, [socket, isConnected, fetchDashboardData, handleAgentStatusUpdate, fetchAgentPerformance, fetchSystemStats]);
  
  // Complaint categories data - keeping for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [complaintCategories] = useState([
    { name: 'Technical Issues', count: 34, percentage: 37 },
    { name: 'Billing Problems', count: 26, percentage: 28 },
    { name: 'Product Quality', count: 18, percentage: 20 },
    { name: 'Delivery Issues', count: 9, percentage: 10 },
    { name: 'Other', count: 5, percentage: 5 }
  ]);
  
  // Refresh data on demand
  const refreshData = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    
    try {
      // Fetch fresh data from API including system stats and complaints
      await Promise.all([
        fetchDashboardData(),
        fetchAgentPerformance(),
        fetchSystemStats(),
        refreshComplaints()
      ]);
      console.log('Dashboard data refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Assign ticket function - keeping for future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const assignTicket = async (agentId: string) => {
    try {
      setIsRefreshing(true);
      
      // Check if agent is available first
      const agent = agents.find(a => a.id === agentId);
      if (!agent) {
        alert('Agent not found');
        return;
      }
      
      if (agent.availability !== 'available') {
        alert(`Cannot assign ticket: Agent ${agent.name} is currently ${agent.availability}`);
        return;
      }
      
      // Get pending complaints
      const complaintsResponse = await apiService.getComplaints({ status: 'New' });
      if (!complaintsResponse.data || !Array.isArray(complaintsResponse.data) || complaintsResponse.data.length === 0) {
        alert('No new complaints available for assignment');
        return;
      }
      
      // Assign first pending complaint to selected agent
      const complaintToAssign = complaintsResponse.data[0] as Complaint;
      await apiService.assignComplaint(complaintToAssign._id, agentId);
      
      // Update agent availability to busy
      await agentService.updateAvailability(agentId, 'busy');
      
      // Update local state optimistically
      setAgents(prevAgents => {
        return prevAgents.map(agent => {
          if (agent.id === agentId) {
            return { 
              ...agent, 
              currentLoad: agent.currentLoad + 1,
              availability: 'busy',
              status: 'busy'
            };
          }
          return agent;
        });
      });
      
      // Refresh data after assignment
      Promise.all([
        fetchDashboardData(),
        fetchAgentPerformance()
      ]);
      
      // Inform the user
      alert(`Assigned complaint #${complaintToAssign.ticketId || complaintToAssign._id} to agent`);
    } catch (error) {
      console.error('Error assigning ticket:', error);
      alert('Failed to assign ticket');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Add new state for view management
  const [activeView, setActiveView] = useState('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const { complaints, refreshComplaints } = useComplaints();

  // Filter complaints by search query
  const filteredBySearch = searchQuery.trim() ? complaints.filter(c => 
    c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.complaintId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.category?.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];

  // Handle search result selection
  const handleSearchSelect = (complaint: { id: string }) => {
    console.log('Selected complaint:', complaint.id);
    setShowSearchModal(false);
    setSearchQuery('');
    setActiveView('complaints');
    // Could also set a selected complaint state here
  };

  // Fetch system stats on mount and periodically
  useEffect(() => {
    fetchSystemStats();
    
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchSystemStats, 30000);
    
    return () => clearInterval(interval);
  }, [fetchSystemStats]);

  // Calculate comprehensive statistics - now using real data from database
  const stats = {
    totalUsers: systemStats.totalUsers,
    totalAgents: systemStats.activeAgents || agents.length,
    totalComplaints: systemStats.totalComplaints || complaints.length || ticketsData.total,
    resolved: systemStats.resolved || complaints.filter(c => c.status === 'Resolved' || c.status === 'Closed').length || ticketsData.resolved,
    pending: systemStats.pending || complaints.filter(c => c.status === 'Open' || c.status === 'In Progress').length || ticketsData.pending,
    critical: systemStats.critical || complaints.filter(c => c.priority === 'High' || c.priority === 'Urgent').length || ticketsData.critical,
    escalated: systemStats.escalated || complaints.filter(c => c.status === 'Escalated').length,
    avgResolutionTime: systemStats.avgResolutionTime || ticketsData.avgResolutionTime || '1.4 days'
  };

  // Chart data for status distribution
  const statusChartData = [
    { name: 'Open', value: complaints.filter(c => c.status === 'Open').length, color: '#3B82F6' },
    { name: 'In Progress', value: complaints.filter(c => c.status === 'In Progress').length, color: '#F59E0B' },
    { name: 'Resolved', value: complaints.filter(c => c.status === 'Resolved').length, color: '#10B981' },
    { name: 'Closed', value: complaints.filter(c => c.status === 'Closed').length, color: '#6B7280' },
    { name: 'Escalated', value: complaints.filter(c => c.status === 'Escalated').length, color: '#EF4444' }
  ].filter(item => item.value > 0);

  // Chart data for category distribution - using exact category names from database
  const categoryChartData = [
    { category: 'Technical', count: complaints.filter(c => c.category === 'Technical').length, color: '#3B82F6' },
    { category: 'Billing', count: complaints.filter(c => c.category === 'Billing').length, color: '#10B981' },
    { category: 'Product', count: complaints.filter(c => c.category === 'Product').length, color: '#F59E0B' },
    { category: 'Service', count: complaints.filter(c => c.category === 'Service').length, color: '#8B5CF6' },
    { category: 'General', count: complaints.filter(c => c.category === 'General').length, color: '#6B7280' }
  ].filter(item => item.count > 0);

  // Chart data for user/agent distribution
  const userAgentData = [
    { name: 'Users', value: 245, color: '#3B82F6' },
    { name: 'Agents', value: stats.totalAgents, color: '#10B981' },
    { name: 'Admins', value: 3, color: '#F59E0B' }
  ];

  // Trend data for last 7 days
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
      {/* Collapsible Sidebar */}
      <div className={`bg-slate-800 ${sidebarCollapsed ? 'w-16' : 'w-64'} flex flex-col py-4 transition-all duration-300 ease-in-out`}>
        <div className={`${sidebarCollapsed ? 'px-3' : 'px-4'} mb-4`}>
          <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-white font-semibold text-lg">QuickFix Admin</span>
            )}
          </div>
        </div>
        
        <div className={`space-y-2 ${sidebarCollapsed ? 'px-3' : 'px-4'} flex-1`}>
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`w-full h-10 rounded-lg flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-3'} gap-3 transition-colors ${
              activeView === 'dashboard' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Dashboard"
          >
            <Home className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Dashboard</span>}
          </button>
          
          <button 
            onClick={() => setActiveView('users')}
            className={`w-full h-10 rounded-lg flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-3'} gap-3 transition-colors ${
              activeView === 'users' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Users Management"
          >
            <Users className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Users</span>}
          </button>
          
          <button 
            onClick={() => setActiveView('agents')}
            className={`w-full h-10 rounded-lg flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-3'} gap-3 transition-colors ${
              activeView === 'agents' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Agents Management"
          >
            <UserCheck className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Agents</span>}
          </button>
          
          <button 
            onClick={() => setActiveView('complaints')}
            className={`w-full h-10 rounded-lg flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-3'} gap-3 transition-colors ${
              activeView === 'complaints' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Complaints"
          >
            <FileText className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Complaints</span>}
          </button>
          
          <button 
            onClick={() => setActiveView('analytics')}
            className={`w-full h-10 rounded-lg flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-3'} gap-3 transition-colors ${
              activeView === 'analytics' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Analytics"
          >
            <Activity className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Analytics</span>}
          </button>
          
          <button 
            onClick={() => setActiveView('profile')}
            className={`w-full h-10 rounded-lg flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-3'} gap-3 transition-colors ${
              activeView === 'profile' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            title="Settings"
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Settings</span>}
          </button>
          
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`w-full h-10 rounded-lg flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-3'} gap-3 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors`}
            title="Notifications"
          >
            <Bell className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Notifications</span>}
          </button>
          
          <button 
            className={`w-full h-10 rounded-lg flex items-center ${sidebarCollapsed ? 'justify-center' : 'px-3'} gap-3 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors`}
            title="Help"
          >
            <HelpCircle className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Help</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
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
              {activeView === 'dashboard' && 'Admin Dashboard'}
              {activeView === 'users' && 'Users Management'}
              {activeView === 'agents' && 'Agents Management'}
              {activeView === 'complaints' && 'Complaints Management'}
              {activeView === 'analytics' && 'Analytics & Reports'}
              {activeView === 'profile' && 'Profile Settings'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowSearchModal(true)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
              title="Search complaints"
            >
              <Search className="w-5 h-5" />
            </button>
            
            <button 
              onClick={refreshData}
              disabled={isRefreshing}
              className="text-slate-800 hover:text-slate-900 font-medium text-sm flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-lg disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
              
            <button 
              onClick={() => {
                setShowNotifications(true);
                setHasUnreadNotifications(false);
              }}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg relative"
            >
              <Bell className="w-5 h-5" />
              {hasUnreadNotifications && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
              )}
            </button>
            
            <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">
              <HelpCircle className="w-5 h-5" />
            </button>
            
            <div className="relative admin-menu-container">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors"
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {adminProfile.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                )}
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">{adminProfile.name}</p>
                  <p className="text-xs text-gray-500">{adminProfile.role}</p>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
              </button>
              
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-100">
                    <p className="font-semibold text-gray-900">{adminProfile.name}</p>
                    <p className="text-sm text-blue-600 truncate" title={adminProfile.email}>{adminProfile.email}</p>
                    <p className="text-sm text-gray-500 mt-1">Role: {adminProfile.role}</p>
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
        
        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <div className="p-6 bg-gray-50 min-h-screen">
            {/* Welcome Section */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">Admin Dashboard</h2>
              <p className="text-gray-600">Complete overview of your system</p>
            </div>

            {/* Clean Stats Cards - Text Only Style */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-600 mb-2">Total Users</p>
                <div className="text-3xl font-bold text-gray-900">{stats.totalUsers}</div>
                <p className="text-xs text-gray-500 mt-1">Registered</p>
              </div>
              
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-600 mb-2">Active Agents</p>
                <div className="text-3xl font-bold text-green-600">{stats.totalAgents}</div>
                <p className="text-xs text-gray-500 mt-1">Available</p>
              </div>
              
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-600 mb-2">Total Complaints</p>
                <div className="text-3xl font-bold text-gray-900">{stats.totalComplaints}</div>
                <p className="text-xs text-gray-500 mt-1">All time</p>
              </div>
              
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-600 mb-2">Resolved</p>
                <div className="text-3xl font-bold text-green-600">{stats.resolved}</div>
                <p className="text-xs text-gray-500 mt-1">Completed</p>
              </div>
              
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-600 mb-2">Pending</p>
                <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-xs text-gray-500 mt-1">Awaiting action</p>
              </div>
              
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <p className="text-sm text-gray-600 mb-2">Critical</p>
                <div className="text-3xl font-bold text-red-600">{stats.critical}</div>
                <p className="text-xs text-gray-500 mt-1">High priority</p>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* User/Agent Distribution Pie Chart */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">User & Agent Distribution</h3>
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={userAgentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {userAgentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {userAgentData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Complaint Status Distribution */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Complaint Status</h3>
                  <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
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
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {statusChartData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-gray-600">{item.name}: {item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 7-Day Trend Analysis */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">7-Day Trend</h3>
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
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
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Complaints by Category</h3>
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={categoryChartData}>
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
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* System Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Resolution Rate</span>
                    <span className="text-sm font-semibold text-gray-900">{stats.totalComplaints > 0 ? Math.round((stats.resolved / stats.totalComplaints) * 100) : 0}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Avg Resolution Time</span>
                    <span className="text-sm font-semibold text-gray-900">{stats.avgResolutionTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Escalated Tickets</span>
                    <span className="text-sm font-semibold text-red-600">{stats.escalated}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Server Status</span>
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-semibold text-green-600">Online</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Socket Connection</span>
                    <span className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className={`text-sm font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                        {isConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Sessions</span>
                    <span className="text-sm font-semibold text-gray-900">{stats.totalAgents + 12}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => setActiveView('users')}
                    className="w-full flex items-center gap-2 p-2 text-left border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <Users className="w-4 h-4 text-blue-600" />
                    <span>Manage Users</span>
                  </button>
                  <button 
                    onClick={() => setActiveView('agents')}
                    className="w-full flex items-center gap-2 p-2 text-left border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <UserCheck className="w-4 h-4 text-green-600" />
                    <span>Manage Agents</span>
                  </button>
                  <button 
                    onClick={() => setActiveView('complaints')}
                    className="w-full flex items-center gap-2 p-2 text-left border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <FileText className="w-4 h-4 text-purple-600" />
                    <span>View All Complaints</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Management View */}
        {activeView === 'users' && (
          <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">User Management</h2>
              <p className="text-gray-600">Manage all registered users</p>
            </div>

            {/* User Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{usersPagination.total || stats.totalUsers}</div>
                <p className="text-sm text-gray-600">Total Users</p>
              </div>
              
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{users.filter(u => u.isVerified).length}</div>
                <p className="text-sm text-gray-600">Verified</p>
              </div>
              
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{users.filter(u => u.planType === 'Pro' || u.planType === 'Premium').length}</div>
                <p className="text-sm text-gray-600">Premium Users</p>
              </div>
              
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{users.filter(u => !u.isVerified).length}</div>
                <p className="text-sm text-gray-600">Pending Verification</p>
              </div>
            </div>
            
            {/* User List Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">All Users</h3>
                    <p className="text-sm text-gray-600">View and manage user accounts</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Add New User
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoadingUsers ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                            <p className="text-gray-500">Loading users...</p>
                          </div>
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <Users className="w-12 h-12 text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">No users found</p>
                            <p className="text-gray-400 text-sm">Users will appear here once registered</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      users.map((userData, index) => (
                        <tr key={userData._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {(usersPagination.current - 1) * 20 + index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                                {userData.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{userData.name}</div>
                                <div className="text-sm text-gray-500">{userData.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {userData.phoneNumber || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              userData.isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                userData.isVerified ? 'bg-green-600' : 'bg-yellow-600'
                              }`}></div>
                              {userData.isVerified ? 'Verified' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              userData.planType === 'Premium' ? 'bg-purple-100 text-purple-800' :
                              userData.planType === 'Pro' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {userData.planType || 'Free'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(userData.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                            <button className="text-gray-600 hover:text-gray-900">Edit</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {usersPagination.pages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing page {usersPagination.current} of {usersPagination.pages} ({usersPagination.total} total users)
                  </p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => fetchUsersData(usersPagination.current - 1)}
                      disabled={usersPagination.current <= 1}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button 
                      onClick={() => fetchUsersData(usersPagination.current + 1)}
                      disabled={usersPagination.current >= usersPagination.pages}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Agents Management View */}
        {activeView === 'agents' && (
          <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">Agent Management</h2>
              <p className="text-gray-600">Monitor and manage support agents</p>
            </div>

            {/* Agent Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <UserCheck className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.totalAgents}</div>
                <p className="text-sm text-gray-600">Total Agents</p>
              </div>
              
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{agents.filter(a => a.status === 'active').length}</div>
                <p className="text-sm text-gray-600">Active Now</p>
              </div>
              
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">4.8</div>
                <p className="text-sm text-gray-600">Avg Rating</p>
              </div>
              
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.resolved}</div>
                <p className="text-sm text-gray-600">Total Resolved</p>
              </div>
            </div>
            
            {/* Agent List Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">All Agents</h3>
                    <p className="text-sm text-gray-600">Agent performance and workload</p>
                  </div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Add Agent
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tickets</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resolved</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Time</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {isLoadingAgents ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
                            <p className="text-gray-500">Loading agents...</p>
                          </div>
                        </td>
                      </tr>
                    ) : agents.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center">
                            <Users className="w-12 h-12 text-gray-300 mb-3" />
                            <p className="text-gray-500 font-medium">No agents found</p>
                            <p className="text-gray-400 text-sm">Add agents to see their performance here</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      agents.map((agent) => (
                        <tr key={agent.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                                agent.color === 'blue' ? 'bg-blue-500' :
                                agent.color === 'green' ? 'bg-green-500' :
                                agent.color === 'orange' ? 'bg-orange-500' :
                                agent.color === 'purple' ? 'bg-purple-500' :
                                agent.color === 'pink' ? 'bg-pink-500' :
                                'bg-gray-500'
                              }`}>
                                {agent.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{agent.name}</div>
                                <div className="text-sm text-gray-500">{agent.email || 'No email'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              agent.status === 'online' || agent.status === 'available' ? 'bg-green-100 text-green-800' :
                              agent.status === 'busy' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                agent.status === 'online' || agent.status === 'available' ? 'bg-green-600' :
                                agent.status === 'busy' ? 'bg-yellow-600' :
                                'bg-gray-600'
                              }`}></div>
                              {agent.status === 'online' || agent.status === 'available' ? 'Online' :
                               agent.status === 'busy' ? 'Busy' : 'Offline'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.currentTickets || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.resolvedToday || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="text-sm text-gray-900">{agent.rating?.toFixed(1) || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{agent.avgResponseTime || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                            <button className="text-gray-600 hover:text-gray-900">Edit</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Complaints View */}
        {activeView === 'complaints' && (
          <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">All Complaints</h2>
              <p className="text-gray-600">View and manage all complaints</p>
            </div>
            
            {/* Complaint Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{stats.totalComplaints}</div>
                <p className="text-sm text-gray-600">Total Complaints</p>
              </div>
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                <p className="text-sm text-gray-600">Resolved</p>
              </div>
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                <p className="text-sm text-gray-600">Pending</p>
              </div>
              <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
                <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
                <p className="text-sm text-gray-600">Critical</p>
              </div>
            </div>

            {/* Complaints Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Complaints</h3>
                <p className="text-sm text-gray-600">Latest complaints from all users</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {complaints.slice(0, 10).map((complaint) => (
                      <tr key={complaint.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{complaint.id.slice(-6)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{complaint.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{complaint.category || 'General'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            complaint.status === 'Resolved' || complaint.status === 'Closed' ? 'bg-green-100 text-green-800' :
                            complaint.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                            complaint.status === 'Escalated' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {complaint.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            complaint.priority === 'Urgent' || complaint.priority === 'High' ? 'bg-red-100 text-red-800' :
                            complaint.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {complaint.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(complaint.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">
                            <Eye className="w-4 h-4 inline" />
                          </button>
                          <button className="text-gray-600 hover:text-gray-900">
                            Assign
                          </button>
                        </td>
                      </tr>
                    ))}
                    {complaints.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          No complaints found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics View */}
        {activeView === 'analytics' && (
          <div className="p-6 bg-gray-50 min-h-screen">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">Analytics Dashboard</h2>
              <p className="text-gray-600">Detailed insights and reports</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Analytics Coming Soon</h3>
              <p className="text-gray-600 mb-4">Detailed reports and analytics will be available here</p>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Export Current Data
              </button>
            </div>
          </div>
        )}

        {/* Profile Settings View */}
        {activeView === 'profile' && (
          <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-5xl mx-auto">
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
                        <div className="w-24 h-24 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                          {adminProfile.name?.charAt(0).toUpperCase() || 'A'}
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
                      <h2 className="text-2xl font-semibold text-gray-900 mb-2">{adminProfile.name}</h2>
                      <p className="text-gray-600 mb-3">{adminProfile.email}</p>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium capitalize">{adminProfile.role}</span>
                        <span className="text-sm text-gray-600 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4" />
                          Member since {new Date(adminProfile.joinDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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
                          value={adminProfile.name.split(' ')[0] || ''}
                          onChange={(e) => setAdminProfile({...adminProfile, name: e.target.value + ' ' + (adminProfile.name.split(' ')[1] || '')})}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          placeholder="Enter first name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <input 
                          type="text" 
                          value={adminProfile.name.split(' ')[1] || ''}
                          onChange={(e) => setAdminProfile({...adminProfile, name: (adminProfile.name.split(' ')[0] || '') + ' ' + e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          placeholder="Enter last name"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <input 
                          type="email" 
                          value={adminProfile.email}
                          onChange={(e) => setAdminProfile({...adminProfile, email: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          placeholder="your.email@example.com"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                        <input 
                          type="tel" 
                          value={adminProfile.phone}
                          onChange={(e) => setAdminProfile({...adminProfile, phone: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                        <input 
                          type="text" 
                          value={adminProfile.organization}
                          onChange={(e) => setAdminProfile({...adminProfile, organization: e.target.value})}
                          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                          placeholder="Your organization name"
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
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                            <Bell className="w-5 h-5 text-purple-600" />
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-2">Email</p>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={settings.notifications.email}
                              onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, email: e.target.checked}})}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                          </label>
                        </div>

                        <div className="flex flex-col items-center p-4 bg-gray-50 rounded-lg text-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                            <MessageCircle className="w-5 h-5 text-blue-600" />
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-2">SMS</p>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={settings.notifications.sms}
                              onChange={(e) => setSettings({...settings, notifications: {...settings.notifications, sms: e.target.checked}})}
                              className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
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
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
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
                    onClick={() => setActiveView('dashboard')}
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button className="px-6 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
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
                  placeholder="Search complaints, users, or agents..."
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
                        key={complaint.id || Math.random().toString()}
                        onClick={() => handleSearchSelect(complaint)}
                        className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-purple-600">
                            #{complaint.complaintId || complaint.id.slice(-8) || 'N/A'}
                          </span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${
                            complaint.status === 'Resolved' ? 'bg-green-100 text-green-700' :
                            complaint.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
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
                    <p>No results found for "{searchQuery}"</p>
                  </div>
                )
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Start typing to search...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </div>
  );
};

export default AdminDashboard;