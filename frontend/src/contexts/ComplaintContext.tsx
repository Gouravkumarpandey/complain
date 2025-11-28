import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { aiService } from '../services/aiService';
import apiService from '../services/apiService';
import { useSocket } from '../hooks/useSocket';

export interface Complaint {
  id: string;
  complaintId?: string; // Human-readable complaint ID (e.g., COMP-001)
  userId: string;
  title: string;
  description: string;
  category: 'Billing' | 'Technical' | 'Service' | 'Product' | 'General';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'Open' | 'In Progress' | 'Under Review' | 'Resolved' | 'Closed' | 'Escalated';
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  assignedTo?: string;
  assignedAgentName?: string; // Name of the assigned agent
  assignedAgentEmail?: string; // Email of the assigned agent
  assignedTeam?: string;
  slaTarget: Date;
  responseTime?: number; // in hours
  resolutionTime?: number; // in hours
  isEscalated: boolean;
  escalationReason?: string;
  feedback?: {
    rating: number;
    comment: string;
    submittedAt: Date;
  };
  // AI Assignment information
  aiAssignment?: {
    confidence?: number;
    reasoning?: string;
    method?: string;
    estimatedResponseTime?: string;
    assignedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
  updates: ComplaintUpdate[];
}

export interface ComplaintUpdate {
  id: string;
  complaintId: string;
  message: string;
  author: string;
  timestamp: Date;
  type: 'status_change' | 'comment' | 'assignment';
}

interface ComplaintContextType {
  complaints: Complaint[];
  loading: boolean;
  createComplaint: (title: string, description: string, userId: string) => Promise<Complaint>;
  updateComplaintStatus: (id: string, status: Complaint['status'], message?: string) => void;
  assignComplaint: (id: string, agentId: string) => void;
  escalateComplaint: (id: string, reason: string) => void;
  addComplaintUpdate: (id: string, message: string, author: string, type: ComplaintUpdate['type']) => void;
  submitFeedback: (id: string, rating: number, comment: string) => void;
  getComplaintsByUser: (userId: string) => Complaint[];
  getUserComplaints: (userId: string) => Complaint[];
  getEscalatedComplaints: () => Complaint[];
  getSlaBreaches: () => Complaint[];
  autoAssignComplaint: (complaint: Complaint) => string;
  refreshComplaints: () => Promise<void>;
}

const ComplaintContext = createContext<ComplaintContextType | undefined>(undefined);

export function ComplaintProvider({ children }: { children: ReactNode }) {
  const { notifyNewComplaint } = useSocket();
  const [loading, setLoading] = useState(false);
  const [complaints, setComplaints] = useState<Complaint[]>([
    // Sample complaints for testing
    {
      id: 'COMP-001',
      userId: 'user-1',
      title: 'Internet connection keeps dropping',
      description: 'My internet connection has been unstable for the past 3 days. It drops every 2-3 hours and I have to restart my router.',
      category: 'Technical',
      priority: 'High',
      status: 'In Progress',
      sentiment: 'Negative',
      slaTarget: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
      isEscalated: false,
      assignedTo: 'Alex Kumar',
      assignedTeam: 'Tech Support Team',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      updates: [
        {
          id: 'update-1',
          complaintId: 'COMP-001',
          message: 'Complaint has been created and classified automatically.',
          author: 'System',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          type: 'status_change',
        },
        {
          id: 'update-2',
          complaintId: 'COMP-001',
          message: 'Assigned to Tech Support Team. Agent Alex Kumar will handle this case.',
          author: 'System',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000),
          type: 'assignment',
        },
        {
          id: 'update-3',
          complaintId: 'COMP-001',
          message: 'I have investigated the issue and it appears to be related to your ISP. We are contacting them on your behalf.',
          author: 'Alex Kumar',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          type: 'comment',
        }
      ],
    },
    {
      id: 'COMP-002',
      userId: 'user-1',
      title: 'Billing discrepancy in last month invoice',
      description: 'I was charged twice for my monthly subscription. The amount $29.99 appears twice in my billing statement.',
      category: 'Billing',
      priority: 'Medium',
      status: 'Resolved',
      sentiment: 'Neutral',
      slaTarget: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago (SLA met)
      isEscalated: false,
      assignedTo: 'Sarah Johnson',
      assignedTeam: 'Billing Team',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      updates: [
        {
          id: 'update-4',
          complaintId: 'COMP-002',
          message: 'Complaint has been created and classified automatically.',
          author: 'System',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          type: 'status_change',
        },
        {
          id: 'update-5',
          complaintId: 'COMP-002',
          message: 'I have reviewed your billing and confirmed the duplicate charge. A refund of $29.99 has been processed.',
          author: 'Sarah Johnson',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          type: 'comment',
        }
      ],
    },
    {
      id: 'COMP-003',
      userId: 'user-2',
      title: 'Application crashes when uploading files',
      description: 'Every time I try to upload a file larger than 5MB, the application crashes and I lose all my work. This is very frustrating!',
      category: 'Technical',
      priority: 'Urgent',
      status: 'Open',
      sentiment: 'Negative',
      slaTarget: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago (SLA breached)
      isEscalated: true,
      escalationReason: 'SLA breach - critical issue affecting user productivity',
      assignedTo: 'David Park',
      assignedTeam: 'Tech Support Team',
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      updatedAt: new Date(Date.now() - 7 * 60 * 60 * 1000), // 7 hours ago
      updates: [
        {
          id: 'update-6',
          complaintId: 'COMP-003',
          message: 'Complaint has been created and classified automatically.',
          author: 'System',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          type: 'status_change',
        },
        {
          id: 'update-7',
          complaintId: 'COMP-003',
          message: 'Complaint escalated: SLA breach - critical issue affecting user productivity',
          author: 'System',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          type: 'status_change',
        }
      ],
    }
  ]);

