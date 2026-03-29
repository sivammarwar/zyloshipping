'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { QuickReplyChips } from '@/components/chat/QuickReplyChips';
import { sendChatMessage, getChatHistory } from '@/lib/api/chat';
import { Message } from '@/types/chat';
import { getUserFromToken } from '@/lib/tokenManager';
import { useRouter } from 'next/navigation';

export default function SupportPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const user = getUserFromToken();
    if (!user) {
      router.push('/login?redirect=/support');
      return;
    }
    loadHistory();
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const loadHistory = async () => {
    try {
      const history = await getChatHistory();
      const historyMessages: Message[] = history.conversations.flatMap(conv => [
        {
          id: `${conv.ticketId}-user`,
          role: 'user' as const,
          content: conv.userMessage,
          timestamp: new Date(conv.timestamp),
        },
        {
          id: `${conv.ticketId}-ai`,
          role: 'ai' as const,
          content: conv.aiReply || 'Processing...',
          timestamp: new Date(conv.timestamp),
          ticketId: conv.ticketNumber,
        },
      ]);
      setMessages(historyMessages);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    setShowQuickReplies(false);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(text);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: response.reply,
        timestamp: new Date(),
        requiresHuman: response.requiresHuman,
        ticketId: response.ticketId,
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: "I'm sorry, I'm having trouble right now. Please try again or contact our support team directly.",
        timestamp: new Date(),
        requiresHuman: true,
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setShowQuickReplies(true);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-20 lg:pb-8">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                💬 ZyloShipping Support
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                AI replies in seconds • 24/7
              </p>
            </div>
            <button
              onClick={handleNewChat}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
            >
              New Chat
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          <div className="h-[600px] md:h-[600px] sm:h-[calc(100vh-250px)] overflow-y-auto p-6">
            {messages.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-800 rounded-full mx-auto mb-4 flex items-center justify-center text-3xl">
                  🤖
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Hi! I'm ZyloBot
                </h2>
                <p className="text-gray-600 mb-6">
                  How can I help you today?
                </p>
              </div>
            )}

            {showQuickReplies && messages.length === 0 && (
              <QuickReplyChips onSelect={handleSend} />
            )}

            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isLoading && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 p-4 sm:p-3">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                rows={1}
                maxLength={500}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                style={{ minHeight: '48px', maxHeight: '120px' }}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
              >
                →
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {input.length}/500 characters
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
