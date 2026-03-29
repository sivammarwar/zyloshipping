'use client';

interface QuickReplyChipsProps {
  onSelect: (message: string) => void;
}

const quickReplies = [
  { label: "Where's my order?", icon: '📦' },
  { label: 'Track my shipment', icon: '🚚' },
  { label: 'Return policy', icon: '↩️' },
  { label: 'Cancel my order', icon: '✕' },
  { label: 'Payment issue', icon: '💳' },
  { label: 'Talk to a human', icon: '👤' },
];

export function QuickReplyChips({ onSelect }: QuickReplyChipsProps) {
  return (
    <div className="mb-6">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
        Quick help
      </p>
      <div className="flex flex-wrap gap-2">
        {quickReplies.map(({ label, icon }) => (
          <button
            key={label}
            onClick={() => onSelect(label)}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
              bg-[#1A1A2E] border border-white/5 text-gray-300
              hover:border-[#E53E3E]/50 hover:text-white hover:bg-[#E53E3E]/10
              transition-all duration-150 active:scale-95"
          >
            <span className="text-sm leading-none">{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}