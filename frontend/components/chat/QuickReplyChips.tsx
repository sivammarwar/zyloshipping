'use client';

interface QuickReplyChipsProps {
  onSelect: (message: string) => void;
}

const QUICK_REPLIES = [
  { label: "Where's my order?",  emoji: '📦' },
  { label: 'Return policy',      emoji: '↩️'  },
  { label: 'Payment issue',      emoji: '💳' },
  { label: 'Track my shipment',  emoji: '🚚' },
];

export function QuickReplyChips({ onSelect }: QuickReplyChipsProps) {
  return (
    <div className="mb-6">
      <p className="text-label uppercase tracking-wider text-ink-faint mb-3">
        Common questions
      </p>
      <div className="flex flex-wrap gap-2">
        {QUICK_REPLIES.map(({ label, emoji }) => (
          <button
            key={label}
            onClick={() => onSelect(label)}
            className="
              flex items-center gap-1.5 px-3.5 py-2
              bg-off-white hover:bg-border
              border border-border hover:border-ink-faint
              text-ink text-body-sm rounded-full
              transition-all duration-150
            "
          >
            <span>{emoji}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}