'use client';

import { useState, useRef, useEffect } from 'react';

// ── Types ─────────────────────────────────────────────────────
interface Message { role: 'user' | 'ai'; text: string; time: string; }

// ── Mock AI responses ─────────────────────────────────────────
const AI_RESPONSES: Record<string, string> = {
  default: "Hi! I'm Zylo AI. I can help you with orders, returns, shipping, and product questions. What can I help you with today?",
  order:   "I found your order #ZY-28431. It's currently in transit at Chicago, IL and is expected to be delivered by March 30, 2026. Is there anything specific you'd like to know?",
  return:  "Our return policy allows 7-day hassle-free returns. To start a return, please provide your order ID and the reason for the return. I can process this for you right now.",
  refund:  "Refunds are processed within 3–5 business days back to your original payment method. Would you like me to initiate a refund for a specific order?",
  shipping:"We offer free shipping on all orders over $49. Standard delivery takes 5–8 business days. Same-day dispatch is available for orders placed before 2 PM in major metro areas.",
  track:   "You can track your order by visiting the Track Order page or by telling me your order ID here. I'll pull up the real-time status for you instantly.",
};

function getAIResponse(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('order') || lower.includes('zy-')) return AI_RESPONSES.order;
  if (lower.includes('return') || lower.includes('refund')) return AI_RESPONSES.refund;
  if (lower.includes('ship') || lower.includes('deliver')) return AI_RESPONSES.shipping;
  if (lower.includes('track')) return AI_RESPONSES.track;
  return "Thanks for reaching out! Let me look into that for you. Could you share your order number so I can pull up the relevant details?";
}

const FAQ_ITEMS = [
  { q: 'How long does shipping take?', a: 'Standard delivery takes 5–8 business days worldwide. Same-day dispatch is available for orders placed before 2 PM in major cities. You\'ll receive SMS and email updates at every milestone.' },
  { q: 'What is your return policy?', a: 'We offer 7-day hassle-free returns from the delivery date. Items must be unused and in original packaging. Initiate a return via your Orders page or contact support.' },
  { q: 'Which payment methods do you accept?', a: 'We accept all major credit/debit cards (Visa, Mastercard, Amex), PayPal, Apple Pay, Google Pay, Klarna, and bank transfers across 135+ currencies.' },
  { q: 'How do I track my order?', a: 'Visit the Track Order page and enter your order ID (e.g. ZY-28431) or carrier tracking number. You\'ll see real-time location and estimated delivery date.' },
  { q: 'Can I change or cancel my order?', a: 'Orders can be modified or cancelled within 1 hour of placement. After that, the order is submitted to the supplier automatically. Contact support immediately if you need to cancel.' },
  { q: 'Is my payment information secure?', a: 'Yes — all payments are processed via Stripe with 256-bit SSL encryption. We are PCI DSS Level 1 compliant and never store your card details.' },
];

