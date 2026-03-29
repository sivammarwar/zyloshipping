'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Message, ChatResponse } from '@/types/chat';
import { MessageBubble } from './MessageBubble';
import { QuickReplyChips } from './QuickReplyChips';
import { TypingIndicator } from './TypingIndicator';
import { getToken } from '@/lib/tokenManager';

// ─── helpers ──────────────────────────────────────────────────────────────────
const generateId = () => Math.random().toString(36).slice(2, 10);

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

// ─── component ────────────────────────────────────────────────────────────────
export function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput]       = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── scroll to bottom whenever messages/typing change ──────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ── auto-resize textarea ──────────────────────────────────────────────────
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  // ── send message ──────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    setError(null);

    // Append user message
    const userMsg: Message = {
      id:        generateId(),
      role:      'user',
      content:   trimmed,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // ✅ Use tokenManager — reads 'auth_token' key, works for logged-in users
      const token = getToken();

      const res = await fetch(`${BACKEND_URL}/api/support/chat`, {
        method:      'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: trimmed }),
      });

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`);
      }

      const data: ChatResponse = await res.json();

      const aiMsg: Message = {
        id:            generateId(),
        role:          'ai',
        content:       data.reply,
        timestamp:     new Date(),
        requiresHuman: data.requiresHuman,
        ticketId:      data.ticketId,
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsOnline(true);
    } catch {
      setIsOnline(false);
      const fallback: Message = {
        id:        generateId(),
        role:      'ai',
        content:   "Sorry, I'm having trouble connecting right now. Please try again in a moment or email us at support@zyloshipping.com.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, fallback]);
      setError('Connection error — please try again.');
    } finally {
      setIsTyping(false);
    }
  }, [isTyping]);

  // ── keyboard submit ───────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const isEmpty = messages.length === 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#0F0F0F] text-white font-sans">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-5 py-4 border-b border-white/5 bg-[#111827]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Brand mark */}
            <div className="w-9 h-9 rounded-full bg-[#E53E3E] flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"
                  fill="white"
                />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">ZyloSupport</span>
                {isOnline && (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-green-400 font-medium">Online</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 mt-0.5">
                AI-powered · Usually replies instantly
              </p>
            </div>
          </div>

          {/* Clear chat */}
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="text-[11px] text-gray-600 hover:text-gray-400 transition-colors px-2 py-1 rounded hover:bg-white/5"
            >
              Clear chat
            </button>
          )}
        </div>
      </div>

      {/* ── Messages area ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-0 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">

        {/* Welcome state */}
        {isEmpty && (
          <div className="flex flex-col items-center text-center pt-8 pb-4 px-4">
            <div className="w-14 h-14 rounded-full bg-[#1A1A2E] border border-[#E53E3E]/30 flex items-center justify-center mb-4">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
                  fill="#E53E3E"
                />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-white mb-1">
              Hi there! 👋
            </h3>
            <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
              I'm ZyloSupport, your AI assistant. Ask me anything about your
              orders, returns, payments, or shipping.
            </p>
          </div>
        )}

        {/* Quick replies — only when no messages */}
        {isEmpty && (
          <div className="px-1">
            <QuickReplyChips onSelect={sendMessage} />
          </div>
        )}

        {/* Message list */}
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Typing indicator */}
        {isTyping && <TypingIndicator />}

        {/* Error banner */}
        {error && (
          <div className="mx-1 mb-3 px-4 py-2.5 bg-[#E53E3E]/10 border border-[#E53E3E]/30 rounded-xl">
            <p className="text-xs text-[#E53E3E]">{error}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ──────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-white/5 bg-[#111827]">
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send)"
              rows={1}
              disabled={isTyping}
              className="w-full resize-none bg-[#1A1A2E] border border-white/5 rounded-xl px-4 py-3
                text-sm text-white placeholder-gray-600
                focus:outline-none focus:border-[#E53E3E]/40 focus:ring-1 focus:ring-[#E53E3E]/20
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors scrollbar-none"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isTyping}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-[#E53E3E] flex items-center justify-center
              text-white shadow-sm
              hover:bg-[#C53030] active:scale-95
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[#E53E3E]
              transition-all duration-150"
            aria-label="Send message"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>

        <p className="text-[10px] text-gray-700 mt-2 text-center">
          Shift+Enter for new line · Powered by Groq AI
        </p>
      </div>
    </div>
  );
}