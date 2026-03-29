'use client';

export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-5">
      <div className="flex items-end gap-2.5">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-[#1A1A2E] border border-[#E53E3E]/40 flex items-center justify-center flex-shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"
              fill="white"
              opacity="0.9"
            />
          </svg>
        </div>

        {/* Dots bubble */}
        <div className="bg-[#1A1A2E] border border-white/5 px-4 py-3.5 rounded-2xl rounded-tl-sm shadow-sm">
          <div className="flex items-center gap-1.5">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="block w-1.5 h-1.5 rounded-full bg-[#E53E3E]/70 animate-bounce"
                style={{ animationDelay: `${delay}ms`, animationDuration: '900ms' }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}