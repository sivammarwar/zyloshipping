'use client';

export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-5">
      <div className="flex items-end gap-2.5">
        {/* Avatar */}
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-ink flex items-center justify-center text-xs font-semibold text-off-white">
          Z
        </div>

        {/* Dots bubble */}
        <div className="px-4 py-3.5 bg-ink rounded-xl rounded-bl-sm">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce-dot-1" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce-dot-2" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce-dot-3" />
          </div>
        </div>
      </div>
    </div>
  );
}