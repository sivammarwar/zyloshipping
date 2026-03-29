'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { QuickReplyChips } from '@/components/chat/QuickReplyChips';
import { sendChatMessage, getChatHistory } from '@/lib/api/chat';
import { getUserFromToken } from '@/lib/tokenManager';
import type { Message } from '@/types/chat';

const MAX_CHARS = 500;

export default function SupportPage() {
  const [messages, setMessages]           = useState<Message[]>([]);
  const [input, setInput]                 = useState('');
  const [isLoading, setIsLoading]         = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const router         = useRouter();

  /* ── Auth guard ──────────────────────────────────────────── */
  useEffect(() => {
    const user = getUserFromToken();
    if (!user) router.push('/login?redirect=/support');
  }, [router]);

  /* ── Load history ────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      try {
        const history = await getChatHistory();
        if (history.conversations.length > 0) {
          const msgs: Message[] = history.conversations.flatMap(conv => [
            {
              id:        `${conv.ticketId}-user`,
              role:      'user' as const,
              content:   conv.userMessage,
              timestamp: new Date(conv.timestamp),
            },
            {
              id:        `${conv.ticketId}-ai`,
              role:      'ai' as const,
              content:   conv.aiReply || 'Processing…',
              timestamp: new Date(conv.timestamp),
              ticketId:  conv.ticketNumber,
            },
          ]);
          setMessages(msgs);
          setShowQuickReplies(false);
        }
      } catch {
        // silently ignore – fresh session
      } finally {
        setHistoryLoading(false);
      }
    })();
  }, []);

  /* ── Auto-scroll ─────────────────────────────────────────── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  /* ── Auto-resize textarea ────────────────────────────────── */
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  /* ── Send message ────────────────────────────────────────── */
  const handleSend = useCallback(async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isLoading) return;

    setShowQuickReplies(false);
    setInput('');

    const userMsg: Message = {
      id:        Date.now().toString(),
      role:      'user',
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const res = await sendChatMessage(content);

      const aiMsg: Message = {
        id:            (Date.now() + 1).toString(),
        role:          'ai',
        content:       res.reply,
        timestamp:     new Date(),
        requiresHuman: res.requiresHuman,
        ticketId:      res.ticketId,
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const errMsg: Message = {
        id:            (Date.now() + 1).toString(),
        role:          'ai',
        content:       "Sorry, I'm having trouble right now. Please try again or email us at support@zyloshipping.com.",
        timestamp:     new Date(),
        requiresHuman: true,
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setShowQuickReplies(true);
    setInput('');
  };

  const charsLeft = MAX_CHARS - input.length;
  const canSend   = input.trim().length > 0 && !isLoading && charsLeft >= 0;

  return (
    <div className="min-h-screen bg-off-white">
      <div className="max-w-3xl mx-auto px-4 py-6 sm:py-8 flex flex-col" style={{ minHeight: '100dvh' }}>

        {/* ── Header ─────────────────────────────────────────── */}
        <header className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-eyebrow uppercase tracking-widest text-ink-faint mb-1">
              ZyloShipping
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl text-ink tracking-tightest">
              Support
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Live status */}
            <div className="hidden sm:flex items-center gap-1.5 text-caption text-ink-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              AI online
            </div>

            <button
              onClick={handleNewChat}
              className="
                px-3.5 py-1.5 text-body-sm font-medium
                border border-border hover:border-ink-faint
                text-ink-muted hover:text-ink
                rounded-md transition-all duration-150
              "
            >
              New chat
            </button>
          </div>
        </header>

        {/* ── Chat window ────────────────────────────────────── */}
        <div className="flex-1 flex flex-col bg-white border border-border rounded-xl shadow-soft-sm overflow-hidden">

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4" style={{ minHeight: 0 }}>

            {historyLoading ? (
              <div className="flex items-center justify-center h-32">
                <span className="w-5 h-5 rounded-full border-2 border-ink border-t-transparent animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              /* Welcome state */
              <div className="pt-6 pb-4">
                <div className="mb-8">
                  <div className="w-10 h-10 rounded-full bg-ink flex items-center justify-center text-off-white text-sm font-semibold mb-4">
                    Z
                  </div>
                  <p className="font-serif text-xl text-ink tracking-tight mb-1">
                    Hi, I'm ZyloBot.
                  </p>
                  <p className="text-body text-ink-muted">
                    Ask me anything about your orders, returns, or shipments.
                  </p>
                </div>

                {showQuickReplies && (
                  <QuickReplyChips onSelect={handleSend} />
                )}
              </div>
            ) : (
              messages.map(msg => (
                <MessageBubble key={msg.id} message={msg} />
              ))
            )}

            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Input bar ──────────────────────────────────────── */}
          <div className="border-t border-border bg-white px-4 py-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value.slice(0, MAX_CHARS))}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                disabled={isLoading}
                rows={1}
                className="
                  flex-1 resize-none bg-off-white
                  border border-border focus:border-ink-faint
                  rounded-lg px-3.5 py-2.5
                  text-body text-ink placeholder:text-ink-faint
                  focus:outline-none transition-colors duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
                style={{ minHeight: '44px', maxHeight: '120px' }}
              />

              {/* Send button */}
              <button
                onClick={() => handleSend()}
                disabled={!canSend}
                aria-label="Send message"
                className="
                  flex-shrink-0 w-10 h-10 rounded-lg
                  bg-red hover:bg-red-deep
                  disabled:bg-border disabled:cursor-not-allowed
                  text-white flex items-center justify-center
                  transition-colors duration-150
                "
              >
                {isLoading ? (
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </div>

            {/* Char counter — only show when close to limit */}
            {charsLeft < 100 && (
              <p className={`text-label mt-1.5 text-right ${charsLeft < 20 ? 'text-red' : 'text-ink-faint'}`}>
                {charsLeft} left
              </p>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-label text-ink-faint mt-3">
          Shift + Enter for new line · Enter to send
        </p>
      </div>
    </div>
  );
}