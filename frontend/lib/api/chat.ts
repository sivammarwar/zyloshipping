import { apiFetch } from './client';
import type { ChatResponse, ConversationHistory } from '@/types/chat';

export function sendChatMessage(
  message: string,
  orderId?: string
): Promise<ChatResponse> {
  return apiFetch<ChatResponse>('/api/support/chat', {
    method: 'POST',
    json: { message, ...(orderId ? { orderId } : {}) },
  });
}

export function getChatHistory(): Promise<ConversationHistory> {
  return apiFetch<ConversationHistory>('/api/support/chat/history');
}