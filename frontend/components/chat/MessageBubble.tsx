'use client';

import { Message } from '@/types/chat';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isAI = message.role === 'ai';

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-5`}>
      <div className={`flex items-end gap-2.5 ${isAI ? 'flex-row' : 'flex-row-reverse'} max-w-[75%]`}>
        {/* Avatar */}
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mb-5 ${
            isAI
              ? 'bg-[#1A1A2E] border border-[#E53E3E]/40 text-white'
              : 'bg-[#E53E3E] text-white'
          }`}
        >
          {isAI ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
                fill="currentColor" opacity="0.9"/>
            </svg>
          ) : (
            'U'
          )}
        </div>

        <div className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}>
          {/* Bubble */}
          <div
            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
              isAI
                ? 'bg-[#1A1A2E] border border-white/5 text-gray-200 rounded-tl-sm'
                : 'bg-[#E53E3E] text-white rounded-tr-sm'
            }`}
          >
            {message.content}
          </div>

          {/* Timestamp */}
          <p className="text-[10px] text-gray-600 mt-1 px-1">
            {formatTime(message.timestamp)}
          </p>

          {/* Escalation ticket */}
          {message.requiresHuman && message.ticketId && (
            <div className="mt-2 px-4 py-3 bg-[#1A1A2E] border border-[#E53E3E]/30 rounded-xl w-full">
              <div className="flex items-start gap-2">
                <span className="text-[#E53E3E] text-base leading-none mt-0.5">🎫</span>
                <div>
                  <p className="text-xs font-semibold text-white">
                    Ticket #{message.ticketId} created
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    Our team will email you within 24 hours.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}