function nowTime() {
  return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function SupportPage() {
  const [tab, setTab]         = useState<'chat' | 'ticket' | 'faq'>('chat');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', text: AI_RESPONSES.default, time: nowTime() },
  ]);
  const [input, setInput]     = useState('');
  const [typing, setTyping]   = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [ticketSent, setTicketSent] = useState(false);
  const [ticket, setTicket]   = useState({ subject: '', email: '', orderId: '', message: '' });
  const messagesEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  function sendMessage() {
    if (!input.trim()) return;
    const userMsg: Message = { role: 'user', text: input, time: nowTime() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const reply = getAIResponse(userMsg.text);
      setMessages(prev => [...prev, { role: 'ai', text: reply, time: nowTime() }]);
      setTyping(false);
    }, 1100 + Math.random() * 600);
  }

  function submitTicket() {
    setTicketSent(true);
  }

  const QUICK_REPLIES = ['Where is my order?', 'Start a return', 'Refund status', 'Change my order'];

  return (
    <>
      <Header />

      <main style={{ paddingTop: '5rem', background: 'var(--off-white)', minHeight: '100vh' }}>

        {/* Page header */}
        <div style={{ background: 'var(--ink)', padding: '3rem 4vw 3.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 300, height: 300, borderRadius: '50%', background: 'var(--red)', opacity: 0.06 }} />
          <div style={{ maxWidth: 700, position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--red)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ display: 'inline-block', width: 16, height: 1, background: 'var(--red)' }} />
              Support Center
            </div>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: 'var(--white)', letterSpacing: '-0.025em', lineHeight: 1.08, marginBottom: '0.75rem' }}>
              How can we help?
            </h1>
            <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.5)', fontWeight: 300 }}>
              AI support replies in under 30 seconds · Human escalation always available
            </p>
          </div>
        </div>

        {/* Tab selector */}
        <div style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '0 4vw' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex' }}>
            {([
              { key: 'chat',   label: '💬 AI Chat',    desc: 'Instant' },
              { key: 'ticket', label: '📧 Email Ticket', desc: '< 2h' },
              { key: 'faq',    label: '❓ FAQ',         desc: 'Self-help' },
            ] as { key: typeof tab; label: string; desc: string }[]).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '1rem 1.5rem', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t.key ? 'var(--red)' : 'transparent'}`, color: tab === t.key ? 'var(--red)' : 'var(--ink-muted)', fontSize: '0.84rem', fontWeight: tab === t.key ? 500 : 300, cursor: 'pointer', fontFamily: 'var(--sans)', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', marginBottom: -1, transition: 'color 0.2s' }}>
                {t.label}
                <span style={{ fontSize: '0.65rem', color: tab === t.key ? 'var(--red)' : 'var(--ink-faint)', marginTop: '0.1rem' }}>{t.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '2.5rem 4vw 5rem', maxWidth: 900, margin: '0 auto' }}>

          {/* ── AI CHAT ── */}
          {tab === 'chat' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.5rem' }}>
              {/* Chat window */}
              <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, display: 'flex', flexDirection: 'column', height: 580 }}>
                {/* Chat header */}
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🤖</div>
                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--ink)' }}>Zylo AI Support</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.7rem', color: '#16a34a' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
                      Online · Avg response 28s
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {messages.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', gap: '0.65rem', alignItems: 'flex-end' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: msg.role === 'ai' ? 'var(--red)' : 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: msg.role === 'ai' ? '0.75rem' : '0.65rem', flexShrink: 0 }}>
                        {msg.role === 'ai' ? '🤖' : <span style={{ fontFamily: 'var(--serif)', color: 'white', fontWeight: 700 }}>U</span>}
                      </div>
                      <div>
                        <div style={{ padding: '0.65rem 0.9rem', borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px', background: msg.role === 'user' ? 'var(--ink)' : 'var(--off-white)', color: msg.role === 'user' ? 'white' : 'var(--ink)', fontSize: '0.85rem', lineHeight: 1.55, maxWidth: 340, fontWeight: 300 }}>
                          {msg.text}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--ink-faint)', marginTop: '0.25rem', textAlign: msg.role === 'user' ? 'right' : 'left' }}>{msg.time}</div>
                      </div>
                    </div>
                  ))}

                  {/* Typing indicator */}
                  {typing && (
                    <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-end' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>🤖</div>
                      <div style={{ padding: '0.65rem 0.9rem', background: 'var(--off-white)', borderRadius: '12px 12px 12px 2px', display: 'flex', gap: '4px', alignItems: 'center', height: 36 }}>
                        {[0, 1, 2].map(i => (
                          <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--ink-faint)', animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  <div ref={messagesEnd} />
                </div>

                {/* Input */}
                <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                    placeholder="Type a message…"
                    style={{ flex: 1, padding: '0.6rem 0.85rem', border: '1.5px solid var(--border)', borderRadius: 20, fontSize: '0.85rem', fontFamily: 'var(--sans)', outline: 'none', color: 'var(--ink)', transition: 'border-color 0.2s' }}
                    onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'}
                    onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  />
                  <button onClick={sendMessage} style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--red)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s, transform 0.15s', flexShrink: 0 }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-deep)'; e.currentTarget.style.transform = 'scale(1.05)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--red)'; e.currentTarget.style.transform = 'scale(1)'; }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 7L2 2l2.5 5L2 12l10-5z"/></svg>
                  </button>
                </div>
              </div>

              {/* Quick replies sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.75rem' }}>Quick Replies</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {QUICK_REPLIES.map(r => (
                      <button key={r} onClick={() => { setInput(r); }} style={{ padding: '0.6rem 0.85rem', background: 'var(--off-white)', border: '1px solid var(--border)', borderRadius: 2, fontSize: '0.8rem', color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)', textAlign: 'left', transition: 'all 0.15s', fontWeight: 300 }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.background = 'var(--red-light)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--ink-muted)'; e.currentTarget.style.background = 'var(--off-white)'; }}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.75rem' }}>Support Hours</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', lineHeight: 1.6, fontWeight: 300 }}>
                    <div>🤖 AI — 24/7</div>
                    <div>👤 Human — Mon–Fri</div>
                    <div style={{ color: 'var(--ink-faint)', fontSize: '0.72rem' }}>9 AM – 6 PM EST</div>
                  </div>
                </div>

                <button onClick={() => setTab('ticket')} style={{ padding: '0.7rem', background: 'none', border: '1.5px dashed var(--border)', borderRadius: 3, fontSize: '0.8rem', color: 'var(--ink-muted)', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all 0.15s', textAlign: 'center' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--ink-muted)'; }}>
                  Prefer email? Submit a ticket →
                </button>
              </div>
            </div>
          )}

          {/* ── EMAIL TICKET ── */}
          {tab === 'ticket' && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, padding: '2rem', maxWidth: 600 }}>
              {ticketSent ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 8px 24px rgba(196,30,58,0.25)' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>
                  </div>
                  <h3 style={{ fontFamily: 'var(--serif)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.5rem' }}>Ticket submitted!</h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--ink-muted)', fontWeight: 300 }}>We'll reply to <strong>{ticket.email}</strong> within 2 hours.</p>
                  <button onClick={() => { setTicketSent(false); setTicket({ subject: '', email: '', orderId: '', message: '' }); }} style={{ marginTop: '1.5rem', padding: '0.6rem 1.4rem', background: 'var(--red)', color: 'white', border: 'none', borderRadius: 2, fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'var(--sans)' }}>Submit another</button>
                </div>
              ) : (
                <>
                  <h2 style={{ fontFamily: 'var(--serif)', fontSize: '1.2rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '1.5rem' }}>Submit a Support Ticket</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[
                      { label: 'Email Address', key: 'email', type: 'email', ph: 'you@example.com' },
                      { label: 'Subject',       key: 'subject', type: 'text', ph: 'e.g. My order hasn\'t arrived' },
                      { label: 'Order ID (optional)', key: 'orderId', type: 'text', ph: 'e.g. ZY-28431' },
                    ].map(f => (
                      <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <label style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>{f.label}</label>
                        <input type={f.type} value={(ticket as any)[f.key]} onChange={e => setTicket(t => ({ ...t, [f.key]: e.target.value }))} placeholder={f.ph} style={{ padding: '0.65rem 0.85rem', border: '1.5px solid var(--border)', borderRadius: 2, fontSize: '0.88rem', fontFamily: 'var(--sans)', outline: 'none', color: 'var(--ink)' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
                      </div>
                    ))}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <label style={{ fontSize: '0.68rem', fontWeight: 500, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>Message</label>
                      <textarea value={ticket.message} onChange={e => setTicket(t => ({ ...t, message: e.target.value }))} placeholder="Describe your issue in detail…" rows={5} style={{ padding: '0.65rem 0.85rem', border: '1.5px solid var(--border)', borderRadius: 2, fontSize: '0.88rem', fontFamily: 'var(--sans)', outline: 'none', color: 'var(--ink)', resize: 'vertical' }} onFocus={e => e.currentTarget.style.borderColor = 'var(--red)'} onBlur={e => e.currentTarget.style.borderColor = 'var(--border)'} />
                    </div>
                    <button onClick={submitTicket} style={{ padding: '0.8rem', background: 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 2, fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)', boxShadow: '0 4px 18px rgba(196,30,58,0.22)', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--red-deep)'} onMouseLeave={e => e.currentTarget.style.background = 'var(--red)'}>
                      Send ticket
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── FAQ ── */}
          {tab === 'faq' && (
            <div style={{ maxWidth: 700 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {FAQ_ITEMS.map((item, i) => (
                  <div key={i} style={{ background: 'var(--white)', border: `1.5px solid ${openFaq === i ? 'var(--red-mid)' : 'var(--border)'}`, borderRadius: 4, overflow: 'hidden', transition: 'border-color 0.2s' }}>
                    <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', padding: '1.1rem 1.25rem', background: 'none', border: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--sans)' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--ink)', lineHeight: 1.4 }}>{item.q}</span>
                      <span style={{ color: 'var(--red)', fontSize: '1.2rem', transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0)', transition: 'transform 0.2s', flexShrink: 0 }}>+</span>
                    </button>
                    {openFaq === i && (
                      <div style={{ padding: '0 1.25rem 1.1rem', fontSize: '0.85rem', color: 'var(--ink-muted)', lineHeight: 1.7, fontWeight: 300, borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                        {item.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 4, textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--serif)', fontWeight: 700, color: 'var(--ink)', marginBottom: '0.4rem' }}>Still have questions?</div>
                <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', fontWeight: 300, marginBottom: '1rem' }}>Our AI responds in under 30 seconds, any time of day.</p>
                <button onClick={() => setTab('chat')} style={{ padding: '0.65rem 1.5rem', background: 'var(--red)', color: 'var(--white)', border: 'none', borderRadius: 2, fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)' }}>
                  Chat with AI Support
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 280px"] { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </>
  );
}