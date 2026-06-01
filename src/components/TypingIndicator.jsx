import React from 'react';

export default function TypingIndicator() {
  return (
    <div className="flex justify-start mb-4 animate-message-in w-fit">
      <div className="bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded-[16px_16px_16px_4px] p-[12px_16px] w-fit flex items-center gap-1.5 shadow-[0_0_20px_var(--accent-muted)]">
        <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-ping" style={{animationDuration: '1s'}}></div>
        <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-ping" style={{animationDuration: '1s', animationDelay: '150ms'}}></div>
        <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-ping" style={{animationDuration: '1s', animationDelay: '300ms'}}></div>
      </div>
    </div>
  );
}
