export interface Complaint {
  id: string;
  title: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Under Review' | 'Resolved' | 'Closed' | 'Escalated';
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  category?: string;
  userId: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  escalationReason?: string;
  isEscalated: boolean;
  aiAnalysis?: {
    sentiment?: string;
    category?: string;
    priority?: string;
    suggestedResponse?: string;
  };
  updates: Array<{
    id: string;
    message: string;
    author: string;
    authorId: string;
    timestamp: string;
    type: 'status_change' | 'comment' | 'escalation' | 'assignment';
    isInternal: boolean;
  }>;
  attachments?: Array<{
    id: string;
    filename: string;
    url: string;
    type: string;
  }>;
}