// frontend/lib/api/chat.ts
import { ensureValidToken } from '../tokenManager';
import { ChatResponse, ConversationHistory } from '@/types/chat';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function sendChatMessage(
  message: string,
  orderId?: string
): Promise<ChatResponse> {
  const token = await ensureValidToken();
  
  const response = await fetch(`${API_URL}/api/support/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({ message, orderId }),
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  return response.json();
}

export async function getChatHistory(): Promise<ConversationHistory> {
  const token = await ensureValidToken();
  
  const response = await fetch(`${API_URL}/api/support/chat/history`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch history');
  }

  return response.json();
}