  // Helper function to determine team based on category
  const getTeamForCategory = (category: Complaint['category']): string => {
    const teamMapping = {
      'Billing': 'Billing Team',
      'Technical': 'Tech Support Team',
      'Service': 'Customer Service Team',
      'Product': 'Product Team',
      'General': 'General Support Team'
    };
    return teamMapping[category];
  };

  // Fetch complaints from the backend API
  const refreshComplaints = async (): Promise<void> => {
    setLoading(true);
    try {
      const response = await apiService.getComplaints({ limit: 100 });
      if (response.data && Array.isArray((response.data as { complaints?: unknown[] }).complaints)) {
        const backendComplaints = (response.data as { complaints: Array<Record<string, unknown>> }).complaints;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedComplaints: Complaint[] = backendComplaints.map((c: any) => {
          // Extract AI assignment info from updates if present
          const assignmentUpdate = c.updates?.find((u: { updateType?: string }) => u.updateType === 'assignment');
          const aiAssignmentInfo = assignmentUpdate?.metadata;
          
          return {
            id: c._id || c.id,
            complaintId: c.complaintId,
            userId: c.user?._id || c.user,
            title: c.title,
            description: c.description,
            category: c.category || 'General',
            priority: c.priority || 'Low',
            status: c.status || 'Open',
            sentiment: c.aiAnalysis?.sentiment || 'Neutral',
            assignedTo: c.assignedTo?._id || c.assignedTo,
            assignedAgentName: c.assignedTo?.name,
            assignedAgentEmail: c.assignedTo?.email,
            assignedTeam: c.assignedTeam,
            slaTarget: c.sla?.resolutionTime?.target 
              ? new Date(Date.now() + c.sla.resolutionTime.target * 60 * 60 * 1000)
              : new Date(Date.now() + 48 * 60 * 60 * 1000),
            isEscalated: Boolean(c.escalation?.escalatedBy),
            escalationReason: c.escalation?.reason,
            aiAssignment: aiAssignmentInfo ? {
              confidence: aiAssignmentInfo.confidence,
              reasoning: assignmentUpdate?.message,
              method: aiAssignmentInfo.assignmentMethod,
              estimatedResponseTime: aiAssignmentInfo.estimatedResponseTime,
              assignedAt: assignmentUpdate?.createdAt ? new Date(assignmentUpdate.createdAt) : undefined
            } : undefined,
            createdAt: c.createdAt ? new Date(c.createdAt) : new Date(),
            updatedAt: c.updatedAt ? new Date(c.updatedAt) : new Date(),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            updates: Array.isArray(c.updates) ? c.updates.map((u: any) => ({
              id: u._id || u.id || Math.random().toString(36).slice(2),
              complaintId: c._id || c.id,
              message: u.message || '',
              author: u.updatedBy?.name || u.updatedBy || 'System',
              timestamp: u.createdAt ? new Date(u.createdAt) : new Date(),
              type: (u.updateType || 'comment') as ComplaintUpdate['type']
            })) : []
          };
        });
        
        setComplaints(prev => {
          // Merge with existing complaints, preferring backend data
          const existingIds = new Set(mappedComplaints.map(c => c.id));
          const localOnly = prev.filter(c => !existingIds.has(c.id) && !c.id.startsWith('COMP-'));
          return [...mappedComplaints, ...localOnly];
        });
      }
    } catch (error) {
      console.error('Failed to fetch complaints from backend:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch complaints on mount
  useEffect(() => {
    refreshComplaints();
  }, []);

  // Helper function to auto-assign complaints to agents with defensive checks
  const autoAssignComplaint = (complaint: Complaint): string => {
    try {
      // Mock agent assignment logic
      const agents = {
        'Billing': ['Sarah Johnson', 'Mike Chen', 'Lisa Rodriguez'],
        'Technical': ['Alex Kumar', 'David Park', 'Emma Wilson'],
        'Service': ['John Smith', 'Maria Garcia', 'Tom Brown'],
        'Product': ['Rachel Green', 'Steven Taylor', 'Amy Liu'],
        'General': ['Chris Davis', 'Nicole White', 'Mark Johnson']
      };

      if (!complaint) {
        console.warn('autoAssignComplaint: complaint is undefined or null', { complaint });
        return '';
      }

      const category = complaint.category || 'General';
      const categoryAgents = agents[category as keyof typeof agents];

      if (!categoryAgents) {
        console.warn('autoAssignComplaint: no agents found for category', { category });
        return '';
      }

      if (!Array.isArray(categoryAgents)) {
        console.warn('autoAssignComplaint: categoryAgents is not an array', { categoryAgents });
        return '';
      }

      if (categoryAgents.length === 0) {
        console.info('autoAssignComplaint: no available agents for category', { category });
        return '';
      }

      const randomIndex = Math.floor(Math.random() * categoryAgents.length);
      return categoryAgents[randomIndex];
    } catch (err) {
      console.error('autoAssignComplaint: unexpected error', err, { complaint });
      return '';
    }
  };

  const createComplaint = async (title: string, description: string, userId: string): Promise<Complaint> => {
    // Classify first for category/priority hints
    const aiAnalysis = await aiService.classifyComplaint(description);

    // Try creating via backend so other tabs/agents receive socket events
    try {
      const apiRes = await apiService.createComplaint({
        title,
        description,
        category: aiAnalysis.category,
      });

      if (apiRes.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const incoming = apiRes.data as any;
        // Map backend response to our Complaint shape
        const mapped: Complaint = {
          id: incoming._id || incoming.id || Date.now().toString(),
          userId: incoming.userId || incoming.user?._id || incoming.user || userId,
          title: incoming.title || title,
          description: incoming.description || description,
          category: incoming.category || aiAnalysis.category,
          priority: incoming.priority || aiAnalysis.priority || 'Low',
          status: incoming.status || 'Open',
          sentiment: aiAnalysis.sentiment || 'Neutral',
          assignedTo: incoming.assignedTo?._id || incoming.agentId?._id || incoming.assignedTo,
          assignedTeam: incoming.assignedTeam,
          slaTarget: incoming.slaTarget ? new Date(incoming.slaTarget) : new Date(Date.now() + 48 * 60 * 60 * 1000),
          isEscalated: Boolean(incoming.isEscalated),
          escalationReason: incoming.escalationReason,
          createdAt: incoming.createdAt ? new Date(incoming.createdAt) : new Date(),
          updatedAt: incoming.updatedAt ? new Date(incoming.updatedAt) : new Date(),
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          updates: Array.isArray(incoming.updates) ? incoming.updates.map((u: any) => ({
            id: u._id || u.id || Math.random().toString(36).slice(2),
            complaintId: (u.complaintId?._id) || u.complaintId || (incoming._id || incoming.id),
            message: u.message || '',
            author: u.author?.name || u.author || 'System',
            timestamp: u.timestamp ? new Date(u.timestamp) : new Date(),
            type: (u.type || 'comment') as ComplaintUpdate['type']
          })) : [],
        };

        setComplaints(prev => {
          // de-dupe by id
          if (prev.some(c => c.id === mapped.id)) return prev;
          return [...prev, mapped];
        });
  // Notify socket layer so other roles/tabs receive 'new_complaint'
  try { notifyNewComplaint(mapped.id); } catch { /* optional: socket not connected */ }
        return mapped;
      }
    } catch (err: unknown) {
      console.warn('API createComplaint failed', err);
      
      // Check if it's an AI validation error
      const error = err as { response?: { status?: number; data?: { aiAnalysis?: unknown; message?: string } }; message?: string };
      if (error.response?.status === 400 && error.response?.data?.aiAnalysis) {
        const errorData = error.response.data;
        throw new Error(errorData.message || 'Your complaint appears to contain invalid or meaningless content. Please provide a genuine description of your issue.');
      }
      
      // For other errors, re-throw with message
      throw new Error(error.response?.data?.message || error.message || 'Failed to create complaint');
    }

    // Fallback: local-only create to keep UX responsive
    const slaHours = { Urgent: 4, High: 24, Medium: 48, Low: 72 } as const;
    const slaTarget = new Date();
    slaTarget.setHours(slaTarget.getHours() + slaHours[aiAnalysis.priority]);

    const id = Date.now().toString();
    const newComplaint: Complaint = {
      id,
      userId,
      title,
      description,
      category: aiAnalysis.category,
      priority: aiAnalysis.priority,
      status: 'Open',
      sentiment: aiAnalysis.sentiment,
      slaTarget,
      isEscalated: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      updates: [{
        id: `${id}_init`,
        complaintId: id,
        message: 'Complaint has been created and classified automatically.',
        author: 'System',
        timestamp: new Date(),
        type: 'status_change',
      }],
    };

    // Auto-assign (name-based fallback in local mode)
    const assignedAgent = autoAssignComplaint(newComplaint);
    if (assignedAgent) {
      newComplaint.assignedTo = assignedAgent; // name fallback
      newComplaint.assignedTeam = getTeamForCategory(newComplaint.category);
      newComplaint.updates.push({
        id: `${id}_assign`,
        complaintId: id,
        message: `Automatically assigned to ${assignedAgent} from ${newComplaint.assignedTeam} team`,
        author: 'System',
        timestamp: new Date(),
        type: 'assignment',
      });
    }

    setComplaints(prev => [...prev, newComplaint]);
    return newComplaint;
  };

  // Listen for server-pushed new complaints and merge into local state
  useEffect(() => {
    const handler = (evt: Event) => {
      const e = evt as CustomEvent;
      const incoming = e.detail || {};
  const mapped: Complaint = {
        id: incoming._id || incoming.id || Math.random().toString(36).slice(2),
        userId: incoming.userId || incoming.user?._id || incoming.user || 'unknown',
        title: incoming.title || 'New Complaint',
        description: incoming.description || '',
        category: incoming.category || 'General',
        priority: incoming.priority || 'Low',
        status: incoming.status || 'Open',
        sentiment: 'Neutral',
        assignedTo: incoming.assignedTo?._id || incoming.agentId?._id || incoming.assignedTo,
        assignedTeam: incoming.assignedTeam,
        slaTarget: incoming.slaTarget ? new Date(incoming.slaTarget) : new Date(Date.now() + 48 * 60 * 60 * 1000),
        isEscalated: Boolean(incoming.isEscalated),
        escalationReason: incoming.escalationReason,
        createdAt: incoming.createdAt ? new Date(incoming.createdAt) : new Date(),
        updatedAt: incoming.updatedAt ? new Date(incoming.updatedAt) : new Date(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updates: Array.isArray(incoming.updates) ? incoming.updates.map((u: any) => ({
          id: u._id || u.id || Math.random().toString(36).slice(2),
          complaintId: (u.complaintId?._id) || u.complaintId || (incoming._id || incoming.id),
          message: u.message || '',
          author: u.author?.name || u.author || 'System',
          timestamp: u.timestamp ? new Date(u.timestamp) : new Date(),
          type: (u.type || 'comment') as ComplaintUpdate['type']
        })) : [],
      };

      setComplaints(prev => {
        if (prev.some(c => c.id === mapped.id)) return prev;
        return [mapped, ...prev];
      });
    };

    window.addEventListener('newComplaint', handler as EventListener);
    return () => window.removeEventListener('newComplaint', handler as EventListener);
  }, []);

  const updateComplaintStatus = (id: string, status: Complaint['status'], message?: string) => {
    setComplaints(prev => prev.map(complaint => {
      if (complaint.id === id) {
        const update: ComplaintUpdate = {
          id: Date.now().toString(),
          complaintId: id,
          message: message || `Status changed to ${status}`,
          author: 'System',
          timestamp: new Date(),
          type: 'status_change',
        };
        return {
          ...complaint,
          status,
          updatedAt: new Date(),
          updates: [...complaint.updates, update],
        };
      }
      return complaint;
    }));
  };

  const assignComplaint = (id: string, agentId: string) => {
    setComplaints(prev => prev.map(complaint => {
      if (complaint.id === id) {
        const update: ComplaintUpdate = {
          id: Date.now().toString(),
          complaintId: id,
          message: `Complaint assigned to agent ${agentId}`,
          author: 'System',
          timestamp: new Date(),
          type: 'assignment',
        };
        return {
          ...complaint,
          assignedTo: agentId,
          status: 'In Progress',
          updatedAt: new Date(),
          updates: [...complaint.updates, update],
        };
      }
      return complaint;
    }));
  };

  const addComplaintUpdate = (id: string, message: string, author: string, type: ComplaintUpdate['type']) => {
    setComplaints(prev => prev.map(complaint => {
      if (complaint.id === id) {
        const update: ComplaintUpdate = {
          id: Date.now().toString(),
          complaintId: id,
          message,
          author,
          timestamp: new Date(),
          type,
        };
        return {
          ...complaint,
          updatedAt: new Date(),
          updates: [...complaint.updates, update],
        };
      }
      return complaint;
    }));
  };

  const escalateComplaint = (id: string, reason: string) => {
    setComplaints(prev => prev.map(complaint => {
      if (complaint.id === id) {
        const update: ComplaintUpdate = {
          id: Date.now().toString(),
          complaintId: id,
          message: `Complaint escalated: ${reason}`,
          author: 'System',
          timestamp: new Date(),
          type: 'status_change',
        };
        return {
          ...complaint,
          status: 'Escalated' as Complaint['status'],
          isEscalated: true,
          escalationReason: reason,
          updatedAt: new Date(),
          updates: [...complaint.updates, update],
        };
      }
      return complaint;
    }));
  };

  const submitFeedback = (id: string, rating: number, comment: string) => {
    setComplaints(prev => prev.map(complaint => {
      if (complaint.id === id) {
        return {
          ...complaint,
          feedback: {
            rating,
            comment,
            submittedAt: new Date(),
          },
          updatedAt: new Date(),
        };
      }
      return complaint;
    }));
  };

  const getComplaintsByUser = (userId: string): Complaint[] => {
    return complaints.filter(complaint => complaint.userId === userId);
  };

  const getUserComplaints = (userId: string): Complaint[] => {
    return complaints.filter(complaint => complaint.userId === userId);
  };

  const getEscalatedComplaints = (): Complaint[] => {
    return complaints.filter(complaint => complaint.isEscalated);
  };

  const getSlaBreaches = (): Complaint[] => {
    const now = new Date();
    return complaints.filter(complaint => 
      complaint.status !== 'Resolved' && 
      complaint.status !== 'Closed' && 
      now > complaint.slaTarget
    );
  };

  return (
    <ComplaintContext.Provider value={{
      complaints,
      loading,
      createComplaint,
      updateComplaintStatus,
      assignComplaint,
      escalateComplaint,
      addComplaintUpdate,
      submitFeedback,
      getComplaintsByUser,
      getUserComplaints,
      getEscalatedComplaints,
      getSlaBreaches,
      autoAssignComplaint,
      refreshComplaints,
    }}>
      {children}
    </ComplaintContext.Provider>
  );
}

export function useComplaints() {
  const context = useContext(ComplaintContext);
  if (context === undefined) {
    throw new Error('useComplaints must be used within a ComplaintProvider');
  }
  return context;
}