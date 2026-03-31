'use client';

import { useCompare } from '@/context/CompareContext';

function PlaceholderThumb() {
  return (
    <svg viewBox="0 0 40 40" fill="none" width="40" height="40">
      <rect x="4" y="10" width="32" height="24" rx="2" fill="var(--red-light)" stroke="var(--red-mid)" strokeWidth="1.2" />
      <circle cx="20" cy="22" r="5" fill="var(--red)" opacity="0.2" />
      <circle cx="20" cy="22" r="2.5" fill="var(--red)" />
    </svg>
  );
}

export default function CompareBar() {
  const { items, remove, clear, openModal } = useCompare();

  if (items.length < 2) return null;

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          background: 'var(--ink)',
          borderTop: '2px solid var(--red)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.22)',
          animation: 'slideUp 0.28s cubic-bezier(0.22,1,0.36,1)',
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: '0.75rem 4vw',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          {/* Label */}
          <div style={{ fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--red)', marginRight: '0.5rem', whiteSpace: 'nowrap' }}>
            Comparing {items.length}/3
          </div>

          {/* Product thumbnails */}
          <div style={{ display: 'flex', gap: '0.75rem', flex: 1, overflowX: 'auto' }}>
            {items.map(p => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 3,
                  padding: '0.4rem 0.5rem 0.4rem 0.4rem',
                  minWidth: 0,
                  flexShrink: 0,
                  maxWidth: 200,
                }}
              >
                {/* Thumb */}
                <div style={{ width: 40, height: 40, borderRadius: 2, overflow: 'hidden', flexShrink: 0, background: 'var(--red-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <PlaceholderThumb />
                  )}
                </div>

                {/* Name + price */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 500, color: 'var(--white)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 110 }}>{p.name}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--red)', fontWeight: 600 }}>${p.price.toFixed(2)}</div>
                </div>

                {/* Remove */}
                <button
                  onClick={() => remove(p.id)}
                  aria-label={`Remove ${p.name} from comparison`}
                  style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--white)', fontSize: '0.75rem', lineHeight: 1, transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--red)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                >
                  ×
                </button>
              </div>
            ))}

            {/* Empty slot indicators */}
            {items.length < 3 && Array.from({ length: 3 - items.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                style={{
                  width: 140,
                  height: 58,
                  border: '1.5px dashed rgba(255,255,255,0.15)',
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  color: 'rgba(255,255,255,0.25)',
                  flexShrink: 0,
                  letterSpacing: '0.05em',
                }}
              >
                + add product
              </div>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.6rem', flexShrink: 0 }}>
            <button
              onClick={clear}
              style={{ padding: '0.5rem 0.9rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 2, color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.5)'; e.currentTarget.style.color = 'var(--white)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
            >
              Clear all
            </button>
            <button
              onClick={openModal}
              style={{ padding: '0.5rem 1.25rem', background: 'var(--red)', border: 'none', borderRadius: 2, color: 'var(--white)', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--sans)', letterSpacing: '0.02em', transition: 'background 0.15s', boxShadow: '0 2px 12px rgba(196,30,58,0.35)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--red-deep)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--red)'}
            >
              Compare now →
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
