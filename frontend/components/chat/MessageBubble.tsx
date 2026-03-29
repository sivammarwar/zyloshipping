'use client';

import { Message } from '@/types/chat';
import { formatDistanceToNow } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isAI = message.role === 'ai';

  return (
    <div className={`flex ${isAI ? 'justify-start' : 'justify-end'} mb-5`}>
      <div className={`flex items-end gap-2.5 max-w-[78%] sm:max-w-[85%] ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>

        {/* Avatar */}
        <div className={`
          flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold
          ${isAI
            ? 'bg-ink text-off-white'
            : 'bg-red text-white'}
        `}>
          {isAI ? 'Z' : 'U'}
        </div>

        {/* Bubble + meta */}
        <div className={`flex flex-col gap-1 ${isAI ? 'items-start' : 'items-end'}`}>
          <div className={`
            px-4 py-3 rounded-xl text-body-sm leading-relaxed
            ${isAI
              ? 'bg-ink text-off-white rounded-bl-sm'
              : 'bg-red text-white rounded-br-sm'}
          `}>
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>

          <span className="text-label text-ink-faint px-1">
            {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
          </span>

          {/* Human escalation notice */}
          {message.requiresHuman && message.ticketId && (
            <div className="mt-1 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg max-w-full">
              <p className="text-caption text-amber-800 leading-snug">
                🎫 Ticket <span className="font-semibold">#{message.ticketId}</span> created.
                <br />Our team will reach out within 24 hours.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}