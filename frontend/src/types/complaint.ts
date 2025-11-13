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
  // AI-generated summary and reply fields
  aiSummary?: {
    text: string;
    confidence: number;
    model: string;
    generatedAt: string;
  };
  aiDraftReply?: {
    text: string;
    confidence: number;
    needsHumanReview: boolean;
    model: string;
    source: string;
    tone: string;
    generatedAt: string;
    wasUsed?: boolean;
    wasEdited?: boolean;
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