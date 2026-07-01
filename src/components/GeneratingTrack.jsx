import { useState, useEffect } from 'react';

export default function GeneratingTrack() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const timeLabel = mins > 0
    ? `${mins}m ${secs}s elapsed`
    : `${secs}s elapsed`;

  return (
    <div className="flex w-full justify-start animate-message-in">
      <div className="w-[28px] h-[28px] shrink-0 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-glow)] flex items-center justify-center mr-3 mt-1 shadow-[0_0_10px_var(--accent-muted)]">
        <span className="text-[11px] font-bold text-white font-['Inter']">A</span>
      </div>
      <div className="bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded-[16px_16px_16px_4px] max-w-[600px] p-[16px_24px] flex items-center gap-4">

        {/* Animated Waveform */}
        <div className="flex items-end gap-1 h-[28px]">
          <div className="w-[4px] bg-[var(--wave)] rounded-full animate-pulse h-[16px]"></div>
          <div className="w-[4px] bg-[var(--wave)] rounded-full animate-pulse h-[28px]" style={{ animationDelay: '150ms' }}></div>
          <div className="w-[4px] bg-[var(--wave)] rounded-full animate-pulse h-[12px]" style={{ animationDelay: '300ms' }}></div>
          <div className="w-[4px] bg-[var(--wave)] rounded-full animate-pulse h-[24px]" style={{ animationDelay: '450ms' }}></div>
          <div className="w-[4px] bg-[var(--wave)] rounded-full animate-pulse h-[18px]" style={{ animationDelay: '600ms' }}></div>
        </div>

        <div>
          <div className="text-[14px] text-[var(--ink-secondary)] font-['Inter'] mb-1">
            Composing your track...
          </div>
          <div className="text-[12px] text-[var(--ink-muted)] font-['Inter'] font-mono">
            {timeLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
