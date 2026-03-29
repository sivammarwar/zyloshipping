export interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
  requiresHuman?: boolean;
  ticketId?: string;
}

export interface ChatResponse {
  reply: string;
  ticketId: string;
  requiresHuman: boolean;
  responseTime: number;
}

export interface ConversationHistory {
  conversations: Array<{
    ticketId: string;
    ticketNumber: string;
    userMessage: string;
    aiReply: string;
    status: string;
    timestamp: Date;
    orderId?: string;
  }>;
  total: number;
}