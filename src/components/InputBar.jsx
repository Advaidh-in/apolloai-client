import { useState } from 'react';
import { ArrowUp, ChevronLeft } from 'lucide-react';

export default function InputBar({ onSend, onBack, onSkip, disabled }) {
  const [text, setText] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text);
      setText('');
    }
  };

  return (
    <div className="sticky bottom-0 glass-panel border-t border-[var(--hairline)] p-[12px_20px] z-10">
      <div className="max-w-[720px] w-full mx-auto">
        {/* Back and Skip button row — shown above input when available */}
        {(onBack || onSkip) && (
          <div className="mb-2 flex items-center justify-between">
            <div>
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  disabled={disabled}
                  className="flex items-center gap-1.5 px-[10px] py-[5px] rounded-[8px] text-[12px] font-medium
                    bg-[var(--surface)] border border-[var(--hairline)] text-[var(--ink-secondary)]
                    hover:border-[var(--accent)] hover:text-[var(--accent-glow)] hover:bg-[var(--canvas-elevated)]
                    transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                  title="Go back and change your previous answer"
                >
                  <ChevronLeft size={14} />
                  Back
                </button>
              )}
            </div>
            <div>
              {onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  disabled={disabled}
                  className="flex items-center gap-1.5 px-[10px] py-[5px] rounded-[8px] text-[12px] font-medium
                    bg-[var(--surface)] border border-[var(--hairline)] text-[var(--ink-secondary)]
                    hover:border-[var(--accent)] hover:text-[var(--accent-glow)] hover:bg-[var(--canvas-elevated)]
                    transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95"
                  title="Skip this question and use the recommended selection"
                >
                  Skip / Next
                  <ChevronLeft size={14} className="rotate-180" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Text input row */}
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your response or pick an option above..."
            disabled={disabled}
            className="w-full bg-[var(--surface)] border border-[var(--hairline)] text-[var(--ink)] font-['Inter'] text-[14px] rounded-[10px] p-[10px_48px_10px_16px] focus:outline-none focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-muted)] disabled:opacity-50 transition-all placeholder:text-[var(--ink-muted)]"
          />
          <button 
            type="submit" 
            disabled={disabled || !text.trim()}
            className="absolute right-2 w-[28px] h-[28px] flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-glow)] text-white rounded-full transition-all active:scale-90 disabled:bg-[var(--surface)] disabled:opacity-40 cursor-pointer"
          >
            <ArrowUp size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
